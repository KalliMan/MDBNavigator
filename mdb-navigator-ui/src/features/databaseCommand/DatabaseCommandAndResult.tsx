import { DatabaseCommandQueryBase, DatabaseCommandQueryType } from '../../models/databaseCommand/query/databaseCommandQueryBase';
import { useEffect, useState } from 'react';
import { DatabaseGetTopNRecordsTableCommandQuery } from '../../models/databaseCommand/query/databaseGetTopNRecordsTableCommandQuery';
import agent from '../../services/apiAgent';
import DatabaseCommand from './DatabaseCommand';
import { DatabaseCommandResultView } from './DatabaseCommandResultView';
import { DatabaseCommandResult } from '../../models/databaseCommand/databaseCommandResult';
import HorisontalSidebar from '../../ui/sidebar/HorisontalSidebar';

interface Props {
  databaseCommandQuery: DatabaseCommandQueryBase;
}

export default function DatabaseCommandAndResult({ databaseCommandQuery }: Props) {
//  const { getTopNTableRecords} = useDatabaseContext();
  const [databaseCommandResult, setDatabaseCommandResult] = useState<DatabaseCommandResult | null>(null);

  useEffect(() => {
    const exectureCommand = async () => {
      if ((databaseCommandQuery.databaseCommandQueryType === DatabaseCommandQueryType.GetTopNRecordsTable)) {
        const cmd = databaseCommandQuery as DatabaseGetTopNRecordsTableCommandQuery;
        const result = await agent.databaseCommandApi.getTopNTableRecords( cmd.id,
          cmd.databaseName,
          cmd.schema,
          cmd.table,
          cmd.recordsNumber);

          setDatabaseCommandResult(result);
      }
    }

    if (databaseCommandQuery.executeImmediately) {
      exectureCommand();
    }

  }, [databaseCommandQuery]);

  function handleExecute(query: string) {
    // const cmdScript: CommandQuery = {
    //   id: databaseCommandId,
    //   databaseName: databaseCommand.databaseName,
    //   query
    // };

    // dispatch(executeCommand(cmdScript));
  }

  if (!databaseCommandResult) {
    return null;
  }

  // <div className="w-full h-full grid grid-rows-[5fr_0.03fr_2fr] ">
  return (
    <div className="border-2 border-stone-400">
      <HorisontalSidebar>
        <div className="h-[93%]">
          <DatabaseCommand initialQuery={databaseCommandResult.script} execute={query => handleExecute(query)} />
        </div>
      </HorisontalSidebar>
      <div className="">
        < DatabaseCommandResultView databaseCommandResult={databaseCommandResult}/>
      </div>
    </div>
  );

/*
  const dispatch = useAppDispatch();
  const databaseCommandId = uuidv4();

  useEffectect(() => {
    if (databaseCommand.initialQuery && databaseCommand.executeImmediately) {
      const cmdScript: CommandQuery = {
        id: databaseCommandId,
        databaseName: databaseCommand.databaseName,
        query: databaseCommand.initialQuery
      };
      dispatch(executeCommand(cmdScript));
    }
  }, []);

  function handleExecute(query: string) {
    const cmdScript: CommandQuery = {
      id: databaseCommandId,
      databaseName: databaseCommand.databaseName,
      query
    };

    dispatch(executeCommand(cmdScript));
  }
*/


}

