import { useId } from "react";

interface FieldProps {
  label: string;
  type: 'email' | 'password' | 'text';
  value: string;
  autoComplete: string;
  error?: string;
  // Shown on the label's line, right-aligned (e.g. a "Forgot password?" link).
  labelAside?: React.ReactNode;
  autoFocus?: boolean;
  onChange: (value: string) => void;
}

export function AuthField({ label, type, value, autoComplete, error, labelAside, autoFocus, onChange }: FieldProps) {
  const id = useId();
  return (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-stone-700">{label}</label>
        {labelAside}
      </div>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={e => onChange(e.target.value)}
        className={`rounded border px-3 py-2 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-purple-300 ${error ? 'border-red-400' : 'border-stone-300'}`}
      />
      {error && <p id={`${id}-error`} className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function SubmitButton({ busy, children }: React.PropsWithChildren<{ busy: boolean }>) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full rounded bg-stone-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
    >
      {busy ? 'Please wait…' : children}
    </button>
  );
}

export function AuthNotice({ tone, children }: React.PropsWithChildren<{ tone: 'error' | 'info' | 'success' }>) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700',
    info: 'border-stone-200 bg-stone-50 text-stone-700',
    success: 'border-green-200 bg-green-50 text-green-800',
  };
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded border px-3 py-2 text-sm ${styles[tone]}`}>
      {children}
    </div>
  );
}
