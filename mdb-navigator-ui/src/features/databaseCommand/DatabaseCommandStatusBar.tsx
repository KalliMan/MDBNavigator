import { useEffect, useState } from 'react';
import { CommandExecutionStatus } from '../../models/databaseCommand/result/commandFinishedResult';
import { DatabaseCommandStats } from '../../contexts/databaseCommand/DatabaseCommandReducer';
import { HubStatus } from '../../services/commandResultHub';

interface Props {
  isExecuting: boolean;
  error: string | null;
  status: CommandExecutionStatus | null;
  stats: DatabaseCommandStats | null;
  hubStatus: HubStatus;
}

const hubStatusView: Record<HubStatus, { label: string; dotClass: string }> = {
  connected: { label: 'Connected', dotClass: 'bg-green-400' },
  connecting: { label: 'Connecting...', dotClass: 'bg-yellow-300' },
  reconnecting: { label: 'Reconnecting...', dotClass: 'bg-yellow-300' },
  disconnected: { label: 'Disconnected', dotClass: 'bg-red-500' },
};

const formatTime = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = Math.floor(ms / 1000);
  const milliseconds = ms % 1000;
  return `${seconds}s ${milliseconds}ms`;
};

function formatRows(stats: DatabaseCommandStats | null): string | null {
  if (!stats) {
    return null;
  }
  if (stats.rowCount > 0) {
    return `${stats.rowCount} ${stats.rowCount === 1 ? 'row' : 'rows'}`;
  }
  if (stats.recordsAffected >= 0) {
    return `${stats.recordsAffected} records affected`;
  }
  return null;
}

export function DatabaseCommandStatusBar({ isExecuting, error, status, stats, hubStatus }: Props) {
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
  const rows = formatRows(stats);
  const hub = hubStatusView[hubStatus];

  return (
    <div className="h-8 bg-blue-600 dark:bg-blue-800 text-white px-4 flex items-center justify-between gap-4 text-sm border-t border-stone-400">
      <div className="flex items-center gap-4 min-w-0">
        {isExecuting ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">Executing query...</span>
            </div>
            <span className="text-blue-100">
              Elapsed time: {formatTime(executionTime)}
            </span>
          </>
        ) : error ? (
          <>
            <div className="flex items-center gap-2 flex-none">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="font-medium">Query execution failed</span>
            </div>
            <span className="text-red-200 truncate" title={error}>
              Error: {error}
            </span>
          </>
        ) : status === 'Cancelled' ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-300 rounded-full"></div>
              <span className="font-medium">
                Query cancelled{stats && stats.rowCount > 0 ? ` after ${formatRows(stats)}` : ''}
              </span>
            </div>
            <span className="text-blue-100">
              Execution time: {finishedTime}
            </span>
          </>
        ) : status === 'Completed' ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 rounded-full"></div>
              <span className="font-medium">Query executed successfully</span>
            </div>
            {rows && <span className="text-blue-100">{rows}</span>}
            <span className="text-blue-100">
              Execution time: {finishedTime}
            </span>
          </>
        ) : (
          <span className="text-blue-100">Ready</span>
        )}
      </div>

      <div className="flex items-center gap-2 text-blue-100 text-xs flex-none" title="Result stream connection">
        <div className={`w-2 h-2 rounded-full ${hub.dotClass}`}></div>
        {hub.label}
      </div>
    </div>
  );
}
