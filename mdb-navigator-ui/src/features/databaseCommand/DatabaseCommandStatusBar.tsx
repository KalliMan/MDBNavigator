import { useEffect, useState } from 'react';

interface Props {
  isExecuting: boolean;
  error: string | null;
}

export function DatabaseCommandStatusBar({ isExecuting, error }: Props) {
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

  const formatTime = (ms: number): string => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    return `${seconds}s ${milliseconds}ms`;
  };

  return (
    <div className="h-8 bg-blue-600 dark:bg-blue-800 text-white px-4 flex items-center justify-between text-sm border-t border-stone-400">
      <div className="flex items-center gap-4">
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
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="font-medium">Query execution failed</span>
            </div>
            <span className="text-red-200">
              Error: {error}
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
        {isExecuting ? 'Running...' : 'Idle'}
      </div>
    </div>
  );
}
