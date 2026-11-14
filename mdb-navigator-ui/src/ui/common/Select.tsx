import { LuChevronDown } from 'react-icons/lu';
import { ControlSize, fieldClass } from './controlStyles';

export interface SelectValue {
  text: string;
  value: string;
}

interface Props {
  id: string;
  value: string;
  values: SelectValue[];
  onChange: (value: string) => void;
  size?: ControlSize;
}

export default function Select({ id, value, values, onChange, size = 'md' }: Props) {
  return (
    // A native select (keyboard, phones and screen readers know it) with our own chevron in place of the browser's.
    <div className="relative">
      <select id={id} value={value} onChange={e => onChange(e.target.value)}
        className={`${fieldClass(size, false)} appearance-none pr-7`}>
        {values.map(v => <option value={v.value} key={v.value}>{v.text}</option>)}
      </select>
      <LuChevronDown size={14} aria-hidden="true"
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-fg-muted" />
    </div>
  );
}
