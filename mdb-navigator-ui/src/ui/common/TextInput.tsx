import { ControlSize, fieldClass } from './controlStyles';

interface Props {
  id: string;
  type: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  size?: ControlSize;
  invalid?: boolean;
  // The id of the paragraph that explains the field (its error or hint).
  describedBy?: string;
  placeholder?: string;
  maxLength?: number;
  autoComplete?: string;
  autoFocus?: boolean;
  inputMode?: 'numeric';
}

// The bare text box. TextField adds the label and the message; use this one directly when the layout needs
// something else around the box (the connect dialog's Host and Port share a row).
export default function TextInput({
  id, type, value, onChange, size = 'md', invalid, describedBy, placeholder, maxLength, autoComplete = 'on', autoFocus, inputMode
}: Props) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      inputMode={inputMode}
      aria-invalid={invalid ? true : undefined}
      aria-describedby={describedBy}
      onChange={e => onChange(e.target.value)}
      className={fieldClass(size, !!invalid)}
    />
  );
}
