import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import useAuth from "../../contexts/auth/useAuth";
import authApi from "../../services/authApi";
import Notice from "../../ui/common/Notice";
import AuthLayout from "../auth/AuthLayout";
import { SubmitButton } from "../auth/AuthControls";
import { toDemoErrors } from "./demoErrors";

// /demo/start?token=...: the emailed link opens this page. Nothing happens until Start is pressed: a mail scanner that
// opens the link uses nothing, and the session's minutes start when the visitor is ready.
export default function DemoStartPage() {
  const { settings } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const minutes = settings?.demo?.sessionMinutes ?? 10;
  const violationsBeforeBlock = settings?.demo?.violationsBeforeBlock ?? 20;
  const blockHours = settings?.demo?.blockHours ?? 24;

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await authApi.demoStart(token);
      // A full load: whatever this tab had open (another guest, another account) is gone, and the workspace starts
      // fresh for the guest.
      window.location.assign('/');
    } catch (err) {
      setError(toDemoErrors(err).form);
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Start the demo">
      {token ? (
        <form className="grid gap-4" onSubmit={e => void start(e)}>
          <p className="text-sm text-fg">
            Your session lasts {minutes} minutes and starts when you press Start. You are connected to a sample database,
            where you can run any query that reads data.
          </p>
          <p className="text-sm text-fg-muted">
            Refused actions (writes, permission errors, refused connections, limits reached) are counted: after{' '}
            {violationsBeforeBlock}, the session ends and demo access is paused for {blockHours} hours.
          </p>
          {error && <Notice tone="error">{error}</Notice>}
          <SubmitButton busy={busy}>Start</SubmitButton>
        </form>
      ) : (
        <Notice tone="error">This link is incomplete. Please open the whole link from the email.</Notice>
      )}
      <Link to="/demo/sign-in" className="text-center text-sm font-medium text-accent-strong hover:underline">Ask for a new link</Link>
    </AuthLayout>
  );
}
