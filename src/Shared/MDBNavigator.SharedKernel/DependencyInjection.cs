using FluentValidation;
using MDBNavigator.SharedKernel.Behaviors;
using MDBNavigator.SharedKernel.Messaging;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace MDBNavigator.SharedKernel
{
    public static class DependencyInjection
    {
        private static readonly Type[] HandlerInterfaces =
        {
            typeof(ICommandHandler<,>),
            typeof(ICommandHandler<>),
            typeof(IQueryHandler<,>),
        };

        // Registers every handler and validator of the assembly. Each module calls it for its own assembly; the
        // decorators are added once for all of them by AddHandlerDecorators.
        public static IServiceCollection AddHandlersFromAssembly(this IServiceCollection services, Assembly assembly)
        {
            services.AddValidatorsFromAssembly(assembly, includeInternalTypes: true);

            var registrations =
                from type in assembly.GetTypes()
                where type is { IsClass: true, IsAbstract: false, IsGenericTypeDefinition: false }
                from @interface in type.GetInterfaces()
                where @interface.IsGenericType && HandlerInterfaces.Contains(@interface.GetGenericTypeDefinition())
                select (@interface, type);

            foreach (var (@interface, type) in registrations)
            {
                services.AddScoped(@interface, type);
            }

            return services;
        }

        // Wraps every registered handler. Call once, after all modules are registered (a second call would wrap
        // the handlers twice). An action that takes a handler receives: logging, then validation, then the handler.
        public static IServiceCollection AddHandlerDecorators(this IServiceCollection services)
        {
            // Applied inner-first: the last decorator applied is the outermost.
            services.Decorate(typeof(ICommandHandler<,>), typeof(ValidationDecorator.CommandHandler<,>));
            services.Decorate(typeof(ICommandHandler<>), typeof(ValidationDecorator.CommandBaseHandler<>));
            services.Decorate(typeof(IQueryHandler<,>), typeof(ValidationDecorator.QueryHandler<,>));

            services.Decorate(typeof(ICommandHandler<,>), typeof(LoggingDecorator.CommandHandler<,>));
            services.Decorate(typeof(ICommandHandler<>), typeof(LoggingDecorator.CommandBaseHandler<>));
            services.Decorate(typeof(IQueryHandler<,>), typeof(LoggingDecorator.QueryHandler<,>));

            return services;
        }

        // Replaces every registration of a closed openInterface with openDecorator wrapping the original implementation.
        private static void Decorate(this IServiceCollection services, Type openInterface, Type openDecorator)
        {
            for (var i = 0; i < services.Count; i++)
            {
                var descriptor = services[i];
                if (descriptor.IsKeyedService
                    || !descriptor.ServiceType.IsGenericType
                    || descriptor.ServiceType.GetGenericTypeDefinition() != openInterface)
                {
                    continue;
                }

                var decoratorType = openDecorator.MakeGenericType(descriptor.ServiceType.GetGenericArguments());
                services[i] = ServiceDescriptor.Describe(
                    descriptor.ServiceType,
                    sp => ActivatorUtilities.CreateInstance(sp, decoratorType, CreateInner(sp, descriptor)),
                    descriptor.Lifetime);
            }
        }

        private static object CreateInner(IServiceProvider sp, ServiceDescriptor descriptor) =>
            descriptor.ImplementationInstance
            ?? descriptor.ImplementationFactory?.Invoke(sp)
            ?? ActivatorUtilities.CreateInstance(sp, descriptor.ImplementationType!);
    }
}
