import { useState } from "react";
import Captcha from "../captcha/Captcha";
import useCaptchaEnabled from "../captcha/useCaptchaEnabled";
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
  const captchaEnabled = useCaptchaEnabled();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // A token works once: a new key remounts the widget for a fresh one after every attempt.
  const [captchaKey, setCaptchaKey] = useState(0);

  if (status === 'signedIn') {
    return <Navigate to={returnTo} replace />;
  }
  if (settings?.signUp === 'Closed') {
    return <Navigate to="/login" replace />;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateAuthFields({ email, newPassword: password, confirmPassword });
    if (captchaEnabled && !captchaToken) {
      found.form ??= 'Please complete the CAPTCHA.';
    }
    setErrors(found);
    if (hasErrors(found)) {
      return;
    }

    setBusy(true);
    try {
      await authApi.register(email.trim(), password, captchaToken);
      if (settings?.emailEnabled) {
        void navigate(`/check-inbox?email=${encodeURIComponent(email.trim())}`, { replace: true });
      } else if (await signIn(email.trim(), password)) {
        void navigate(returnTo, { replace: true });
      }
    } catch (error) {
      setErrors(toAuthErrors(error));
      setBusy(false);
      setCaptchaToken(null);
      setCaptchaKey(k => k + 1);
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
        <Captcha key={captchaKey} onToken={setCaptchaToken} />
        <SubmitButton busy={busy}>Create account</SubmitButton>
      </form>

      <p className="text-center text-sm text-fg-muted">
        Already have an account?{' '}
        <Link to={returnTo === '/' ? '/login' : `/login?returnTo=${encodeURIComponent(returnTo)}`} className="font-medium text-accent-strong hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
