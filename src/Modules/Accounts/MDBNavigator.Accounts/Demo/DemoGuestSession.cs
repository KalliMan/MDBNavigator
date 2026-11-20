namespace MDBNavigator.Accounts.Demo
{
    // One demo session: which visitor, which throwaway account, until when. The row outlives the account (no foreign key
    // to it), so the sessions per day still count after the account is gone. Ending a session early sets EndsAtUtc to
    // the time it ended.
    public class DemoGuestSession
    {
        public Guid Id { get; set; } = Guid.CreateVersion7();
        public Guid VisitorId { get; set; }
        public Guid UserId { get; set; }
        public DateTime StartedAtUtc { get; set; }
        public DateTime EndsAtUtc { get; set; }
    }
}
