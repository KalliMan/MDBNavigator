using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs.Command;
using MDBNavigator.Application.Messaging;
using MediatR;
using Newtonsoft.Json;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.ExecuteSingleQuery
{
    public record ExecuteSingleQueryQuery(string SessionId, string ConnectionId, string Id, string DatabaseName, string CmdQuery)
        : IQuery<DatabaseSingleCommandResultDto>;

    public class ExecuteSingleQueryHandler : IRequestHandler<ExecuteSingleQueryQuery, DatabaseSingleCommandResultDto>
    {
        private readonly IConnectionCache _cache;
        private readonly IDatabaseProviderFactory _factory;

        public ExecuteSingleQueryHandler(IConnectionCache cache, IDatabaseProviderFactory factory)
        {
            _cache = cache;
            _factory = factory;
        }

        public async Task<DatabaseSingleCommandResultDto> Handle(ExecuteSingleQueryQuery request, CancellationToken cancellationToken)
        {
            await using var provider = await HandlerHelper.CreateProviderAsync(_cache, _factory, request.SessionId, request.ConnectionId, request.DatabaseName);
            var raw = await provider.ExecuteSingleQuery(request.CmdQuery);

            return new DatabaseSingleCommandResultDto
            {
                Id = request.Id,
                RecordsAffected = raw.RecordsAffected,
                RowCount = raw.Result.Rows.Count,
                Fields = Enumerable.Range(0, raw.Result.Columns.Count).Select(i => new DatabaseCommandResultFieldDto
                {
                    Index = i,
                    FieldName = raw.Result.Columns[i].ColumnName,
                    FieldType = raw.Result.Columns[i].DataType.Name,
                    FieldDataTypeName = raw.Result.Columns[i].DataType.FullName ?? raw.Result.Columns[i].DataType.ToString()
                }).ToList(),
                ResultJson = JsonConvert.SerializeObject(Enumerable.Range(0, raw.Result.Rows.Count).Select(i => raw.Result.Rows[i].ItemArray))
            };
        }
    }
}
