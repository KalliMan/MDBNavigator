import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import authApi from "../../services/authApi";
import { AuthErrors, toAuthErrors } from "./authErrors";
import { AuthField, SubmitButton } from "./AuthControls";
import Notice from "../../ui/common/Notice";
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
        <Notice tone="error">This link is incomplete. Please use the link from the email, or ask for a new one.</Notice>
        <Link to="/forgot-password" className="text-center text-sm font-medium text-accent-strong hover:underline">Ask for a new link</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password">
      {done ? (
        <Notice tone="success">Your password is changed. You can sign in with it now.</Notice>
      ) : (
        <form className="grid gap-4" onSubmit={e => void submit(e)} noValidate>
          <p className="text-sm text-fg">For <span className="font-semibold">{email}</span></p>
          {errors.form && <Notice tone="error">{errors.form}</Notice>}
          <AuthField label="New password" hint={`At least ${PASSWORD_MIN_LENGTH} characters`} type="password" autoComplete="new-password"
            autoFocus value={password} error={errors.password} onChange={setPassword} />
          <AuthField label="Repeat password" type="password" autoComplete="new-password"
            value={confirmPassword} error={errors.confirmPassword} onChange={setConfirmPassword} />
          <SubmitButton busy={busy}>Change password</SubmitButton>
        </form>
      )}
      <Link to="/login" className="text-center text-sm font-medium text-accent-strong hover:underline">Back to sign in</Link>
    </AuthLayout>
  );
}
