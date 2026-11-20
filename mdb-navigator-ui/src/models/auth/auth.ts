// What GET /api/auth/settings returns: which sign-in screens the UI shows.
export interface AuthSettings {
  // 'None': no sign-in at all (the API serves only the local machine).
  mode: 'Accounts' | 'None';
  signUp: 'Open' | 'Closed';
  // External providers with a button, e.g. ['GitHub', 'Google'].
  providers: string[];
  // Email confirmation and "forgot password" work only when the server can send email.
  emailEnabled: boolean;
  // Asked when creating an account and after repeated failed connects. 'None': never asked.
  captchaProvider: 'None' | 'Turnstile' | 'Altcha';
  // Set with 'Turnstile': the public key the widget is rendered with.
  turnstileSiteKey: string | null;
  // Saved connections can remember passwords (the server has SavedConnections:PasswordKey). Only shows the option:
  // the server refuses to remember one without the key anyway.
  rememberPasswords: boolean;
  // The public demo (Demo:Enabled); null when it is off.
  demo: DemoSettings | null;
}

export interface DemoSettings {
  // Named in the demo terms, for visitors who want their data deleted sooner.
  contactEmail: string;
  sessionMinutes: number;
  // What the guest's connection to the sample database is called.
  connectionName: string;
}

// GET /api/auth/account: the signed-in user's own account.
export interface AccountInfo {
  email: string;
  // False for an account created through a provider, until a password is set.
  hasPassword: boolean;
  // Providers this account can sign in with, e.g. ['Google'].
  linkedProviders: string[];
}

// GET /api/auth/me
export interface CurrentUser {
  email: string;
  isAdmin: boolean;
  // How this session signed in: 'Password', or a provider name such as 'Google'. Null when unknown.
  signInMethod: string | null;
  // Set for a demo guest. The email is then a made-up one; show the name instead.
  guest: GuestInfo | null;
}

export interface GuestInfo {
  name: string;
  // ISO time in UTC.
  endsAtUtc: string;
  // By the server's clock when /me answered: count down from this, not from endsAtUtc, in case the browser's clock is off.
  secondsLeft: number;
}
