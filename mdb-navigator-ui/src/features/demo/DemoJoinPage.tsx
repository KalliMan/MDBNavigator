import { Link, useSearchParams } from "react-router";
import useAuth from "../../contexts/auth/useAuth";
import authApi from "../../services/authApi";
import AuthLayout from "../auth/AuthLayout";
import DemoLinkForm from "./DemoLinkForm";

// /demo?code=...: the invite link. The code is checked when the form is sent (403 for a wrong one); without any code
// there is nothing to send, so the page only explains.
export default function DemoJoinPage() {
  const { settings } = useAuth();
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const minutes = settings?.demo?.sessionMinutes ?? 10;

  return (
    <AuthLayout title="Try the demo">
      {code ? (
        <>
          <p className="text-sm text-fg">
            You get a {minutes}-minute session with a sample database, to run any query you like.
            We email you a link to start it.
          </p>
          <DemoLinkForm
            askName
            submitText="Email me the link"
            send={f => authApi.demoJoin(code, f.name, f.email, f.termsVersion, f.captchaToken)}
          />
        </>
      ) : (
        <p className="text-sm text-fg">
          The MDBNavigator demo is by invitation. If someone sent you an invite link, please open that link.
        </p>
      )}
      {code && (
        <p className="text-center text-sm text-fg-muted">
          <Link to={`/?code=${encodeURIComponent(code)}`} className="font-medium text-accent-strong hover:underline">What is MDBNavigator?</Link>
        </p>
      )}
      <p className="text-center text-sm text-fg-muted">
        Been here before?{' '}
        <Link to="/demo/sign-in" className="font-medium text-accent-strong hover:underline">Get a new link</Link>
      </p>
    </AuthLayout>
  );
}
