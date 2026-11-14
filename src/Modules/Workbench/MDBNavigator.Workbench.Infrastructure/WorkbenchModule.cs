using MDBNavigator.Connections.Contracts;
using MDBNavigator.SharedKernel.UserData;
using MDBNavigator.Workbench.Application.Queries;
using MDBNavigator.Workbench.Infrastructure.QueryRuns;
using MDBNavigator.Workbench.Infrastructure.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json.Serialization;

namespace MDBNavigator.Workbench.Infrastructure
{
    public static class WorkbenchModule
    {
        public static IServiceCollection AddWorkbenchModule(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddWorkbenchCore();

            services.AddSingleton(
                configuration.GetSection(QueryExecutionOptions.SectionName).Get<QueryExecutionOptions>() ?? new QueryExecutionOptions());
            services.AddSingleton(
                configuration.GetSection(QueryLimitOptions.SectionName).Get<QueryLimitOptions>() ?? new QueryLimitOptions());

            services.AddSingleton<IQueryRunQueue, QueryRunQueue>();
            services.AddSingleton<ICommandExecutionRegistry, CommandExecutionRegistry>();
            services.AddSingleton<RunningQueriesCleanup>();
            services.AddSingleton<IConnectionClosedListener>(sp => sp.GetRequiredService<RunningQueriesCleanup>());
            services.AddSingleton<IUserDataEraser>(sp => sp.GetRequiredService<RunningQueriesCleanup>());
            services.AddScoped<IBatchNotifier, BatchNotifier>();
            services.AddHostedService<QueryRunHostedService>();
            services.AddSignalR()
                .AddJsonProtocol(o => o.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

            return services;
        }
    }
}
