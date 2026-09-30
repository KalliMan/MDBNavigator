using MDBNavigator.DAL.Enums;
namespace MDBNavigator.DAL.Core
{
    internal class DBConnectionType
    {
        static public IDictionary<string, ServerType> ConnectionTypes = new Dictionary<string, ServerType>()
        {
            {
                "PostgreSQL", ServerType.PostgreSQL
            },
            {
                "MS SQL Server", ServerType.MSSQLServer
            },
        };
    }
}
