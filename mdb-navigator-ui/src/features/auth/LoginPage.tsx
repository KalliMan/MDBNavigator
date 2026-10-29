import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import useAuth from "../../contexts/auth/useAuth";
import authApi from "../../services/authApi";
import { AuthErrors, externalSignInError, isEmailNotConfirmed, toAuthErrors } from "./authErrors";
import { AuthField, AuthNotice, SubmitButton } from "./AuthControls";
import AuthLayout from "./AuthLayout";
import { hasErrors, safeReturnTo, validateAuthFields } from "./authValidation";
import ExternalSignInButtons from "./ExternalSignInButtons";

// Provider buttons first, then email and password. ?returnTo= brings the user back to where they were; ?error= comes
// from a failed provider sign-in.
export default function LoginPage() {
  const { status, settings, sessionExpired, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get('returnTo'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<AuthErrors>({});
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);

  if (status === 'signedIn') {
    return <Navigate to={returnTo} replace />;
  }

  const externalError = externalSignInError(searchParams.get('error'));
  const emailEnabled = settings?.emailEnabled ?? false;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateAuthFields({ email, password });
    setErrors(found);
    setNeedsConfirmation(false);
    setResent(false);
    if (hasErrors(found)) {
      return;
    }

    setBusy(true);
    try {
      if (await signIn(email.trim(), password)) {
        void navigate(returnTo, { replace: true });
      }
    } catch (error) {
      setErrors(toAuthErrors(error));
      setNeedsConfirmation(isEmailNotConfirmed(error));
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    try {
      await authApi.resendConfirmation(email.trim());
      setResent(true);
    } catch (error) {
      setErrors(toAuthErrors(error));
    }
  }

  return (
    <AuthLayout title="Sign in">
      {sessionExpired && <AuthNotice tone="info">Your session has ended. Please sign in again.</AuthNotice>}
      {externalError && <AuthNotice tone="error">{externalError}</AuthNotice>}

      <ExternalSignInButtons providers={settings?.providers ?? []} returnTo={returnTo} />

      <form className="grid gap-4" onSubmit={e => void submit(e)} noValidate>
        {errors.form && (
          <AuthNotice tone="error">
            <p>{errors.form}</p>
            {needsConfirmation && emailEnabled && (
              resent
                ? <p className="mt-1 font-semibold">We sent a new link.</p>
                : <button type="button" className="mt-1 font-semibold underline cursor-pointer" onClick={() => void resendConfirmation()}>
                    Send the link again
                  </button>
            )}
          </AuthNotice>
        )}
        <AuthField label="Email" type="email" autoComplete="email" autoFocus value={email} error={errors.email} onChange={setEmail} />
        <AuthField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          error={errors.password}
          onChange={setPassword}
          labelAside={emailEnabled && (
            <Link to="/forgot-password" className="text-sm text-stone-500 hover:underline">Forgot password?</Link>
          )}
        />
        <SubmitButton busy={busy}>Sign in</SubmitButton>
      </form>

      {settings?.signUp === 'Open' && (
        <p className="text-center text-sm text-stone-500">
          No account?{' '}
          <Link to={returnTo === '/' ? '/register' : `/register?returnTo=${encodeURIComponent(returnTo)}`} className="font-medium text-stone-800 hover:underline">
            Create one
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}
