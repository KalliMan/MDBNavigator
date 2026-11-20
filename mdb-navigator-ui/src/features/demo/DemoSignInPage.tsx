import { Link } from "react-router";
import authApi from "../../services/authApi";
import AuthLayout from "../auth/AuthLayout";
import DemoLinkForm from "./DemoLinkForm";

// /demo/sign-in: a returning visitor asks for a new link. The server answers the same for an address it doesn't know,
// and sends nothing then.
export default function DemoSignInPage() {
  return (
    <AuthLayout title="Back to the demo">
      <p className="text-sm text-fg">
        Enter the email you used before, and we send you a link for a new session.
      </p>
      <DemoLinkForm
        askName={false}
        submitText="Email me a link"
        send={f => authApi.demoSignInLink(f.email, f.termsVersion, f.captchaToken)}
      />
      <p className="text-center text-sm text-fg-muted">
        <Link to="/login" className="font-medium text-accent-strong hover:underline">Sign in with an account</Link>
      </p>
    </AuthLayout>
  );
}
