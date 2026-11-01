import { AxiosError } from 'axios';
import { PASSWORD_MIN_LENGTH } from './authValidation';

export type AuthField = 'email' | 'currentPassword' | 'password' | 'confirmPassword';

// Messages for one form: per field, plus one for the whole form.
export type AuthErrors = Partial<Record<AuthField | 'form', string>>;

interface ProblemDetails {
  title?: string;
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

// Identity's validation error codes: the field they belong to and our own text. Unknown codes fall back to the
// server's text on the form.
const validationCodes: Record<string, { field: AuthField | 'form'; message: string }> = {
  DuplicateEmail: { field: 'email', message: 'An account with this email already exists.' },
  DuplicateUserName: { field: 'email', message: 'An account with this email already exists.' },
  InvalidEmail: { field: 'email', message: 'Please enter a valid email address.' },
  InvalidUserName: { field: 'email', message: 'Please enter a valid email address.' },
  PasswordTooShort: { field: 'password', message: `The password must have at least ${PASSWORD_MIN_LENGTH} characters.` },
  InvalidToken: { field: 'form', message: 'This link is no longer valid. Please ask for a new one.' },
  // The account page (MDBNavigator.Infrastructure.Accounts/Identity/AccountManagement.cs).
  PasswordMismatch: { field: 'currentPassword', message: 'The password is wrong.' },
  EmailMismatch: { field: 'email', message: 'That is not this account\'s email address.' },
  LastSignInMethod: { field: 'form', message: 'This is your only way to sign in. Set a password first, or link another provider.' },
  LastAdmin: { field: 'form', message: 'You are the only admin, so this account can\'t be deleted.' },
  NotLinked: { field: 'form', message: 'That provider isn\'t linked to your account.' },
  AccountNotFound: { field: 'form', message: 'This account no longer exists. Please sign in again.' },
};

// ?error= codes the API sends back to the account page after linking a provider.
const linkErrors: Record<string, string> = {
  'link-failed': 'Linking didn\'t work. Please try again.',
  'link-in-use': 'That provider account is already linked to another MDBNavigator account.',
};

export const accountLinkError = (code: string | null) => (code ? linkErrors[code] ?? linkErrors['link-failed'] : undefined);

// Identity's login answers 401 with one of these words as the detail.
const loginFailures: Record<string, string> = {
  Failed: 'Wrong email or password.',
  NotAllowed: 'Please confirm your email first. We sent you a link when you signed up.',
  LockedOut: 'Too many failed attempts. Please try again in 5 minutes.',
};

// ?error= codes the API's provider sign-in sends back (MDBNavigator.API/Auth/AuthEndpoints.cs).
const externalErrors: Record<string, string> = {
  'external-cancelled': 'Sign-in was cancelled.',
  'external-failed': 'Sign-in with that provider didn\'t work. Please try again.',
  'external-no-email': 'The provider didn\'t share an email address, which an account needs.',
  'external-email-in-use': 'An account with this email already exists. Sign in with your password; you can link the provider later from your account page.',
  'external-locked-out': loginFailures.LockedOut,
  'external-sign-up-closed': 'There is no account for this email, and creating new accounts is switched off on this server.',
};

export const externalSignInError = (code: string | null) => (code ? externalErrors[code] ?? externalErrors['external-failed'] : undefined);

// The login failed only because the email isn't confirmed yet (offer to resend the link).
export const isEmailNotConfirmed = (error: unknown) =>
  error instanceof AxiosError && error.response?.status === 401 && problemOf(error)?.detail === 'NotAllowed';

export function toAuthErrors(error: unknown): AuthErrors {
  if (!(error instanceof AxiosError)) {
    return { form: 'Something went wrong. Please try again.' };
  }
  if (!error.response) {
    return { form: 'Cannot reach the server. Please check your connection and try again.' };
  }
  if (error.response.status === 429) {
    return { form: 'Too many attempts. Please wait a minute and try again.' };
  }

  const problem = problemOf(error);
  const loginFailure = error.response.status === 401 ? loginFailures[problem?.detail ?? ''] : undefined;
  if (loginFailure) {
    return { form: loginFailure };
  }
  if (error.response.status === 401) {
    // Not a sign-in attempt: the session ended (e.g. on the account page).
    return { form: 'Your session has ended. Please sign in again.' };
  }

  const result: AuthErrors = {};
  for (const [code, messages] of Object.entries(problem?.errors ?? {})) {
    const known = validationCodes[code];
    result[known?.field ?? 'form'] ??= known ? known.message : messages.join(' ');
  }
  if (Object.keys(result).length === 0) {
    result.form = problem?.message ?? problem?.detail ?? problem?.title ?? 'Something went wrong. Please try again.';
  }
  return result;
}

function problemOf(error: AxiosError): ProblemDetails | undefined {
  const data = error.response?.data;
  return data && typeof data === 'object' ? data as ProblemDetails : undefined;
}
