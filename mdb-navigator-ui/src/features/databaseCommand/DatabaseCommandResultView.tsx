import { useState } from 'react';
import useDatabaseCommandSelector from '../../contexts/databaseCommand/useDatabaseCommandSelector';
import { DatabaseCommandSingleResultView } from './DatabaseCommandSingleResultView';
import { SelectionSize } from '../../ui/dataGrid/selection';
import ResultTabs from './ResultTabs';
import { ResultMode } from './ResultToolbar';
import ResultError from './ResultError';
import ResultPlaceholder from './ResultPlaceholder';
import { ERROR_TAB_ID } from './runStatus';


interface Props {
  databaseCommandQueryId: string;
  // The tab on screen: a result set's id, ERROR_TAB_ID, or null. The parent works it out (activeResultTabId),
  // because the status bar shows that result's selection.
  activeTabId: string | null;
  onActiveTabChange: (tabId: string) => void;
  onSelectionChange: (resultSetId: string, size: SelectionSize | null) => void;
  executingLabel: string;
}

export function DatabaseCommandResultView({ databaseCommandQueryId, activeTabId, onActiveTabChange, onSelectionChange, executingLabel }: Props) {
  const { command, isExecuting, error, status, stats, resultSets } = useDatabaseCommandSelector(databaseCommandQueryId);
  // Table or CSV, for all of this query tab's results. It stays when a new run replaces them.
  const [mode, setMode] = useState<ResultMode>('table');

  if (resultSets.length === 0 && !error) {
    // Statements without a result set (INSERT/UPDATE/DDL) only report affected records; the placeholder says so.
    return <ResultPlaceholder isExecuting={isExecuting} executingLabel={executingLabel} status={status} stats={stats} />;
  }

  const errorActive = activeTabId === ERROR_TAB_ID;
  const tabs = (
    <ResultTabs
      results={resultSets.map(rs => ({ id: rs.id, rowCount: rs.rows.length, arriving: isExecuting && !rs.isComplete, truncated: rs.truncated }))}
      activeId={activeTabId ?? ''}
      hasError={!!error}
      onSelect={onActiveTabChange}
    />
  );

  // Every result stays mounted and the inactive ones are hidden (as query tabs do in ui/tabs/Tabs.tsx), because
  // each keeps its own filter, sort and column widths in its component.
  return (
    <div className="flex h-full flex-col">
      {errorActive && error && (
        <>
          {/* The strip the result toolbar draws, with the tabs only: an error has nothing to filter or export. */}
          <div className="flex h-8 flex-none items-center border-b border-line bg-chrome text-xs">{tabs}</div>
          <div className="min-h-0 flex-1">
            <ResultError error={error} />
          </div>
        </>
      )}
      {resultSets.map((resultSet, index) => {
        const shown = !errorActive && resultSet.id === activeTabId;
        return (
          <div key={resultSet.id} className={shown ? 'min-h-0 flex-1' : 'hidden'}>
            <DatabaseCommandSingleResultView
              resultSet={resultSet}
              isExecuting={isExecuting}
              isActive={shown}
              resultNumber={index + 1}
              tabs={tabs}
              mode={mode}
              onModeChange={setMode}
              databaseName={command?.ranOn?.databaseName ?? ''}
              onSelectionChange={onSelectionChange}
            />
          </div>
        );
      })}
    </div>
  );
}
