using MDBNavigator.Workbench.Application.Queries.RunQuery;
using System.Text.Json.Serialization;

namespace MDBNavigator.API.DTOs
{
    public record DatabaseSQLCommandQuery
    {
        public required string ConnectionId { get; set; }
        public required string DatabaseName {  get; set; }
        public required string CmdQuery { get; set; }
        // Unique per run of a streamed query; identifies the run for cancel and in all hub messages.
        public required string ExecutionId { get; set; }
        // Optional: "Estimate" or "Analyze" asks for the plan of one statement instead of running the script.
        [JsonConverter(typeof(JsonStringEnumConverter<QueryPlanMode>))]
        public QueryPlanMode Plan { get; init; } = QueryPlanMode.None;
    }
}
