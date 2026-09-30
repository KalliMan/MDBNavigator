using MDBNavigator.DAL.Core;
using MDBNavigator.DAL.Interfaces;
using Models.Connect;

namespace MDBNavigator.DAL
{
    public sealed class DBServerFactory : IDBServerFactory
    {
        public IDBServerBase Create(ConnectionSettings details)
        {
            if (!DBConnectionType.ConnectionTypes.TryGetValue(details.ServerType, out var connectionType))
            {
                throw new NotSupportedException($"Unsupported server type '{details.ServerType}'.");
            }

            return connectionType switch
            {
                Enums.ServerType.PostgreSQL => new PostgreSQL.PostgreSQLServer(),
                Enums.ServerType.MSSQLServer => throw new NotSupportedException("MS SQL Server provider is not implemented yet."),
                _ => throw new NotSupportedException($"Server type '{connectionType}' is not supported."),
            };
        }
    }
}