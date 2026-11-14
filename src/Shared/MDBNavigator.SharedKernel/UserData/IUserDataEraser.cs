namespace MDBNavigator.SharedKernel.UserData
{
    // Each module removes what it keeps about a user. Called when an account is deleted, before the account itself
    // goes, so a failure can leave an account without its data but never data without its account.
    public interface IUserDataEraser
    {
        Task EraseAsync(string userId, CancellationToken cancellationToken);
    }
}
