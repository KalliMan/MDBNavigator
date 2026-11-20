namespace MDBNavigator.Accounts.Demo
{
    // An emailed link that starts one demo session. Only the token's hash is kept: someone who reads the database can't
    // use a link. The name and terms from the form wait here until the link is used. Deleted a day after it was made.
    public class DemoSignInLink
    {
        public Guid Id { get; set; } = Guid.CreateVersion7();
        public required string TokenHash { get; set; }
        public required string Email { get; set; }
        public required string NormalizedEmail { get; set; }
        // From the invite form; null for a returning visitor's link (their visitor record has it).
        public string? Name { get; set; }
        public required string TermsVersion { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime ExpiresAtUtc { get; set; }
        public DateTime? UsedAtUtc { get; set; }
    }
}
