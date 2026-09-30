using MDBNavigator.Domain.Enums;

namespace MDBNavigator.Infrastructure.Connection
{
    internal static class DBConnectionType
    {
        public static readonly IDictionary<string, ServerType> ConnectionTypes = new Dictionary<string, ServerType>
        {
            { "PostgreSQL", ServerType.PostgreSQL },
            { "MS SQL Server", ServerType.MSSQLServer }
        };
    }
}
