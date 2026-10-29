import { createContext, useContext } from "react";
import { AuthSettings, CurrentUser } from "../../models/auth/auth";

// loading: asking the server. unavailable: the server can't be reached. local: Auth:Mode = None, no sign-in.
export type AuthStatus = 'loading' | 'unavailable' | 'local' | 'signedOut' | 'signedIn';

export interface AuthContextType {
  status: AuthStatus;
  settings: AuthSettings | null;
  user: CurrentUser | null;
  // The session ended while the app was open (the API answered 401); the sign-in page says so.
  sessionExpired: boolean;
  reload: () => Promise<void>;
  // Resolves to false when the page is being reloaded instead (a different user signed in), so the caller
  // shouldn't navigate.
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export default function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
}
