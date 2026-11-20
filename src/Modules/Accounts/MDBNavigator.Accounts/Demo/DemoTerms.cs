namespace MDBNavigator.Accounts.Demo
{
    // The demo terms a visitor agrees to. The text is in the UI (features/demo/DemoTerms.tsx); this version must match its
    // DEMO_TERMS_VERSION, and changes whenever the text does, so each visitor's record says which text they agreed to.
    public static class DemoTerms
    {
        public const string Version = "2026-11-20";

        // Promised in the terms text ("kept for 90 days after your last visit"), so not a setting.
        public const int VisitorRetentionDays = 90;
    }
}
