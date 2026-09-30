using MediatR;

namespace MDBNavigator.Application.Messaging
{
    public interface IQuery<out TResponse> : IRequest<TResponse> { }
}
