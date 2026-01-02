import DatabaseCommand from './DatabaseCommand';
import { DatabaseCommandResultView } from './DatabaseCommandResultView';
import HorisontalSidebar from '../../ui/sidebar/HorisontalSidebar';
import { DatabaseSQLCommandQuery } from '../../models/databaseCommand/query/databaseSQLCommandQuery';
import { DatabaseCommandStatusBar } from './DatabaseCommandStatusBar';
import useDatabaseCommandContext from '../../contexts/databaseCommand/useDatabaseCommand';

interface Props {
  databaseCommandQuery: DatabaseSQLCommandQuery;
}

export default function DatabaseCommandAndResult({ databaseCommandQuery }: Props) {
  const { isExecuting, executingCommandId } = useDatabaseCommandContext();

  if (!databaseCommandQuery) {
    return null;
  }

  return (
    <div className="border-2 border-stone-400 flex flex-col h-full">
      <HorisontalSidebar>
        <div className="h-[93%]">
          <DatabaseCommand databaseCommandQuery={databaseCommandQuery} />
        </div>
      </HorisontalSidebar>
      <div className="flex-1 overflow-auto">
        <DatabaseCommandResultView databaseCommandQueryId={databaseCommandQuery.id}/>
      </div>
      <DatabaseCommandStatusBar 
        isExecuting={isExecuting}
        queryId={databaseCommandQuery.id}
        executingCommandId={executingCommandId}
      />
    </div>
  );
}

