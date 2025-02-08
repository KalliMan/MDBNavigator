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
    <div className=" grid grid-cols-[1fr_2fr]">
      <label className="">{label}</label>
      <select
        value={initialValue}
        onChange={e => onChange?.(e.target.value)}
        className="input w-72 ml-8 right-5 rounded border border-stone-200 px-4 py-2 text-sm "
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
