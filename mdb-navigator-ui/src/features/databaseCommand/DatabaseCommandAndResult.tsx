import DatabaseCommand from './DatabaseCommand';
import { DatabaseCommandResultView } from './DatabaseCommandResultView';
import HorisontalSidebar from '../../ui/sidebar/HorisontalSidebar';
import { DatabaseSQLCommandQuery } from '../../models/databaseCommand/query/databaseSQLCommandQuery';

interface Props {
  databaseCommandQuery: DatabaseSQLCommandQuery;
}

export default function DatabaseCommandAndResult({ databaseCommandQuery }: Props) {

  if (!databaseCommandQuery) {
    return null;
  }

  // <div className="w-full h-full grid grid-rows-[5fr_0.03fr_2fr] ">
  return (
    <div className="border-2 border-stone-400">
      <HorisontalSidebar>
        <div className="h-[93%]">
          <DatabaseCommand databaseCommandQuery={databaseCommandQuery} />
        </div>
      </HorisontalSidebar>
      <div className="">
        < DatabaseCommandResultView databaseCommandQueryId={databaseCommandQuery.id}/>
      </div>
    </div>
  );
}

