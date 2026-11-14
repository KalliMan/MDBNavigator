namespace MDBNavigator.SharedKernel.Messaging
{
    // A request that changes state and returns no value.
    public interface ICommand { }

    // A request that changes state and returns TResponse.
    public interface ICommand<TResponse> { }
}
