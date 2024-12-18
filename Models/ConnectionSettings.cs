namespace Models
{
    public class ConnectionSettings
    {
        public required string ServerType { get; set; }
        public required string ServerName { get; set; }
        public required string DatabaseName {  get; set; }
        public int Port { get; set; }
        public required string UserName { get; set; }
        public required string Password { get; set; }        
    }
}
