import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import authApi from "../../services/authApi";
import { AuthNotice } from "./AuthControls";
import AuthLayout from "./AuthLayout";

// The link in the confirmation email opens this page, which passes its query on to the API.
export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<'confirming' | 'confirmed' | 'failed'>('confirming');
  // Once, even when React runs effects twice in development.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;
    authApi.confirmEmail(searchParams)
      .then(() => setState('confirmed'))
      .catch(() => setState('failed'));
  }, [searchParams]);

  return (
    <AuthLayout title="Confirm your email">
      {state === 'confirming' && <p className="text-sm text-stone-700">Confirming…</p>}
      {state === 'confirmed' && <AuthNotice tone="success">Your email is confirmed. You can sign in now.</AuthNotice>}
      {state === 'failed' && (
        <AuthNotice tone="error">
          This link is no longer valid. Sign in to ask for a new one.
        </AuthNotice>
      )}
      {state !== 'confirming' && (
        <Link to="/login" className="text-center text-sm font-medium text-stone-800 hover:underline">Go to sign in</Link>
      )}
    </AuthLayout>
  );
}
