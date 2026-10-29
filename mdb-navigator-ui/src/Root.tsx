import { useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import App from "./App";
import useAuth from "./contexts/auth/useAuth";
import DatabaseContextProvider from "./contexts/DatabaseContextProvider";
import CheckInboxPage from "./features/auth/CheckInboxPage";
import ConfirmEmailPage from "./features/auth/ConfirmEmailPage";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import ResetPasswordPage from "./features/auth/ResetPasswordPage";
import Loader from "./ui/loader/Loader";

// The sign-in pages, or the workspace (App) at "/".
// The workspace is mounted once someone is signed in and then stays mounted, only hidden while another page shows.
// So when the session ends (a 401), the same user can sign in again and find every tab, query and result as it was.
// A different user, or Log out, reloads the page instead (see AuthContextProvider).
export default function Root() {
  const { status, reload } = useAuth();
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-stone-100 text-stone-700">
        <p>Cannot reach the MDBNavigator server.</p>
        <button type="button" onClick={() => void reload()}
          className="rounded bg-stone-800 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700 cursor-pointer">
          Try again
        </button>
      </div>
    );
  }

  const showWorkspace = workspaceAllowed && location.pathname === '/';

  return (
    <>
      {workspaceOpened && (
        <div className={showWorkspace ? 'contents' : 'hidden'}>
          <DatabaseContextProvider>
            <App />
          </DatabaseContextProvider>
        </div>
      )}
      <Routes>
        <Route path="/" element={workspaceAllowed ? null : <Navigate to="/login" replace />} />
        {/* Without accounts (Auth:Mode = None) there is nothing to sign in to. */}
        {status !== 'local' && (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/check-inbox" element={<CheckInboxPage />} />
            <Route path="/confirm-email" element={<ConfirmEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
