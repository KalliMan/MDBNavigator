import useDatabaseCommandSelector from '../../contexts/databaseCommand/useDatabaseCommandSelector';
import { DatabaseCommandSingleResultView } from './DatabaseCommandSingleResultView';


interface Props {
  databaseCommandQueryId: string;
}

export function DatabaseCommandResultView({ databaseCommandQueryId }: Props) {
  const { isExecuting, result, batchResults } = useDatabaseCommandSelector(databaseCommandQueryId);

  const databaseCommandResults = result && result.results?.length > 0
    ? result.results
    : null;

  if (!databaseCommandResults){
    return null;
  }

  return (<>
    {databaseCommandResults.map((res, index) => (
      <div key={index} className="mb-4 overflow-x-auto overflow-y-auto bg-white dark:bg-neutral-700">
        <DatabaseCommandSingleResultView
          isExecuting={isExecuting}
          databaseCommandResult={res}
          batchResults={batchResults.filter(b => b.id === res.id )}
        />
      </div>
    ))}
  </>);
}