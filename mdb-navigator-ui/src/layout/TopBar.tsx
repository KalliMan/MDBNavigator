import { useCallback, useState } from "react";
import { HiChevronDown } from "react-icons/hi2";
import useOutsideClick from "../common/sharedHooks/useOutsideClick";
import useAuth from "../contexts/auth/useAuth";

export default function TopBar() {
  const { status, user } = useAuth();

  // Above dialogs (ModalWindow is z-50): the connect dialog is mandatory while there is no connection, and
  // Log out must stay reachable.
  return (
    <header className="relative z-[60] flex h-10 flex-none items-center justify-between border-b border-stone-300 bg-stone-50 px-3">
      <div className="flex items-center gap-2">
        <img src="/icon.png" alt="" className="h-6 w-6" />
        <span className="font-semibold text-stone-800">MDBNavigator</span>
      </div>
      {status === 'local' && (
        <span className="rounded bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-600" title="Running without sign-in (Auth:Mode = None)">
          Local mode
        </span>
      )}
      {user && <UserMenu email={user.email} signInMethod={user.signInMethod} />}
    </header>
  );
}

function UserMenu({ email, signInMethod }: { email: string; signInMethod: string | null }) {
  const { signOut } = useAuth();
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
        className="flex items-center gap-2 rounded px-2 py-1 text-sm text-stone-700 hover:bg-stone-200 cursor-pointer"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold uppercase text-white" aria-hidden="true">
          {email.charAt(0)}
        </span>
        <span className="max-w-56 truncate">{email}</span>
        <HiChevronDown aria-hidden="true" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-1 w-64 rounded border border-stone-200 bg-white py-1 shadow-lg">
          <div className="border-b border-stone-100 px-3 py-2">
            <p className="truncate text-sm font-medium text-stone-800">{email}</p>
            {signInMethod && (
              <p className="text-xs text-stone-500">
                {signInMethod === 'Password' ? 'Signed in with a password' : `Signed in with ${signInMethod}`}
              </p>
            )}
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => void signOut()}
            className="w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
