interface Props {
  label: string;
  type: string;
  initialValue?: string
  placeholder?: string;
  onChange?: (val: string) => void;
}

export default function Input({ label, type, initialValue, placeholder, onChange }: Props) {
  return (
    <div className=" grid grid-cols-[1fr_2fr]">
      <label className="">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={initialValue}
        autoComplete="on"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
        className="input w-72 ml-8 right-5 rounded border border-stone-200 px-4 py-2 text-sm "
      />
    </div>
  );
}
