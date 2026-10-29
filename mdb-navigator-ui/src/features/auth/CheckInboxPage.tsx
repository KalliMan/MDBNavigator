import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import authApi from "../../services/authApi";
import { toAuthErrors } from "./authErrors";
import { AuthNotice } from "./AuthControls";
import AuthLayout from "./AuthLayout";

// After creating an account while email is on: the account works once the email is confirmed.
export default function CheckInboxPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string>();

  async function resend() {
    setState('sending');
    setError(undefined);
    try {
      await authApi.resendConfirmation(email);
      setState('sent');
    } catch (e) {
      setError(toAuthErrors(e).form);
      setState('idle');
    }
  }

  return (
    <AuthLayout title="Check your inbox">
      <p className="text-sm text-stone-700">
        We sent a link to <span className="font-semibold">{email || 'your email address'}</span>.
        Open it to confirm your email, then sign in.
      </p>
      {error && <AuthNotice tone="error">{error}</AuthNotice>}
      {state === 'sent' && <AuthNotice tone="success">We sent a new link.</AuthNotice>}
      <div className="flex items-center justify-between text-sm">
        {email && (
          <button type="button" className="font-medium text-stone-800 hover:underline disabled:opacity-50 cursor-pointer"
            disabled={state !== 'idle'} onClick={() => void resend()}>
            Send the link again
          </button>
        )}
        <Link to="/login" className="font-medium text-stone-800 hover:underline">Back to sign in</Link>
      </div>
    </AuthLayout>
  );
}
