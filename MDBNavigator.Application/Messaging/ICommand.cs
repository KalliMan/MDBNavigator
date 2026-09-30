using MediatR;

namespace MDBNavigator.Application.Messaging
{
    public interface ICommand<out TResponse> : IRequest<TResponse> { }
}
