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
        <label htmlFor={id} className="text-sm font-medium text-fg">{label}</label>
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
        className={`rounded border px-3 py-2 text-sm bg-canvas text-fg outline-none focus:ring-2 focus:ring-accent/40 ${error ? 'border-danger' : 'border-line'}`}
      />
      {error && <p id={`${id}-error`} className="text-sm text-danger">{error}</p>}
    </div>
  );
}

export function SubmitButton({ busy, children }: React.PropsWithChildren<{ busy: boolean }>) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full rounded bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
    >
      {busy ? 'Please wait…' : children}
    </button>
  );
}

export function AuthNotice({ tone, children }: React.PropsWithChildren<{ tone: 'error' | 'info' | 'success' }>) {
  const styles = {
    error: 'border-danger/30 bg-danger-soft text-danger',
    info: 'border-line bg-surface text-fg',
    success: 'border-success/30 bg-success-soft text-success',
  };
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded border px-3 py-2 text-sm ${styles[tone]}`}>
      {children}
    </div>
  );
}
