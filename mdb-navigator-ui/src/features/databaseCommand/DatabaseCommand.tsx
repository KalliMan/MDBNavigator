import { useEffect, useRef, useState } from 'react';
import Button from '../../ui/common/Button';
import { ButtonType } from '../../ui/common/ButtonType.enum';
import { DatabaseSQLCommandQuery } from '../../models/databaseCommand/query/databaseSQLCommandQuery';
import useDatabaseCommandContext from '../../contexts/databaseCommand/useDatabaseCommand';

interface Props {
  databaseCommandQuery: DatabaseSQLCommandQuery;
  execute?(query: string): void;
}

export default function DatabaseCommand({ databaseCommandQuery }: Props) {
  const { executeDatabaseSQLCommand} = useDatabaseCommandContext();
  const commandQuery = useRef<DatabaseSQLCommandQuery>(databaseCommandQuery);
  const [sqlQuery, setSqlQuery] = useState<string>(commandQuery.current.cmdQuery);

  useEffect(() => {
      if ((commandQuery.current.executeImmediately)) {

        executeDatabaseSQLCommand(commandQuery.current);
        commandQuery.current.executeImmediately = false;
      }
    },
    [commandQuery, executeDatabaseSQLCommand]
  );

  function handleExecute() {
    commandQuery.current.cmdQuery = sqlQuery;
    executeDatabaseSQLCommand(commandQuery.current);
  }

  return (
    <div className="border h-full">
      <div className="h-[90%]">
        <textarea
          className="w-full h-full flex flex-grow overflow-auto bg-stone-100 p-2 resize-none"
          name=""
          id=""
          placeholder="Put your query here"
          value={sqlQuery}
          onChange={e => setSqlQuery(e.target.value)}
        >
        </textarea>
      </div>
      <div className="min-h-10 flex items-center px-2">
        <Button type={ButtonType.primary} onClick={handleExecute}>Execute</Button>
      </div>
    </div>
  );
}

