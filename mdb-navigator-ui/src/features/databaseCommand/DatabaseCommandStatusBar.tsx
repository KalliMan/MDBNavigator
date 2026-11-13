import { useEffect, useState } from 'react';
import { CommandExecutionStatus } from '../../models/databaseCommand/result/commandFinishedResult';
import { DatabaseCommandStats } from '../../contexts/databaseCommand/DatabaseCommandReducer';
import { HubStatus } from '../../services/commandResultHub';
import { SelectionSize } from '../../ui/dataGrid/selection';

interface Props {
  isExecuting: boolean;
  error: string | null;
  status: CommandExecutionStatus | null;
  stats: DatabaseCommandStats | null;
  hubStatus: HubStatus;
  // Where the results on screen came from; stale once the tab points somewhere else (1.2d). null: no results to describe.
  resultsFrom: { label: string; stale: boolean } | null;
  // The size of the grid selection; null when nothing is selected.
  selection: SelectionSize | null;
  // How many result sets the run has; more than one is said next to the row count.
  resultSetCount: number;
}

const hubStatusView: Record<HubStatus, { label: string; dotClass: string }> = {
  connected: { label: 'Connected', dotClass: 'bg-success' },
  connecting: { label: 'Connecting...', dotClass: 'bg-warning' },
  reconnecting: { label: 'Reconnecting...', dotClass: 'bg-warning' },
  disconnected: { label: 'Disconnected', dotClass: 'bg-danger' },
};

const formatTime = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = Math.floor(ms / 1000);
  const milliseconds = ms % 1000;
  return `${seconds}s ${milliseconds}ms`;
};

function formatRows(stats: DatabaseCommandStats | null, resultSetCount: number): string | null {
  if (!stats) {
    return null;
  }
  if (stats.rowCount > 0) {
    const rows = `${stats.rowCount.toLocaleString('en-US')} ${stats.rowCount === 1 ? 'row' : 'rows'}`;
    return resultSetCount > 1 ? `${rows} in ${resultSetCount} results` : rows;
  }
  if (stats.recordsAffected >= 0) {
    return `${stats.recordsAffected.toLocaleString('en-US')} records affected`;
  }
  return null;
}

export function DatabaseCommandStatusBar({ isExecuting, error, status, stats, hubStatus, resultsFrom, selection, resultSetCount }: Props) {
  const [executionTime, setExecutionTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isExecuting && !startTime) {
      setStartTime(Date.now());
      setExecutionTime(0);
    } else if (!isExecuting && startTime !== null) {
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);
      setStartTime(null);
    }
  }, [isExecuting, startTime]);

  useEffect(() => {
    if (!isExecuting || startTime === null) {
      return;
    }

    const interval = setInterval(() => {
      setExecutionTime(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [isExecuting, startTime]);

  // Prefer the server-measured time once the execution has finished.
  const finishedTime = formatTime(stats?.elapsedMs ?? executionTime);
  const rows = formatRows(stats, resultSetCount);
  const hub = hubStatusView[hubStatus];

  return (
    <div className="flex h-7 flex-none items-center justify-between gap-4 border-t border-line bg-chrome px-3 text-xs text-fg-muted">
      <div className="flex items-center gap-4 min-w-0">
        {isExecuting ? (
          <>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
              <span className="font-medium text-fg">Executing query...</span>
            </div>
            <span className="text-fg-muted">
              Elapsed time: {formatTime(executionTime)}
            </span>
          </>
        ) : error ? (
          <>
            <div className="flex items-center gap-2 flex-none">
              <div className="size-2 rounded-full bg-danger"></div>
              <span className="font-medium text-danger">Query execution failed</span>
            </div>
            <span className="truncate text-danger" title={error}>
              Error: {error}
            </span>
          </>
        ) : status === 'Cancelled' ? (
          <>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-warning"></div>
              <span className="font-medium text-fg">
                Query cancelled{stats && stats.rowCount > 0 ? ` after ${formatRows(stats, resultSetCount)}` : ''}
              </span>
            </div>
            <span className="text-fg-muted">
              Execution time: {finishedTime}
            </span>
          </>
        ) : status === 'Completed' ? (
          <>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-success"></div>
              <span className="font-medium text-fg">Query executed successfully</span>
            </div>
            {stats?.truncated ? (
              <span className="text-warning" title="The server stops streaming at its row limit (QueryExecution:MaxRowsPerExecution)">
                Showing first {stats.rowCount.toLocaleString('en-US')} rows (row limit reached). Sort and filter cover these rows only.
              </span>
            ) : (
              rows && <span className="text-fg-muted">{rows}</span>
            )}
            <span className="text-fg-muted">
              Execution time: {finishedTime}
            </span>
          </>
        ) : (
          <span className="text-fg-muted">Ready</span>
        )}
      </div>

      <div className="flex min-w-0 flex-none items-center gap-4">
        {selection && selection.rows * selection.columns > 1 && (
          <span className="flex-none text-fg">
            {selection.rows} {selection.rows === 1 ? 'row' : 'rows'} × {selection.columns} {selection.columns === 1 ? 'column' : 'columns'} selected
          </span>
        )}
        {resultsFrom && (
          resultsFrom.stale ? (
            <span className="truncate text-warning">Results are from {resultsFrom.label}. Run to refresh.</span>
          ) : (
            <span className="truncate">Results from {resultsFrom.label}</span>
          )
        )}
        <div className="flex flex-none items-center gap-1.5" title="Result stream connection">
          <div className={`size-2 rounded-full ${hub.dotClass}`}></div>
          {hub.label}
        </div>
      </div>
    </div>
  );
}
