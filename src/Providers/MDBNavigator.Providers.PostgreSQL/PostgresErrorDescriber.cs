using MDBNavigator.Providers.Abstractions;
using MDBNavigator.Providers.Abstractions.Queries;
using Npgsql;

namespace MDBNavigator.Providers.PostgreSQL
{
    // "2BP01: cannot drop table tbl because other objects depend on it
    //  DETAIL: view vw_tbl depends on table tbl
    //  HINT: Use DROP ... CASCADE to drop the dependent objects too.
    //  QUERY: the statement a function was running, when the error is inside a function
    //  CONTEXT: the chain of calls, as psql shows it"
    public class PostgresErrorDescriber : IDatabaseErrorDescriber
    {
        public string Describe(Exception exception)
        {
            if (exception is not PostgresException pg)
            {
                return exception.Message;
            }

            var message = $"{pg.SqlState}: {pg.MessageText}";
            if (!string.IsNullOrWhiteSpace(pg.Detail))
            {
                message += $"\nDETAIL: {pg.Detail}";
            }
            if (!string.IsNullOrWhiteSpace(pg.Hint))
            {
                message += $"\nHINT: {pg.Hint}";
            }
            // For an error inside a function: the statement the function was running, and the chain of calls, as psql shows them.
            if (!string.IsNullOrWhiteSpace(pg.InternalQuery))
            {
                message += $"\nQUERY: {pg.InternalQuery}";
            }
            if (!string.IsNullOrWhiteSpace(pg.Where))
            {
                message += $"\nCONTEXT: {pg.Where}";
            }
            return message;
        }

        // 25006 is what a write in demo_reader's read-only transactions hits first, before any privilege check.
        // 57014 also means a user's Cancel, but a cancelled run never gets here (QueryExecution handles it before).
        public DatabaseErrorKind Classify(Exception exception) => exception is PostgresException pg
            ? pg.SqlState switch
            {
                PostgresErrorCodes.InsufficientPrivilege or PostgresErrorCodes.ReadOnlySqlTransaction => DatabaseErrorKind.PermissionDenied,
                PostgresErrorCodes.QueryCanceled or PostgresErrorCodes.ConfigurationLimitExceeded or PostgresErrorCodes.TooManyConnections
                    => DatabaseErrorKind.LimitReached,
                _ => DatabaseErrorKind.Other
            }
            : DatabaseErrorKind.Other;

        public int? OffsetInScript(Exception exception, string script, StatementStarted statement)
        {
            // Position: 1-based, in characters of the text that was sent; 0 when PostgreSQL gave none. InternalPosition
            // (a query run inside a function) is not a place in the user's text: the QUERY and CONTEXT lines cover it.
            if (exception is not PostgresException { Position: > 0 } pg)
            {
                return null;
            }

            // Characters into the statement's own text. Below 0: the place is in what the provider put in front.
            var characters = pg.Position - 1 - statement.PrefixLength;
            if (characters < 0 || statement.Offset < 0 || statement.Offset > script.Length)
            {
                return null;
            }

            // PostgreSQL counts characters; a string counts UTF-16 units, where an emoji is two.
            var index = statement.Offset;
            for (; characters > 0 && index < script.Length; characters--)
            {
                index += char.IsSurrogatePair(script, index) ? 2 : 1;
            }

            // index == script.Length is a real answer: "syntax error at end of input" points one past the last character.
            return characters == 0 ? index : null;
        }
    }
}
