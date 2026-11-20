import { useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import App from "./App";
import useAuth from "./contexts/auth/useAuth";
import DatabaseContextProvider from "./contexts/DatabaseContextProvider";
import AccountPage from "./features/account/AccountPage";
import CheckInboxPage from "./features/auth/CheckInboxPage";
import DemoCheckInboxPage from "./features/demo/DemoCheckInboxPage";
import DemoEndedPage from "./features/demo/DemoEndedPage";
import DemoJoinPage from "./features/demo/DemoJoinPage";
import DemoSignInPage from "./features/demo/DemoSignInPage";
import DemoStartPage from "./features/demo/DemoStartPage";
import ConfirmEmailPage from "./features/auth/ConfirmEmailPage";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import ResetPasswordPage from "./features/auth/ResetPasswordPage";
import StartPage from "./features/start/StartPage";
import Button from "./ui/common/Button";
import { ButtonType } from "./ui/common/ButtonType.enum";
import Loader from "./ui/loader/Loader";

// The sign-in pages, or the workspace (App) at "/".
// The workspace is mounted once someone is signed in and then stays mounted, only hidden while another page shows.
// So when the session ends (a 401), the same user can sign in again and find every tab, query and result as it was.
// A different user, or Log out, reloads the page instead (see AuthContextProvider).
export default function Root() {
  const { status, settings, user, sessionExpired, reload } = useAuth();
  const isGuest = !!user?.guest;
  const location = useLocation();
  const workspaceAllowed = status === 'signedIn' || status === 'local';

  const [workspaceOpened, setWorkspaceOpened] = useState(false);
  if (workspaceAllowed && !workspaceOpened) {
    setWorkspaceOpened(true);
  }

  if (status === 'loading' && !workspaceOpened) {
    return <Loader />;
  }
  if (status === 'unavailable') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface text-fg">
        <p>Cannot reach the MDBNavigator server.</p>
        <Button type={ButtonType.primary} size="lg" onClick={() => void reload()}>Try again</Button>
      </div>
    );
  }

  const showWorkspace = workspaceAllowed && location.pathname === '/';

  return (
    <>
      {workspaceOpened && (
        <div className={showWorkspace ? 'contents' : 'hidden'}>
          <DatabaseContextProvider>
            <App active={showWorkspace} />
          </DatabaseContextProvider>
        </div>
      )}
      <Routes>
        {/* Signed out with the demo on: the public start page. Not after an expired session, so the "Your session has
            ended" notice on the sign-in page isn't lost. */}
        <Route path="/" element={
          workspaceAllowed ? null
            : settings?.demo && !sessionExpired ? <StartPage />
            : <Navigate to="/login" replace />
        } />
        {/* Without accounts (Auth:Mode = None) there is nothing to sign in to. */}
        {status !== 'local' && (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/check-inbox" element={<CheckInboxPage />} />
            <Route path="/confirm-email" element={<ConfirmEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            {/* A demo guest's account is thrown away at the end of the session: nothing to manage. */}
            <Route path="/account" element={
              status !== 'signedIn' ? <Navigate to="/login?returnTo=%2Faccount" replace />
                : isGuest ? <Navigate to="/" replace />
                : <AccountPage />
            } />
          </>
        )}
        {/* The public demo (Demo:Enabled). */}
        {status !== 'local' && settings?.demo && (
          <>
            <Route path="/demo" element={<DemoJoinPage />} />
            <Route path="/demo/sign-in" element={<DemoSignInPage />} />
            <Route path="/demo/check-inbox" element={<DemoCheckInboxPage />} />
            <Route path="/demo/start" element={<DemoStartPage />} />
            <Route path="/demo/ended" element={<DemoEndedPage />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
