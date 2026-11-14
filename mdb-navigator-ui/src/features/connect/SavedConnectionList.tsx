import { LuPlus } from 'react-icons/lu';
import { SavedConnection } from '../../models/connect/savedConnection';
import { autoConnectionColor, connectionAddress } from '../../utils/connectionColor';

interface Props {
  saved: SavedConnection[];
  isLoading: boolean;
  loadFailed: boolean;
  // null: "New connection".
  selectedId: string | null;
  // While connecting.
  disabled: boolean;
  onSelect: (id: string | null) => void;
}

const rowBase = 'w-full text-left px-3 py-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';
const rowStyle = (selected: boolean) => `${rowBase} ${selected ? 'bg-selected text-on-selected' : 'hover:bg-hover'}`;

// The left pane of the connect dialog: "New connection", then the saved entries.
export default function SavedConnectionList({ saved, isLoading, loadFailed, selectedId, disabled, onSelect }: Props) {
  return (
    // As high as the form next to it (the absolute inner box takes no height of its own), scrolling inside.
    <div className="relative w-56 flex-none rounded-bl border-r border-line bg-surface">
      <div className="rounded-scrollbar absolute inset-0 overflow-y-auto py-1">
        <button
          type="button"
          disabled={disabled}
          aria-pressed={selectedId === null}
          onClick={() => onSelect(null)}
          className={`${rowStyle(selectedId === null)} flex items-center gap-2`}
        >
          <LuPlus size={14} className="shrink-0" />
          <span className="truncate">New connection</span>
        </button>

        {saved.map(entry => (
          <button
            key={entry.id}
            type="button"
            disabled={disabled}
            aria-pressed={selectedId === entry.id}
            onClick={() => onSelect(entry.id)}
            className={`${rowStyle(selectedId === entry.id)} flex items-center gap-2`}
          >
            {/* Without a chosen color: the one the connection gets from its address. */}
            <span
              className="inline-block size-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: entry.color ?? autoConnectionColor(entry) }}
            />
            <span className="min-w-0">
              <span className="block truncate">{entry.name}</span>
              <span className={`block truncate text-xs ${selectedId === entry.id ? '' : 'text-fg-muted'}`}>
                {connectionAddress(entry)}
              </span>
            </span>
          </button>
        ))}

        <div className="px-3 py-2 text-sm text-fg-muted">
          {isLoading ? 'Loading…' : loadFailed ? "Couldn't load saved connections." : saved.length === 0 ? 'No saved connections yet.' : null}
        </div>
      </div>
    </div>
  );
}
