using MDBNavigator.DAL.Enums;
namespace MDBNavigator.BL.DTOs
{
    public class ConnectedResultDto
    {
        public string ConnectionId { get; set; } = string.Empty;
        public ServerType ServerType { get; set; }
        public string ServerName { get; set; } = string.Empty;
    }
}
