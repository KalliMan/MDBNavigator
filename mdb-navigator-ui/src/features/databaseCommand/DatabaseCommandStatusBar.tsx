import { useEffect, useState } from 'react';

interface Props {
  isExecuting: boolean;
  queryId: string;
  executingCommandId: string | null;
}

export function DatabaseCommandStatusBar({ isExecuting, queryId, executingCommandId }: Props) {
  const [executionTime, setExecutionTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isCurrentQueryExecuting, setIsCurrentQueryExecuting] = useState(false);

  useEffect(() => {
    const executing = isExecuting && executingCommandId === queryId;
    setIsCurrentQueryExecuting(executing);

    if (executing && !startTime) {
      setStartTime(Date.now());
      setExecutionTime(0);
    } else if (!executing && startTime !== null) {
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);
      setStartTime(null);
    }
  }, [isExecuting, executingCommandId, queryId, startTime]);

  useEffect(() => {
    if (!isCurrentQueryExecuting || startTime === null) {
      return;
    }

    const interval = setInterval(() => {
      setExecutionTime(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [isCurrentQueryExecuting, startTime]);

  const formatTime = (ms: number): string => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    const seconds = (ms / 1000).toFixed(2);
    return `${seconds}s`;
  };

  return (
    <div className="h-8 bg-blue-600 dark:bg-blue-800 text-white px-4 flex items-center justify-between text-sm border-t border-stone-400">
      <div className="flex items-center gap-4">
        {isCurrentQueryExecuting ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">Executing query...</span>
            </div>
            <span className="text-blue-100">
              Elapsed time: {formatTime(executionTime)}
            </span>
          </>
        ) : executionTime > 0 ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 rounded-full"></div>
              <span className="font-medium">Query executed successfully</span>
            </div>
            <span className="text-blue-100">
              Execution time: {formatTime(executionTime)}
            </span>
          </>
        ) : (
          <span className="text-blue-100">Ready</span>
        )}
      </div>
      
      <div className="text-blue-100 text-xs">
        {isCurrentQueryExecuting ? 'Running...' : 'Idle'}
      </div>
    </div>
  );
}
