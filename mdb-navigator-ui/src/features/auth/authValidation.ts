import type { AuthErrors } from './authErrors';

// Keep in sync with AccountsServiceRegistration.PasswordMinLength on the server.
export const PASSWORD_MIN_LENGTH = 10;

// Checked before sending, so obvious mistakes don't cost a request. The server checks again.
export function validateAuthFields(fields: { email?: string; password?: string; newPassword?: string; confirmPassword?: string }): AuthErrors {
  const errors: AuthErrors = {};
  if (fields.email !== undefined && !/^\S+@\S+\.\S+$/.test(fields.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  if (fields.password !== undefined && fields.password.length === 0) {
    errors.password = 'Please enter your password.';
  }
  if (fields.newPassword !== undefined && fields.newPassword.length < PASSWORD_MIN_LENGTH) {
    errors.password = `The password must have at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (fields.confirmPassword !== undefined && fields.confirmPassword !== fields.newPassword) {
    errors.confirmPassword = 'The passwords don\'t match.';
  }
  return errors;
}

export const hasErrors = (errors: AuthErrors) => Object.keys(errors).length > 0;

// Where to go after signing in: only paths in this app (the server checks the same for provider sign-in).
export function safeReturnTo(returnTo: string | null): string {
  return returnTo && /^\/(?![/\\])[^\s\\]*$/.test(returnTo) ? returnTo : '/';
}
