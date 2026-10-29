// What GET /api/auth/settings returns: which sign-in screens the UI shows.
export interface AuthSettings {
  // 'None': no sign-in at all (the API serves only the local machine).
  mode: 'Accounts' | 'None';
  signUp: 'Open' | 'Closed';
  // External providers with a button, e.g. ['GitHub', 'Google'].
  providers: string[];
  // Email confirmation and "forgot password" work only when the server can send email.
  emailEnabled: boolean;
}

// GET /api/auth/me
export interface CurrentUser {
  email: string;
  isAdmin: boolean;
  // How this session signed in: 'Password', or a provider name such as 'Google'. Null when unknown.
  signInMethod: string | null;
}
