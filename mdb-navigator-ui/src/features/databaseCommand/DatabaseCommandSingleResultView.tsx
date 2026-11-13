import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ResultSet } from "../../models/databaseCommand/result/resultSet";
import DataGrid, { DataGridColumn } from "../../ui/dataGrid/DataGrid";
import { buildSearchText, buildView, SortState } from "../../ui/dataGrid/rowView";
import { SelectionSize } from "../../ui/dataGrid/selection";
import { copyText } from "../../utils/clipboard";
import { downloadText } from "../../utils/download";
import ResultCsvView from "./ResultCsvView";
import { exportFileName, ExportFormat, toCsv, toJson } from "./resultExport";
import ResultToolbar, { ResultMode } from "./ResultToolbar";

interface Props {
  resultSet: ResultSet;
  // Whether the run is still going; a result set that never got its last batch (cancelled or failed run) is final too.
  isExecuting: boolean;
  // This result's tab is the one on screen. Hidden results stay mounted to keep their filter, sort and widths,
  // but they build no CSV text.
  isActive: boolean;
  // Starts at 1; used in the export's note and file name.
  resultNumber: number;
  tabs: ReactNode;
  mode: ResultMode;
  onModeChange: (mode: ResultMode) => void;
  // The database the run went to, for the export's file name.
  databaseName: string;
  onSelectionChange: (resultSetId: string, size: SelectionSize | null) => void;
}

// How long after the last keystroke the filter is applied.
const FILTER_DELAY_MS = 200;

export function DatabaseCommandSingleResultView({
  resultSet, isExecuting, isActive, resultNumber, tabs, mode, onModeChange, databaseName, onSelectionChange,
}: Props) {
  // Rows stop arriving when the result set's last batch came, or when the run is over (a cancelled or failed run
  // never sends a last batch). Only then can the rows be sorted and filtered: sorting a growing list makes rows jump.
  const canArrange = resultSet.isComplete || !isExecuting;

  // What the filter box shows, and what is applied (after a short pause, so typing stays fluid on large results).
  const [filterText, setFilterText] = useState('');
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<SortState | null>(null);
  const filterTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(filterTimer.current), []);

  const columns = useMemo<DataGridColumn[]>(
    () => resultSet.fields.map(f => ({ name: f.fieldName, typeName: f.dataTypeName, category: f.category })),
    [resultSet.fields]
  );
  const categories = useMemo(() => resultSet.fields.map(f => f.category), [resultSet.fields]);
  const columnNames = useMemo(() => resultSet.fields.map(f => f.fieldName), [resultSet.fields]);
  const exportColumns = useMemo(
    () => resultSet.fields.map(f => ({ name: f.fieldName, category: f.category })),
    [resultSet.fields]
  );

  // Built once, when a filter is first used; the rows no longer change by then, so typing never rebuilds it.
  const searchText = useMemo(
    () => (canArrange && filter.trim() ? buildSearchText(resultSet.rows) : null),
    [canArrange, filter, resultSet.rows]
  );
  // A list of row indexes: the rows themselves are never copied or reordered. null: all rows, original order.
  const view = useMemo(
    () => (canArrange ? buildView(resultSet.rows, categories, searchText, filter, sort) : null),
    [canArrange, resultSet.rows, categories, searchText, filter, sort]
  );

  // The CSV view shows the rows in view as text. Not built for a hidden result or while rows arrive: rebuilding
  // megabytes of text several times a second would stall the page.
  const csvText = useMemo(
    () => (isActive && mode === 'csv' && canArrange ? toCsv(columnNames, resultSet.rows, view) : null),
    [isActive, mode, canArrange, columnNames, resultSet.rows, view]
  );

  function applyFilter(text: string) {
    setFilter(text);
    // The rows under the grid's selection move, so the selection (and its size in the status bar) is dropped.
    onSelectionChange(resultSet.id, null);
  }

  // The timer starts here, in the handler, rather than in an effect that watches the text.
  function handleFilterChange(text: string) {
    setFilterText(text);
    window.clearTimeout(filterTimer.current);
    if (text === '') {
      applyFilter(text);
    } else {
      filterTimer.current = window.setTimeout(() => applyFilter(text), FILTER_DELAY_MS);
    }
  }

  function handleSortChange(next: SortState | null) {
    setSort(next);
    onSelectionChange(resultSet.id, null);
  }

  // The grid produces the text; the clipboard (and the explanation when it is unavailable) belongs here.
  function handleCopyText(text: string) {
    void copyText(text).catch(() => toast.error("Couldn't copy to the clipboard. It needs HTTPS or localhost."));
  }

  // Export uses the rows already in the browser: the loaded ones, with the current sort and filter.
  function handleExport(format: ExportFormat) {
    const fileName = exportFileName(databaseName, resultNumber, new Date(), format);
    if (format === 'csv') {
      // The byte order mark makes Excel read the file as UTF-8.
      downloadText(fileName, '\uFEFF' + toCsv(columnNames, resultSet.rows, view), 'text/csv;charset=utf-8');
    } else {
      downloadText(fileName, toJson(exportColumns, resultSet.rows, view), 'application/json');
    }
  }

  const shown = view ? view.length : resultSet.rows.length;
  const shownText = shown.toLocaleString('en-US');
  const exportNote = view
    ? `Result ${resultNumber}: the ${shownText} ${shown === 1 ? 'row' : 'rows'} in view, with the current sort and filter.`
    : `Result ${resultNumber}: all ${shownText} ${shown === 1 ? 'row' : 'rows'}.`;

  return (
    <div className="flex h-full flex-col">
      <ResultToolbar
        tabs={tabs}
        rowCount={resultSet.rows.length}
        shownCount={shown}
        enabled={canArrange}
        filter={filterText}
        filterApplied={filter === filterText}
        onFilterChange={handleFilterChange}
        mode={mode}
        onModeChange={onModeChange}
        onExport={handleExport}
        exportNote={exportNote}
      />
      <div className="min-h-0 flex-1">
        {/* Hidden, not unmounted, in CSV mode: column widths, selection and scroll position survive the switch. */}
        <div className={mode === 'table' ? 'h-full' : 'hidden'}>
          <DataGrid
            columns={columns}
            rows={resultSet.rows}
            view={view}
            sort={sort}
            onSortChange={handleSortChange}
            canSort={canArrange}
            highlight={canArrange ? filter : ''}
            onCopyText={handleCopyText}
            onSelectionChange={size => onSelectionChange(resultSet.id, size)}
          />
        </div>
        {mode === 'csv' && csvText !== null && <ResultCsvView text={csvText} />}
        {mode === 'csv' && !canArrange && (
          <div className="p-3 text-fg-muted">The CSV text appears when the query finishes. Switch to Table to watch the rows arrive.</div>
        )}
      </div>
    </div>
  );
}
