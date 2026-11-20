using System.Text.Encodings.Web;

namespace MDBNavigator.Accounts.Email
{
    // The texts of the account emails, as HTML and plain text.
    //
    // The HTML is built for mail clients, not browsers: tables for layout and inline styles only (many clients drop
    // <style> blocks and flexbox), and no images, because many clients hide them until the reader allows it. Colours
    // follow the app: its accent blue, and the icon's purple-to-teal gradient where a client supports gradients (the solid
    // colour is the fallback, e.g. in Outlook).
    internal static class EmailTemplates
    {
        private const string Accent = "#2563eb";
        private const string Gradient = "linear-gradient(90deg,#7c3aed,#2563eb,#14b8a6)";
        private const string Text = "#1f2328";
        private const string Muted = "#5b6470";
        private const string Faint = "#717884";
        private const string Line = "#e8eaee";
        private const string Page = "#f4f5f7";
        private const string FontStack = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

        public static EmailMessage ConfirmEmail(string to, string link) => Build(
            to,
            subject: "Confirm your email for MDBNavigator",
            heading: "Confirm your email",
            intro: "Please confirm your email address to finish creating your MDBNavigator account.",
            buttonText: "Confirm email",
            link,
            outro: "If you didn't create an MDBNavigator account, you can ignore this email.");

        public static EmailMessage ResetPassword(string to, string link) => Build(
            to,
            subject: "Reset your MDBNavigator password",
            heading: "Reset your password",
            intro: "Someone asked to reset the password of your MDBNavigator account. Choose a new password with the button below.",
            buttonText: "Choose a new password",
            link,
            outro: "If you didn't ask for this, you can ignore this email; your password stays the same.");

        public static EmailMessage DemoLink(string to, string link, int linkValidMinutes, int sessionMinutes) => Build(
            to,
            subject: "Your MDBNavigator demo link",
            heading: "Your demo is ready",
            intro: "Here is your link to the MDBNavigator demo: a sample PostgreSQL database to browse and query, right in your browser.",
            buttonText: "Open the demo",
            link,
            outro: "If you didn't ask for this, you can ignore this email.",
            details:
            [
                ("Link", $"works once, within {linkValidMinutes} minutes"),
                ("Session", $"{sessionMinutes} minutes, from when you press Start")
            ]);

        // To the demo's owner (Demo:OwnerEmail).
        // inviteName: the invite link they came by (Demo:InviteCodes); null for a visitor from before the names existed.
        public static EmailMessage NewDemoVisitor(string to, string visitorName, string visitorEmail, string? inviteName)
        {
            var text = $"{visitorName} ({visitorEmail}) confirmed their email and started a first demo session.";
            if (inviteName is not null)
            {
                text += $" They came by the {inviteName} link.";
            }
            return Notice(to, "New MDBNavigator demo visitor", "New demo visitor", text);
        }

        // To the demo's owner, for every block (DemoViolations).
        public static EmailMessage DemoVisitorBlocked(string to, string visitorName, string visitorEmail,
            int permissionDenied, int connectionRefused, int limitReached, int blockHours)
        {
            var total = permissionDenied + connectionRefused + limitReached;
            var text = $"{visitorName} ({visitorEmail}) was blocked from the demo for {blockHours} hours after {total} refused actions "
                + $"in one session: {permissionDenied} permission errors, {connectionRefused} refused connections, {limitReached} limits reached.";
            return Notice(to, "MDBNavigator demo visitor blocked", "Demo visitor blocked", text);
        }

        // A short note without a button.
        private static EmailMessage Notice(string to, string subject, string heading, string text)
        {
            var html = HtmlEncoder.Default;
            var body = Paragraph(html.Encode(text), Text, 15);
            return new EmailMessage(to, subject, Layout(preheader: text, heading, body), text + "\n");
        }

        // details: short facts shown in a box under the intro (e.g. how long a link works).
        private static EmailMessage Build(string to, string subject, string heading, string intro, string buttonText, string link,
            string outro, IReadOnlyList<(string Label, string Value)>? details = null)
        {
            var html = HtmlEncoder.Default;
            var href = html.Encode(link);

            var detailsHtml = details is { Count: > 0 }
                ? $"""
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;background:{Page};border-radius:6px">
                    {string.Concat(details.Select(d => $"""
                    <tr>
                      <td style="padding:8px 14px;font-family:{FontStack};font-size:13px;color:{Muted};width:72px;vertical-align:top">{html.Encode(d.Label)}</td>
                      <td style="padding:8px 14px 8px 0;font-family:{FontStack};font-size:13px;color:{Text}">{html.Encode(d.Value)}</td>
                    </tr>
                    """))}
                  </table>
                  """
                : string.Empty;

            // The button is a table cell with its own background (bgcolor too), so it stays a button where a client
            // ignores padding on links.
            var body = $"""
                {Paragraph(html.Encode(intro), Text, 15)}
                {detailsHtml}
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px">
                  <tr>
                    <td bgcolor="{Accent}" style="border-radius:6px;background:{Accent};background-image:{Gradient}">
                      <a href="{href}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:{FontStack};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px">{html.Encode(buttonText)} &rarr;</a>
                    </td>
                  </tr>
                </table>
                {Paragraph("If the button doesn't work, copy this link into your browser:", Faint, 12, bottom: 4)}
                <p style="margin:0 0 24px;font-family:{FontStack};font-size:12px;line-height:1.5;word-break:break-all"><a href="{href}" style="color:{Accent};text-decoration:underline">{href}</a></p>
                <div style="border-top:1px solid {Line};margin:0 0 16px;font-size:0;line-height:0">&nbsp;</div>
                {Paragraph(html.Encode(outro), Faint, 13, bottom: 0)}
                """;

            var textBody = $"{heading}\n\n{intro}\n\n"
                + string.Concat(details?.Select(d => $"{d.Label}: {d.Value}\n") ?? [])
                + (details is { Count: > 0 } ? "\n" : string.Empty)
                + $"{buttonText}: {link}\n\n{outro}\n";

            return new EmailMessage(to, subject, Layout(preheader: intro, heading, body), textBody);
        }

        // The frame every email shares: a grey page, a white card with the brand bar, the name, a heading and a footer.
        // preheader: the hidden line many inboxes show next to the subject.
        private static string Layout(string preheader, string heading, string bodyHtml)
        {
            var html = HtmlEncoder.Default;
            return $"""
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width,initial-scale=1">
                  <meta name="color-scheme" content="light">
                  <title>{html.Encode(heading)}</title>
                </head>
                <body style="margin:0;padding:0;background:{Page}">
                  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:{Page}">{html.Encode(preheader)}</div>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="{Page}" style="background:{Page}">
                    <tr>
                      <td align="center" style="padding:32px 16px">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px">
                          <tr>
                            <td bgcolor="#ffffff" style="background:#ffffff;border:1px solid {Line};border-radius:10px;overflow:hidden">
                              <div style="height:4px;line-height:4px;font-size:0;background:{Accent};background-image:{Gradient}">&nbsp;</div>
                              <div style="padding:28px 32px 32px">
                                <p style="margin:0 0 20px;font-family:{FontStack};font-size:15px;font-weight:700;letter-spacing:.2px;color:{Text}">MDB<span style="color:{Accent}">Navigator</span></p>
                                <h1 style="margin:0 0 12px;font-family:{FontStack};font-size:22px;line-height:1.3;font-weight:700;color:{Text}">{html.Encode(heading)}</h1>
                                {bodyHtml}
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding:16px 8px 0;font-family:{FontStack};font-size:12px;line-height:1.5;color:{Faint}">
                              MDBNavigator &middot; an open-source database browser &middot; <a href="https://github.com/KalliMan/MDBNavigator" style="color:{Faint};text-decoration:underline">GitHub</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """;
        }

        // innerHtml must already be encoded.
        private static string Paragraph(string innerHtml, string color, int size, int bottom = 20)
            => $"""<p style="margin:0 0 {bottom}px;font-family:{FontStack};font-size:{size}px;line-height:1.6;color:{color}">{innerHtml}</p>""";
    }
}
