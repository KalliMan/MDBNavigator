using MDBNavigator.BL.DTOs;
using Models.Command;

namespace MDBNavigator.BL.Services
{
    public interface ICommandExecutionService
    {
        Task<DatabaseSingleCommandResultDto> GetTopNTableRecords(string id, string sessionId, string connectionId, string databaseName, string schema, string table, int? recordsNumber);
        Task<DatabaseSingleCommandResultDto> ExecuteSingleQuery(string sessionId, string connectionId, string id, string databaseName, string cmdQuery);
        Task<DatabaseCommandResultDto> ExecuteQuery(string sessionId, string connectionId, string id, string databaseName, string cmdQuery);
    }
}