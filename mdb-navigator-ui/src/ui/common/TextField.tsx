import { useId } from 'react';
import FormField from './FormField';
import TextInput from './TextInput';
import { ControlSize } from './controlStyles';

interface Props {
  label: string;
  type: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  layout: 'side' | 'stacked';
  size?: ControlSize;
  error?: string;
  // Shown under the field while there is no error.
  hint?: string;
  labelAside?: React.ReactNode;
  placeholder?: string;
  maxLength?: number;
  autoComplete?: string;
  autoFocus?: boolean;
}

// The usual case: a label, one text box and its message.
export default function TextField({
  label, type, value, onChange, layout, size, error, hint, labelAside, placeholder, maxLength, autoComplete, autoFocus
}: Props) {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <FormField label={label} htmlFor={id} layout={layout} size={size} error={error} hint={hint} messageId={messageId} labelAside={labelAside}>
      <TextInput
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        size={size}
        invalid={!!error}
        describedBy={error || hint ? messageId : undefined}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
      />
    </FormField>
  );
}
