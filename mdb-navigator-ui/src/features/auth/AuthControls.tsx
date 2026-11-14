import Button from "../../ui/common/Button";
import { ButtonType } from "../../ui/common/ButtonType.enum";
import TextField from "../../ui/common/TextField";

interface FieldProps {
  label: string;
  type: 'email' | 'password' | 'text';
  value: string;
  autoComplete: string;
  error?: string;
  // Shown under the field while there is no error.
  hint?: string;
  // Shown on the label's line, right-aligned (e.g. a "Forgot password?" link).
  labelAside?: React.ReactNode;
  autoFocus?: boolean;
  onChange: (value: string) => void;
}

// The sign-in pages' presets of the shared controls (ui/common): labels above the fields, the large size, and a
// submit button as wide as the card.
export function AuthField({ label, type, value, autoComplete, error, hint, labelAside, autoFocus, onChange }: FieldProps) {
  return (
    <TextField layout="stacked" size="lg" label={label} type={type} value={value} autoComplete={autoComplete}
      error={error} hint={hint} labelAside={labelAside} autoFocus={autoFocus} onChange={onChange} />
  );
}

export function SubmitButton({ busy, children }: React.PropsWithChildren<{ busy: boolean }>) {
  return (
    <Button type={ButtonType.primary} size="lg" fullWidth disabled={busy}>
      {busy ? 'Please wait…' : children}
    </Button>
  );
}
