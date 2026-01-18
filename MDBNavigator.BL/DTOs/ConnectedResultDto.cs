using MDBNavigator.DAL.Enums;
namespace MDBNavigator.BL.DTOs
{
    public class ConnectedResultDto
    {
        public required string ConnectionId { get; set; }

        public required string ConnectionName { get; set; }
        public required string ServerName { get; set; }
        public int Port { get; set; }
        public required ServerType ServerType { get; set; }
        public required string UserName { get; set; }
    }
}
