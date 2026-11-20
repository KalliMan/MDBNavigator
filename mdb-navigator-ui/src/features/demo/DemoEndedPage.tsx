import { Link } from "react-router";
import AuthLayout from "../auth/AuthLayout";

// Where a guest lands when the session is over: time up, Log out, or the server ended it.
export default function DemoEndedPage() {
  return (
    <AuthLayout title="Your demo session has ended">
      <p className="text-sm text-fg">
        Thank you for trying MDBNavigator. Everything from the session (queries, results, saved connections) has been
        deleted.
      </p>
      <p className="text-sm text-fg">
        MDBNavigator is open source:{' '}
        <a href="https://github.com/KalliMan/MDBNavigator" className="font-medium text-accent-strong hover:underline">see it on GitHub</a>.
      </p>
      <Link to="/demo/sign-in" className="text-center text-sm font-medium text-accent-strong hover:underline">Start another session</Link>
    </AuthLayout>
  );
}
