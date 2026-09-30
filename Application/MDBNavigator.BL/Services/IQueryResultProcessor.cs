using MDBNavigator.BL.DTOs;
using Models.Command;
using System.Data;

namespace MDBNavigator.BL.Services
{
    public interface IQueryResultProcessor
    {
        DatabaseSingleCommandResultDto ProcessQueryResult(string sessionId, string commandId, string id, DataTable rawResult);
    }
}