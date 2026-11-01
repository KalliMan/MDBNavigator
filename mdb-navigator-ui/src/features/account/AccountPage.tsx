import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import useAuth from "../../contexts/auth/useAuth";
import { AccountInfo } from "../../models/auth/auth";
import authApi, { linkProviderUrl } from "../../services/authApi";
import { accountLinkError, AuthErrors, toAuthErrors } from "../auth/authErrors";
import { AuthField, AuthNotice, SubmitButton } from "../auth/AuthControls";
import { hasErrors, PASSWORD_MIN_LENGTH, validateAuthFields } from "../auth/authValidation";
import ProviderLogo from "../auth/ProviderLogo";

// The signed-in user's own account: password, sign-in providers, deletion.
// ?linked= and ?error= come back from linking a provider (a round trip through the provider).
export default function AccountPage() {
  const { settings, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loadError, setLoadError] = useState<string>();

  const load = useCallback(async () => {
    try {
      setAccount(await authApi.getAccount());
      setLoadError(undefined);
    } catch (error) {
      setLoadError(toAuthErrors(error).form);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const linked = searchParams.get('linked');
  const linkError = accountLinkError(searchParams.get('error'));
  const providers = settings?.providers ?? [];

  return (
    <div className="min-h-screen bg-stone-100 px-4 py-8">
      <main className="mx-auto grid max-w-xl gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-stone-800">Your account</h1>
          <Link to="/" className="text-sm font-medium text-stone-800 hover:underline">Back to the workspace</Link>
        </div>

        {linked && <AuthNotice tone="success">{linked} is now linked to your account.</AuthNotice>}
        {linkError && <AuthNotice tone="error">{linkError}</AuthNotice>}
        {loadError && <AuthNotice tone="error">{loadError}</AuthNotice>}

        {account && (
          <>
            <Section title="Email">
              <p className="text-sm text-stone-700">{account.email}</p>
              {user?.signInMethod && (
                <p className="text-xs text-stone-500">
                  This session: {user.signInMethod === 'Password' ? 'signed in with a password' : `signed in with ${user.signInMethod}`}
                </p>
              )}
            </Section>

            <PasswordSection hasPassword={account.hasPassword} onChanged={load} />

            {(providers.length > 0 || account.linkedProviders.length > 0) && (
              <ProvidersSection account={account} providers={providers} onChanged={load} />
            )}

            <DeleteSection account={account} />
          </>
        )}
      </main>
    </div>
  );
}

function Section({ title, tone, children }: React.PropsWithChildren<{ title: string; tone?: 'danger' }>) {
  return (
    <section className={`grid gap-3 rounded-lg border bg-white p-5 shadow-sm ${tone === 'danger' ? 'border-red-200' : 'border-stone-200'}`}>
      <h2 className={`font-semibold ${tone === 'danger' ? 'text-red-700' : 'text-stone-800'}`}>{title}</h2>
      {children}
    </section>
  );
}

// Change the password, or set a first one for an account created through a provider.
function PasswordSection({ hasPassword, onChanged }: { hasPassword: boolean; onChanged: () => Promise<void> }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<AuthErrors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateAuthFields({ newPassword: password, confirmPassword });
    if (hasPassword && currentPassword.length === 0) {
      found.currentPassword = 'Please enter your current password.';
    }
    setErrors(found);
    setDone(false);
    if (hasErrors(found)) {
      return;
    }

    setBusy(true);
    try {
      await authApi.setPassword(hasPassword ? currentPassword : null, password);
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
      setDone(true);
      await onChanged();
    } catch (error) {
      setErrors(toAuthErrors(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title={hasPassword ? 'Change password' : 'Set a password'}>
      {!hasPassword && (
        <p className="text-sm text-stone-600">You sign in through a provider. A password lets you sign in without it, too.</p>
      )}
      <form className="grid gap-4" onSubmit={e => void submit(e)} noValidate>
        {/* Identity re-checks other sessions against the account's security stamp every 30 minutes (its default). */}
        {done && <AuthNotice tone="success">Your password is saved. Your other sessions are signed out within 30 minutes.</AuthNotice>}
        {errors.form && <AuthNotice tone="error">{errors.form}</AuthNotice>}
        {hasPassword && (
          <AuthField label="Current password" type="password" autoComplete="current-password"
            value={currentPassword} error={errors.currentPassword} onChange={setCurrentPassword} />
        )}
        <AuthField label={`New password (at least ${PASSWORD_MIN_LENGTH} characters)`} type="password" autoComplete="new-password"
          value={password} error={errors.password} onChange={setPassword} />
        <AuthField label="Repeat new password" type="password" autoComplete="new-password"
          value={confirmPassword} error={errors.confirmPassword} onChange={setConfirmPassword} />
        <SubmitButton busy={busy}>{hasPassword ? 'Change password' : 'Set password'}</SubmitButton>
      </form>
    </Section>
  );
}

// Every configured provider: linked ones can be unlinked, the others linked.
function ProvidersSection({ account, providers, onChanged }: { account: AccountInfo; providers: string[]; onChanged: () => Promise<void> }) {
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState<string | null>(null);
  // A provider can be linked even if the server no longer offers it for sign-in; it can still be unlinked.
  const all = [...new Set([...providers, ...account.linkedProviders])].sort();

  async function unlink(provider: string) {
    setBusy(provider);
    setError(undefined);
    try {
      await authApi.unlinkProvider(provider);
      await onChanged();
    } catch (e) {
      setError(toAuthErrors(e).form);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Section title="Sign-in providers">
      {error && <AuthNotice tone="error">{error}</AuthNotice>}
      <ul className="grid gap-2">
        {all.map(provider => {
          const isLinked = account.linkedProviders.includes(provider);
          return (
            <li key={provider} className="flex items-center justify-between rounded border border-stone-200 px-3 py-2">
              <span className="flex items-center gap-3 text-sm text-stone-800">
                <ProviderLogo provider={provider} />
                {provider}
                {isLinked && <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">Linked</span>}
              </span>
              {isLinked ? (
                <button type="button" disabled={busy !== null} onClick={() => void unlink(provider)}
                  className="text-sm font-medium text-stone-600 hover:underline disabled:opacity-50 cursor-pointer">
                  Unlink
                </button>
              ) : providers.includes(provider) && (
                <a href={linkProviderUrl(provider)} className="text-sm font-medium text-stone-800 hover:underline">Link</a>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

// Deleting asks for proof that the owner is at the keyboard: the password, or the email for an account without one.
function DeleteSection({ account }: { account: AccountInfo }) {
  const [open, setOpen] = useState(false);
  const [proof, setProof] = useState('');
  const [errors, setErrors] = useState<AuthErrors>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (proof.trim().length === 0) {
      setErrors(account.hasPassword ? { currentPassword: 'Please enter your password.' } : { email: 'Please type your email address.' });
      return;
    }

    setBusy(true);
    setErrors({});
    try {
      await authApi.deleteAccount(account.hasPassword ? { password: proof } : { email: proof });
      // A full reload: nothing of the deleted account stays in memory.
      window.location.assign('/login?deleted=1');
    } catch (error) {
      setErrors(toAuthErrors(error));
      setBusy(false);
    }
  }

  return (
    <Section title="Delete account" tone="danger">
      <p className="text-sm text-stone-600">
        Your account and its sign-in providers are deleted for good, and your open database connections are closed.
        Your databases themselves are not touched.
      </p>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)}
          className="justify-self-start rounded border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 cursor-pointer">
          Delete my account…
        </button>
      ) : (
        <form className="grid gap-4" onSubmit={e => void submit(e)} noValidate>
          {errors.form && <AuthNotice tone="error">{errors.form}</AuthNotice>}
          {account.hasPassword ? (
            <AuthField label="Your password" type="password" autoComplete="current-password" autoFocus
              value={proof} error={errors.currentPassword} onChange={setProof} />
          ) : (
            <AuthField label={`Type ${account.email} to confirm`} type="email" autoComplete="off" autoFocus
              value={proof} error={errors.email} onChange={setProof} />
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={busy}
              className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 cursor-pointer">
              {busy ? 'Please wait…' : 'Delete my account'}
            </button>
            <button type="button" disabled={busy} onClick={() => { setOpen(false); setProof(''); setErrors({}); }}
              className="rounded border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      )}
    </Section>
  );
}
