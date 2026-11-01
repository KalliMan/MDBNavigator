export interface SelectValue {
  text: string;
  value: string;
}

interface Props {
  label: string;
  initialValue?: string
  values: SelectValue[];
  onChange?: (val: string) => void;
}

export default function Select({ label, values, initialValue, onChange }: Props) {
  return (
    <div className="grid grid-cols-[1fr_2fr] items-center">
      <label className="text-fg">{label}</label>
      <select
        value={initialValue}
        onChange={e => onChange?.(e.target.value)}
        className="w-72 ml-8 h-8 rounded-[3px] border border-line bg-canvas px-2 text-fg outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
      >
        {values.map(value => (
          <option value={value.value} key={value.value}>
            {value.text}
          </option>
        )

        )}
      </select>

    </div>
  );
}
