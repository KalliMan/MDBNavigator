import { useState } from 'react';
import useDatabaseCommandSelector from '../../contexts/databaseCommand/useDatabaseCommandSelector';
import { DatabaseCommandSingleResultView } from './DatabaseCommandSingleResultView';
import { SelectionSize } from '../../ui/dataGrid/selection';
import ResultTabs from './ResultTabs';
import { ResultMode } from './ResultToolbar';


interface Props {
  databaseCommandQueryId: string;
  // The result tab on screen; the parent owns it because the status bar shows that result's selection.
  activeResultId: string | null;
  onActiveResultChange: (resultSetId: string) => void;
  onSelectionChange: (resultSetId: string, size: SelectionSize | null) => void;
}

export function DatabaseCommandResultView({ databaseCommandQueryId, activeResultId, onActiveResultChange, onSelectionChange }: Props) {
  const { command, isExecuting, status, stats, resultSets } = useDatabaseCommandSelector(databaseCommandQueryId);
  // Table or CSV, for all of this query tab's results. It stays when a new run replaces them.
  const [mode, setMode] = useState<ResultMode>('table');

  if (resultSets.length === 0) {
    // Statements without a result set (INSERT/UPDATE/DDL) only report affected records.
    if (!isExecuting && status === 'Completed' && stats && stats.recordsAffected >= 0) {
      return <div className="p-2 text-fg-muted">{stats.recordsAffected} records affected</div>;
    }
    return null;
  }

  const active = resultSets.find(rs => rs.id === activeResultId) ?? resultSets[0];
  const tabs = (
    <ResultTabs
      results={resultSets.map(rs => ({ id: rs.id, rowCount: rs.rows.length, arriving: isExecuting && !rs.isComplete, truncated: rs.truncated }))}
      activeId={active.id}
      onSelect={onActiveResultChange}
    />
  );

  // Every result stays mounted and the inactive ones are hidden (as query tabs do in ui/tabs/Tabs.tsx), because
  // each keeps its own filter, sort and column widths in its component.
  return (
    <div className="h-full">
      {resultSets.map((resultSet, index) => (
        <div key={resultSet.id} className={resultSet.id === active.id ? 'h-full' : 'hidden'}>
          <DatabaseCommandSingleResultView
            resultSet={resultSet}
            isExecuting={isExecuting}
            isActive={resultSet.id === active.id}
            resultNumber={index + 1}
            tabs={tabs}
            mode={mode}
            onModeChange={setMode}
            databaseName={command?.ranOn?.databaseName ?? ''}
            onSelectionChange={onSelectionChange}
          />
        </div>
      ))}
    </div>
  );
}
