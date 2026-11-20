using MDBNavigator.Providers.Abstractions;
using Npgsql;

namespace MDBNavigator.Providers.PostgreSQL
{
    // "2BP01: cannot drop table tbl because other objects depend on it
    //  DETAIL: view vw_tbl depends on table tbl
    //  HINT: Use DROP ... CASCADE to drop the dependent objects too."
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
    }
}
