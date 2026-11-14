using MDBNavigator.SharedKernel;
using MDBNavigator.Workbench.Application.Queries;
using Microsoft.Extensions.DependencyInjection;

namespace MDBNavigator.Workbench
{
    public static class DependencyInjection
    {
        // Handlers, validators and the query run. Called by AddWorkbenchModule.
        public static IServiceCollection AddWorkbenchCore(this IServiceCollection services)
        {
            services.AddHandlersFromAssembly(typeof(DependencyInjection).Assembly);
            services.AddScoped<QueryExecution>();
            return services;
        }
    }
}
