import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import authApi from "../../services/authApi";
import { AuthErrors, toAuthErrors } from "./authErrors";
import { AuthField, AuthNotice, SubmitButton } from "./AuthControls";
import AuthLayout from "./AuthLayout";
import { hasErrors, PASSWORD_MIN_LENGTH, validateAuthFields } from "./authValidation";

// Opened from the link in the reset email (?email=&code=).
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const code = searchParams.get('code') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<AuthErrors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateAuthFields({ newPassword: password, confirmPassword });
    setErrors(found);
    if (hasErrors(found)) {
      return;
    }

    setBusy(true);
    try {
      await authApi.resetPassword(email, code, password);
      setDone(true);
    } catch (error) {
      setErrors(toAuthErrors(error));
    } finally {
      setBusy(false);
    }
  }

  if (!email || !code) {
    return (
      <AuthLayout title="Choose a new password">
        <AuthNotice tone="error">This link is incomplete. Please use the link from the email, or ask for a new one.</AuthNotice>
        <Link to="/forgot-password" className="text-center text-sm font-medium text-stone-800 hover:underline">Ask for a new link</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password">
      {done ? (
        <AuthNotice tone="success">Your password is changed. You can sign in with it now.</AuthNotice>
      ) : (
        <form className="grid gap-4" onSubmit={e => void submit(e)} noValidate>
          <p className="text-sm text-stone-700">For <span className="font-semibold">{email}</span></p>
          {errors.form && <AuthNotice tone="error">{errors.form}</AuthNotice>}
          <AuthField label={`New password (at least ${PASSWORD_MIN_LENGTH} characters)`} type="password" autoComplete="new-password"
            autoFocus value={password} error={errors.password} onChange={setPassword} />
          <AuthField label="Repeat password" type="password" autoComplete="new-password"
            value={confirmPassword} error={errors.confirmPassword} onChange={setConfirmPassword} />
          <SubmitButton busy={busy}>Change password</SubmitButton>
        </form>
      )}
      <Link to="/login" className="text-center text-sm font-medium text-stone-800 hover:underline">Back to sign in</Link>
    </AuthLayout>
  );
}
