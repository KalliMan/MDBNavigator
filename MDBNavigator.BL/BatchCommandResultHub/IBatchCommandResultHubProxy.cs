using Models.Command;

namespace MDBNavigator.BL.BatchCommandResultHub
{
    public interface IBatchCommandResultHubProxy
    {
        Task SendBatchCommandResult(DatabaseCommandBatchResultDto command, string applicationId);
    }
}
