import DatabaseCommand from './DatabaseCommand';
import { DatabaseCommandResultView } from './DatabaseCommandResultView';
import HorisontalSidebar from '../../ui/sidebar/HorisontalSidebar';
import { DatabaseSQLCommandQuery } from '../../models/databaseCommand/query/databaseSQLCommandQuery';
import { DatabaseCommandStatusBar } from './DatabaseCommandStatusBar';
import useDatabaseCommandSelector from '../../contexts/databaseCommand/useDatabaseCommandSelector';
import { QueryTarget } from '../../models/databaseCommand/query/queryTarget';
import useDatabaseServerConnectContext from '../../contexts/databaseServerConnect/useDatabaseServerConnect';
import { findConnection } from './queryTargets';

interface Props {
  databaseCommandQuery: DatabaseSQLCommandQuery;
  target: QueryTarget;
  onTargetChange: (target: QueryTarget) => void;
}

export default function DatabaseCommandAndResult({ databaseCommandQuery, target, onTargetChange }: Props) {
  const { command, isExecuting, error, status, stats, hubStatus } = useDatabaseCommandSelector(databaseCommandQuery.id);
  const { databaseServerConnections } = useDatabaseServerConnectContext();

  // Only runs that produced results get a label; a failed run shows its error instead.
  const ranOn = command?.ranOn;
  const resultsFrom = ranOn && !isExecuting && (status === 'Completed' || status === 'Cancelled')
    ? {
        label: `${findConnection(databaseServerConnections, ranOn.connectionId)?.name ?? target.serverName} · ${ranOn.databaseName}`,
        stale: ranOn.connectionId !== target.connectionId || ranOn.databaseName !== target.databaseName,
      }
    : null;

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
        <DatabaseCommandResultView databaseCommandQueryId={databaseCommandQuery.id}/>
      </div>
      <DatabaseCommandStatusBar 
        isExecuting={isExecuting}
        error={error}
        status={status}
        stats={stats}
        hubStatus={hubStatus}
        resultsFrom={resultsFrom}
      />
    </div>
  );
}

