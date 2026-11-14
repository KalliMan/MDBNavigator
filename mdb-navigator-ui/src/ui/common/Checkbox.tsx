import { LuCheck } from 'react-icons/lu';

interface Props {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

// A real checkbox (keyboard, forms and screen readers get what they expect) with the browser's drawing switched
// off, so the box looks the same in every browser and both themes. children: the label's text.
export default function Checkbox({ checked, disabled, onChange, children }: React.PropsWithChildren<Props>) {
  return (
    <label className={`flex w-fit items-center gap-2 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
      <span className="relative flex size-4 flex-none">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={e => onChange(e.target.checked)}
          className="peer size-4 cursor-[inherit] appearance-none rounded-[3px] border border-line bg-canvas checked:border-accent checked:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <LuCheck size={12} strokeWidth={3} aria-hidden="true"
          className="pointer-events-none absolute inset-0 m-auto hidden text-on-accent peer-checked:block" />
      </span>
      {children}
    </label>
  );
}
