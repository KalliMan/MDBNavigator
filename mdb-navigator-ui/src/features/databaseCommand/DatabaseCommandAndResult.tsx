import { useState } from 'react';
import DatabaseCommand from './DatabaseCommand';
import { DatabaseCommandResultView } from './DatabaseCommandResultView';
import HorisontalSidebar from '../../ui/sidebar/HorisontalSidebar';
import { DatabaseSQLCommandQuery } from '../../models/databaseCommand/query/databaseSQLCommandQuery';
import { DatabaseCommandStatusBar } from './DatabaseCommandStatusBar';
import useDatabaseCommandSelector from '../../contexts/databaseCommand/useDatabaseCommandSelector';
import { QueryTarget } from '../../models/databaseCommand/query/queryTarget';
import useDatabaseServerConnectContext from '../../contexts/databaseServerConnect/useDatabaseServerConnect';
import { findConnection } from './queryTargets';
import { SelectionSize } from '../../ui/dataGrid/selection';
import { activeResultTabId, executingLabel } from './runStatus';

interface Props {
  databaseCommandQuery: DatabaseSQLCommandQuery;
  target: QueryTarget;
  onTargetChange: (target: QueryTarget) => void;
}

export default function DatabaseCommandAndResult({ databaseCommandQuery, target, onTargetChange }: Props) {
  const { command, isExecuting, error, status, stats, hubStatus, resultSets } = useDatabaseCommandSelector(databaseCommandQuery.id);
  const { databaseServerConnections } = useDatabaseServerConnectContext();

  // The tab of the result strip the user clicked last; null until then.
  const [pickedTabId, setPickedTabId] = useState<string | null>(null);

  // The size of the grid selection of each result set, so each tab shows its own in the status bar. Entries of
  // result sets from earlier runs are never read again (their ids are gone); they are a few numbers each.
  const [selections, setSelections] = useState<Record<string, SelectionSize>>({});

  function handleSelectionChange(resultSetId: string, size: SelectionSize | null) {
    setSelections(previous => {
      const next = { ...previous };
      if (size) {
        next[resultSetId] = size;
      } else {
        delete next[resultSetId];
      }
      return next;
    });
  }

  // The tab on screen. A new run replaces the result sets, so a picked id that is gone falls back to the first
  // result, or to the Error tab when the run failed.
  const activeTabId = activeResultTabId(resultSets.map(rs => rs.id), pickedTabId, !!error);
  // No fallback: the Error tab has no selection.
  const activeResult = resultSets.find(rs => rs.id === activeTabId);
  const selectionSize = (activeResult && selections[activeResult.id]) || null;

  // Only when the results on screen came from somewhere else than the tab now points (1.2d). A failed run shows its error instead.
  const ranOn = command?.ranOn;
  const staleResultsFrom = ranOn && !isExecuting && (status === 'Completed' || status === 'Cancelled')
    && (ranOn.connectionId !== target.connectionId || ranOn.databaseName !== target.databaseName)
    ? `${findConnection(databaseServerConnections, ranOn.connectionId)?.name ?? target.serverName} · ${ranOn.databaseName}`
    : null;
  const runningLabel = executingLabel(command?.runningStatement ?? null, resultSets);

  if (!databaseCommandQuery) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      <HorisontalSidebar>
        <div className="h-full">
          <DatabaseCommand databaseCommandQuery={databaseCommandQuery} target={target} onTargetChange={onTargetChange} />
        </div>
      </HorisontalSidebar>
      {/* min-h-0: the result grid scrolls itself instead of growing the page */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <DatabaseCommandResultView
          databaseCommandQueryId={databaseCommandQuery.id}
          activeTabId={activeTabId}
          onActiveTabChange={setPickedTabId}
          onSelectionChange={handleSelectionChange}
          executingLabel={runningLabel}
        />
      </div>
      <DatabaseCommandStatusBar 
        isExecuting={isExecuting}
        error={error}
        status={status}
        stats={stats}
        hubStatus={hubStatus}
        target={{ label: `${target.serverName} · ${target.databaseName}`, color: target.color }}
        staleResultsFrom={staleResultsFrom}
        selection={selectionSize}
        resultSetCount={resultSets.length}
        executingLabel={runningLabel}
        truncatedResultCount={resultSets.filter(rs => rs.truncated).length}
      />
    </div>
  );
}

