using MDBNavigator.Application.Contracts;
using Npgsql;

namespace MDBNavigator.Infrastructure.PostgreSQL
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
    }
}
