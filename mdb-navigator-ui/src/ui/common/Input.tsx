interface Props {
  label: string;
  type: string;
  initialValue?: string
  placeholder?: string;
  onChange?: (val: string) => void;
}

export default function Input({ label, type, initialValue, placeholder, onChange }: Props) {
  return (
    <div className="grid grid-cols-[1fr_2fr] items-center">
      <label className="text-fg">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={initialValue}
        autoComplete="on"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
        className="w-72 ml-8 h-8 rounded-[3px] border border-line bg-canvas px-2 text-fg outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
      />
    </div>
  );
}
