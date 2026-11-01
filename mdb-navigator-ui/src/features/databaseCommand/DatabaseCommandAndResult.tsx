import DatabaseCommand from './DatabaseCommand';
import { DatabaseCommandResultView } from './DatabaseCommandResultView';
import HorisontalSidebar from '../../ui/sidebar/HorisontalSidebar';
import { DatabaseSQLCommandQuery } from '../../models/databaseCommand/query/databaseSQLCommandQuery';
import { DatabaseCommandStatusBar } from './DatabaseCommandStatusBar';
import useDatabaseCommandSelector from '../../contexts/databaseCommand/useDatabaseCommandSelector';
import { QueryTarget } from '../../models/databaseCommand/query/queryTarget';

interface Props {
  databaseCommandQuery: DatabaseSQLCommandQuery;
  target: QueryTarget;
}

export default function DatabaseCommandAndResult({ databaseCommandQuery, target }: Props) {
const { isExecuting, error, status, stats, hubStatus } = useDatabaseCommandSelector(databaseCommandQuery.id);

  if (!databaseCommandQuery) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      <HorisontalSidebar>
        <div className="h-full">
          <DatabaseCommand databaseCommandQuery={databaseCommandQuery} target={target} />
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
      />
    </div>
  );
}

