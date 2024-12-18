namespace MDBNavigator.API.DTOs
{
    public class CommandQueryDto
    {
        public Guid Id { get; set; }
        public required string DatabaseName {  get; set; }
        public required string Query { get; set; }
    }
}
