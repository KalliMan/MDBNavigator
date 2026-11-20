namespace MDBNavigator.Accounts.Demo
{
    // Someone who confirmed their email through a demo link at least once. Created when the first link is used, not
    // when the form is sent, so the list holds only addresses whose owner clicked. Deleted DemoTerms.VisitorRetentionDays
    // after the last visit (DemoCleanup).
    public class DemoVisitor
    {
        public const int NameMaxLength = 100;
        public const int EmailMaxLength = 256;

        public Guid Id { get; set; } = Guid.CreateVersion7();
        public required string Name { get; set; }
        public required string Email { get; set; }
        public required string NormalizedEmail { get; set; }
        public required string TermsVersion { get; set; }
        public DateTime TermsAcceptedAtUtc { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime LastVisitAtUtc { get; set; }
        public int VisitCount { get; set; }
    }
}
