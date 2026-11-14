import { CONNECTION_COLORS } from '../../utils/connectionColor';

interface Props {
  // null: "Automatic".
  value: string | null;
  // The color "Automatic" would give this connection (autoConnectionColor of the form), shown inside its swatch.
  autoColor: string;
  onChange: (color: string | null) => void;
}

const swatchBase = 'flex size-5 items-center justify-center rounded-[3px] cursor-pointer';
// The ring marks the picked swatch; the offset keeps it apart from the swatch's own color.
const selectedRing = 'ring-2 ring-accent ring-offset-1 ring-offset-canvas';

// "Automatic" first (the color comes from the server's address), then the palette the automatic colors come from.
export default function ConnectionColorPicker({ value, autoColor, onChange }: Props) {
  return (
    <div role="group" aria-label="Color" className="flex gap-1.5">
      <button
        type="button"
        aria-label="Automatic"
        aria-pressed={value === null}
        title="Automatic: picked from the server's address"
        onClick={() => onChange(null)}
        className={`${swatchBase} border border-dashed border-line ${value === null ? selectedRing : ''}`}
      >
        <span className="inline-block size-2.5 rounded-[2px]" style={{ backgroundColor: autoColor }} />
      </button>
      {CONNECTION_COLORS.map(color => (
        <button
          key={color}
          type="button"
          aria-label={color}
          aria-pressed={value === color}
          title={color}
          onClick={() => onChange(color)}
          className={`${swatchBase} ${value === color ? selectedRing : ''}`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
