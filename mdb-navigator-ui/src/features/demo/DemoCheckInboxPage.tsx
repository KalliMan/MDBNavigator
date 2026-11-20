import { Link, useSearchParams } from "react-router";
import AuthLayout from "../auth/AuthLayout";

// After either demo form. Says the same whether or not an email went out (unknown address, hourly limit), like the
// server's answer.
export default function DemoCheckInboxPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') ?? '';

  return (
    <AuthLayout title="Check your inbox">
      <p className="text-sm text-fg">
        If <span className="font-semibold">{email || 'your address'}</span> can use the demo, a link is on its way.
        It works once, within 30 minutes.
      </p>
      <p className="text-sm text-fg-muted">
        Nothing after a few minutes? Look in your spam folder. You can ask for up to three links an hour.
      </p>
      <Link to="/demo/sign-in" className="text-center text-sm font-medium text-accent-strong hover:underline">Ask for another link</Link>
    </AuthLayout>
  );
}
