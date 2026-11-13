import { useId } from 'react';

interface Props {
  label: string;
  type: string;
  initialValue?: string
  placeholder?: string;
  maxLength?: number;
  // Shown under the field, in the value column.
  error?: string;
  onChange?: (val: string) => void;
}

export default function Input({ label, type, initialValue, placeholder, maxLength, error, onChange }: Props) {
  const errorId = useId();
  return (
    <div className="grid grid-cols-[1fr_2fr] items-center">
      <label className="text-fg">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        value={initialValue}
        autoComplete="on"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
        className={`w-72 ml-8 h-8 rounded-[3px] border bg-canvas px-2 text-fg outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 ${error ? 'border-danger' : 'border-line'}`}
      />
      {error && (
        <p id={errorId} className="col-start-2 ml-8 mt-1 text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
