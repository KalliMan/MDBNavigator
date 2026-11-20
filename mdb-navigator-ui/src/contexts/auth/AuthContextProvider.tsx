import { useCallback, useEffect, useRef, useState } from "react";
import { AuthSettings, CurrentUser } from "../../models/auth/auth";
import authApi from "../../services/authApi";
import { setUnauthorizedHandler } from "../../services/apiAgent";
import { AuthContext, AuthStatus } from "./useAuth";

interface AuthState {
  status: AuthStatus;
  settings: AuthSettings | null;
  user: CurrentUser | null;
  sessionExpired: boolean;
}

export default function AuthContextProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState<AuthState>({ status: 'loading', settings: null, user: null, sessionExpired: false });
  // Whose workspace (tabs, connections, results) is open in this page. Another user must never see it.
  const workspaceOwner = useRef<string | null>(null);
  // A demo guest's session doesn't come back: when it ends, the page goes to /demo/ended instead of the sign-in page.
  const isGuest = useRef(false);
  useEffect(() => {
    isGuest.current = !!state.user?.guest;
  }, [state.user]);

  const reload = useCallback(async () => {
    setState(s => ({ ...s, status: 'loading' }));
    try {
      const settings = await authApi.getSettings();
      if (settings.mode === 'None') {
        setState({ status: 'local', settings, user: null, sessionExpired: false });
        return;
      }
      const user = await authApi.getMe();
      if (user) {
        workspaceOwner.current ??= user.email;
      }
      setState({ status: user ? 'signedIn' : 'signedOut', settings, user, sessionExpired: false });
    } catch {
      setState(s => ({ ...s, status: 'unavailable' }));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // An API call answered 401: the session ended. The workspace stays in memory (hidden) so the same user can
  // continue where they were after signing in again.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (isGuest.current) {
        // The server ended it (time up). A full load clears the guest's workspace; the server already removed the cookie.
        window.location.assign('/demo/ended');
        return;
      }
      setState(s => s.status === 'signedIn' ? { ...s, status: 'signedOut', user: null, sessionExpired: true } : s);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await authApi.login(email, password);
    const user = await authApi.getMe();
    if (!user) {
      throw new Error('Signed in, but the session was not accepted.');
    }
    if (workspaceOwner.current && workspaceOwner.current !== user.email) {
      // A different user: start from a fresh page, so nothing of the previous user's workspace survives.
      window.location.assign('/');
      return false;
    }
    workspaceOwner.current = user.email;
    setState(s => ({ ...s, status: 'signedIn', user, sessionExpired: false }));
    return true;
  }, []);

  // For a demo guest also when the time is up: the server then ends the session for good and deletes the account.
  const signOut = useCallback(async () => {
    const destination = isGuest.current ? '/demo/ended' : '/login';
    try {
      await authApi.logout();
    } finally {
      // A full reload clears every tab, result and connection from memory.
      window.location.assign(destination);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, reload, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
