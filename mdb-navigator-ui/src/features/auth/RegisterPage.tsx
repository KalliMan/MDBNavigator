import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import useAuth from "../../contexts/auth/useAuth";
import authApi from "../../services/authApi";
import { AuthErrors, toAuthErrors } from "./authErrors";
import { AuthField, AuthNotice, SubmitButton } from "./AuthControls";
import AuthLayout from "./AuthLayout";
import { hasErrors, PASSWORD_MIN_LENGTH, safeReturnTo, validateAuthFields } from "./authValidation";
import ExternalSignInButtons from "./ExternalSignInButtons";

// With email on, the account must be confirmed first (→ /check-inbox); without email the user is signed in at once.
export default function RegisterPage() {
  const { status, settings, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get('returnTo'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<AuthErrors>({});
  const [busy, setBusy] = useState(false);

  if (status === 'signedIn') {
    return <Navigate to={returnTo} replace />;
  }
  if (settings?.signUp === 'Closed') {
    return <Navigate to="/login" replace />;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateAuthFields({ email, newPassword: password, confirmPassword });
    setErrors(found);
    if (hasErrors(found)) {
      return;
    }

    setBusy(true);
    try {
      await authApi.register(email.trim(), password);
      if (settings?.emailEnabled) {
        void navigate(`/check-inbox?email=${encodeURIComponent(email.trim())}`, { replace: true });
      } else if (await signIn(email.trim(), password)) {
        void navigate(returnTo, { replace: true });
      }
    } catch (error) {
      setErrors(toAuthErrors(error));
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Create an account">
      <ExternalSignInButtons providers={settings?.providers ?? []} returnTo={returnTo} />

      <form className="grid gap-4" onSubmit={e => void submit(e)} noValidate>
        {errors.form && <AuthNotice tone="error">{errors.form}</AuthNotice>}
        <AuthField label="Email" type="email" autoComplete="email" autoFocus value={email} error={errors.email} onChange={setEmail} />
        <AuthField label={`Password (at least ${PASSWORD_MIN_LENGTH} characters)`} type="password" autoComplete="new-password"
          value={password} error={errors.password} onChange={setPassword} />
        <AuthField label="Repeat password" type="password" autoComplete="new-password"
          value={confirmPassword} error={errors.confirmPassword} onChange={setConfirmPassword} />
        <SubmitButton busy={busy}>Create account</SubmitButton>
      </form>

      <p className="text-center text-sm text-stone-500">
        Already have an account?{' '}
        <Link to={returnTo === '/' ? '/login' : `/login?returnTo=${encodeURIComponent(returnTo)}`} className="font-medium text-stone-800 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
