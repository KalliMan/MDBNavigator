import { useCallback, useState } from "react";
import { LuChevronDown, LuMoon, LuSun } from "react-icons/lu";
import { useNavigate } from "react-router";
import useOutsideClick from "../common/sharedHooks/useOutsideClick";
import useAuth from "../contexts/auth/useAuth";
import useTheme from "../contexts/theme/useTheme";

export default function TopBar() {
  const { status, user } = useAuth();

  // Above dialogs (ModalWindow is z-50): the connect dialog is mandatory while there is no connection, and
  // Log out must stay reachable.
  return (
    <header className="relative z-[60] flex h-9 flex-none items-center gap-2 border-b border-line bg-chrome px-2">
      <div className="flex items-center gap-2 pl-1 pr-2">
        <img src="/icon.svg" alt="" className="h-5 w-5" />
        <span className="font-semibold">MDBNavigator</span>
      </div>
      <div className="flex-1" />
      {status === 'local' && (
        <span className="rounded-[3px] border border-line bg-surface px-1.5 py-0.5 text-xs text-fg-muted" title="Running without sign-in (Auth:Mode = None)">
          Local mode
        </span>
      )}
      <ThemeToggle />
      {user && <UserMenu email={user.email} signInMethod={user.signInMethod} />}
    </header>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={toggleTheme}
      className="flex size-7 items-center justify-center rounded-[3px] text-fg-muted hover:bg-hover hover:text-fg cursor-pointer"
    >
      {theme === 'dark' ? <LuSun size={15} aria-hidden="true" /> : <LuMoon size={15} aria-hidden="true" />}
    </button>
  );
}

function UserMenu({ email, signInMethod }: { email: string; signInMethod: string | null }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useOutsideClick(close);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="flex h-7 items-center gap-2 rounded-[3px] px-1.5 text-fg hover:bg-hover cursor-pointer"
      >
        <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-semibold uppercase text-on-accent" aria-hidden="true">
          {email.charAt(0)}
        </span>
        <span className="max-w-56 truncate">{email}</span>
        <LuChevronDown size={14} className="text-fg-muted" aria-hidden="true" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-1 w-64 rounded border border-line bg-canvas py-1 shadow-lg">
          <div className="border-b border-line-subtle px-3 py-2">
            <p className="truncate font-medium text-fg">{email}</p>
            {signInMethod && (
              <p className="text-xs text-fg-muted">
                {signInMethod === 'Password' ? 'Signed in with a password' : `Signed in with ${signInMethod}`}
              </p>
            )}
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); void navigate('/account'); }}
            className="h-8 w-full px-3 text-left text-fg hover:bg-hover cursor-pointer"
          >
            Account
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => void signOut()}
            className="h-8 w-full px-3 text-left text-fg hover:bg-hover cursor-pointer"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
