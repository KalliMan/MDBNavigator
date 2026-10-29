import { useState } from "react";
import { Link, Navigate } from "react-router";
import useAuth from "../../contexts/auth/useAuth";
import authApi from "../../services/authApi";
import { AuthErrors, toAuthErrors } from "./authErrors";
import { AuthField, AuthNotice, SubmitButton } from "./AuthControls";
import AuthLayout from "./AuthLayout";
import { hasErrors, validateAuthFields } from "./authValidation";

// The answer is the same whether or not the account exists, so the page can't be used to find out who has one.
export default function ForgotPasswordPage() {
  const { settings } = useAuth();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<AuthErrors>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  if (settings && !settings.emailEnabled) {
    return <Navigate to="/login" replace />;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateAuthFields({ email });
    setErrors(found);
    if (hasErrors(found)) {
      return;
    }

    setBusy(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (error) {
      setErrors(toAuthErrors(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Forgot your password?">
      {sent ? (
        <AuthNotice tone="success">
          If an account with this email exists, we sent it a link to choose a new password.
        </AuthNotice>
      ) : (
        <form className="grid gap-4" onSubmit={e => void submit(e)} noValidate>
          <p className="text-sm text-stone-700">Enter your email and we'll send you a link to choose a new password.</p>
          {errors.form && <AuthNotice tone="error">{errors.form}</AuthNotice>}
          <AuthField label="Email" type="email" autoComplete="email" autoFocus value={email} error={errors.email} onChange={setEmail} />
          <SubmitButton busy={busy}>Send the link</SubmitButton>
        </form>
      )}
      <Link to="/login" className="text-center text-sm font-medium text-stone-800 hover:underline">Back to sign in</Link>
    </AuthLayout>
  );
}
