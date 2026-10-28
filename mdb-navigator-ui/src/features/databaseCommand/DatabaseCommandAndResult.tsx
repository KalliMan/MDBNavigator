import DatabaseCommand from './DatabaseCommand';
import { DatabaseCommandResultView } from './DatabaseCommandResultView';
import HorisontalSidebar from '../../ui/sidebar/HorisontalSidebar';
import { DatabaseSQLCommandQuery } from '../../models/databaseCommand/query/databaseSQLCommandQuery';
import { DatabaseCommandStatusBar } from './DatabaseCommandStatusBar';
import useDatabaseCommandSelector from '../../contexts/databaseCommand/useDatabaseCommandSelector';

interface Props {
  databaseCommandQuery: DatabaseSQLCommandQuery;
}

export default function DatabaseCommandAndResult({ databaseCommandQuery }: Props) {
const { isExecuting, error, status, stats, hubStatus } = useDatabaseCommandSelector(databaseCommandQuery.id);

  if (!databaseCommandQuery) {
    return null;
  }

  return (
    <div className="border-2 border-stone-400 flex flex-col h-full">
      <HorisontalSidebar>
        <div className="h-full">
          <DatabaseCommand databaseCommandQuery={databaseCommandQuery} />
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

