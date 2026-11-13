import type { KeyboardEvent, ReactNode } from "react";
import { LuSearch, LuX } from "react-icons/lu";
import Dropdown from "../../ui/dropdown/Dropdown";
import type { ExportFormat } from "./resultExport";

export type ResultMode = 'table' | 'csv';

interface Props {
  // The result tabs, on the left.
  tabs: ReactNode;
  // All rows of the result, and how many the filter leaves.
  rowCount: number;
  shownCount: number;
  // False while rows are still arriving: the filter is disabled and a note says why.
  enabled: boolean;
  // The filter box's text (applied by the caller after a short delay).
  filter: string;
  // True once that text has been applied to the rows; until then shownCount still counts the previous rows.
  filterApplied: boolean;
  onFilterChange: (text: string) => void;
  mode: ResultMode;
  onModeChange: (mode: ResultMode) => void;
  onExport: (format: ExportFormat) => void;
  // What an export will contain, shown at the bottom of the Export menu.
  exportNote: string;
}

const formatCount = (count: number) => count.toLocaleString('en-US');

const MODES: { mode: ResultMode; label: string }[] = [
  { mode: 'table', label: 'Table' },
  { mode: 'csv', label: 'CSV' },
];

// The strip above a result's grid: the result tabs, the filter box that searches every column, the Table | CSV
// switch and the Export menu.
export default function ResultToolbar({
  tabs, rowCount, shownCount, enabled, filter, filterApplied, onFilterChange, mode, onModeChange, onExport, exportNote,
}: Props) {
  const filtering = filter.trim() !== '';

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape' && filter) {
      e.preventDefault();
      onFilterChange('');
    }
  }

  return (
    <div className="flex h-8 flex-none items-center gap-2 border-b border-line bg-chrome pr-2 text-xs">
      {tabs}
      <span className="flex-1" />
      {!enabled && <span className="truncate text-fg-muted">Sort, filter and export are available when the query finishes</span>}
      {enabled && filtering && filterApplied && (
        <span className="flex-none text-fg">{formatCount(shownCount)} of {formatCount(rowCount)} rows</span>
      )}
      <label
        className={`flex h-6 w-52 flex-none items-center gap-1.5 rounded-[3px] border bg-canvas px-2 focus-within:border-accent ${
          filtering ? 'border-accent' : 'border-line'
        } ${enabled ? '' : 'opacity-60'}`}
      >
        <LuSearch size={13} className="flex-none text-fg-faint" aria-hidden="true" />
        <span className="sr-only">Filter rows</span>
        <input
          type="text"
          placeholder="Filter rows"
          disabled={!enabled}
          value={filter}
          onChange={e => onFilterChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-fg-faint disabled:cursor-not-allowed"
        />
        {filter && (
          <button
            type="button"
            aria-label="Clear filter"
            onClick={() => onFilterChange('')}
            className="flex size-4 flex-none items-center justify-center rounded-[3px] text-fg-muted hover:bg-hover hover:text-fg cursor-pointer"
          >
            <LuX size={12} aria-hidden="true" />
          </button>
        )}
      </label>
      <div className="flex h-6 flex-none overflow-hidden rounded-[3px] border border-line">
        {MODES.map((m, index) => (
          <button
            key={m.mode}
            type="button"
            aria-pressed={mode === m.mode}
            onClick={() => onModeChange(m.mode)}
            className={`px-2.5 cursor-pointer ${index > 0 ? 'border-l border-line ' : ''}${
              mode === m.mode ? 'bg-canvas font-semibold text-fg' : 'text-fg-muted hover:bg-hover'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <Dropdown
        ariaLabel="Export result"
        heading="Export"
        label="Export"
        disabled={!enabled}
        title={enabled ? undefined : 'Available when the query finishes'}
        minWidth={240}
        // The keys are the two ExportFormat literals below.
        onSelect={key => onExport(key as ExportFormat)}
        options={[
          { key: 'csv', content: <span className="flex items-center justify-between gap-6">Download as CSV<span className="text-xs text-fg-muted">.csv</span></span> },
          { key: 'json', content: <span className="flex items-center justify-between gap-6">Download as JSON<span className="text-xs text-fg-muted">.json</span></span> },
        ]}
        footer={() => <div className="max-w-[280px] px-3 py-1.5 text-xs text-fg-muted">{exportNote}</div>}
      />
    </div>
  );
}
