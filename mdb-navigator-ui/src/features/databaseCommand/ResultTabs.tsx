export interface ResultTabInfo {
  id: string;
  rowCount: number;
  // True while this result's rows are still arriving.
  arriving: boolean;
  // True when the server stopped this result at its row limit.
  truncated: boolean;
}

interface Props {
  results: ResultTabInfo[];
  activeId: string;
  onSelect: (id: string) => void;
}

// One tab per result set, in the strip above the grid. The result components stay mounted (hidden) when
// another tab is active, as ui/tabs/Tabs.tsx does for query tabs; this component is only the row of buttons.
export default function ResultTabs({ results, activeId, onSelect }: Props) {
  return (
    <div role="tablist" aria-label="Results" className="flex h-full min-w-0 items-stretch overflow-x-auto [scrollbar-width:none]">
      {results.map((result, index) => {
        const active = result.id === activeId;
        return (
          <button
            key={result.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={e => {
              onSelect(result.id);
              // With dozens of results the strip scrolls; the clicked tab is brought fully into view.
              e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }}
            className={`flex flex-none items-center gap-2 border-b-2 border-r border-r-line px-3 cursor-pointer ${
              active ? 'border-b-accent bg-canvas font-semibold text-fg' : 'border-b-transparent text-fg-muted hover:bg-hover'
            }`}
          >
            Result {index + 1}
            {result.truncated ? (
              <span className="font-normal text-warning" title="The server stopped this result at its row limit (QueryExecution:MaxRowsPerResultSet)">
                first {result.rowCount.toLocaleString('en-US')} rows
              </span>
            ) : (
              <span className="font-normal text-fg-muted">
                {result.rowCount.toLocaleString('en-US')} {result.rowCount === 1 ? 'row' : 'rows'}{result.arriving ? ' so far' : ''}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
