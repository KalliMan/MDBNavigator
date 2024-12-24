import { useEffect, useRef } from 'react';
import { DatabaseCommandResult, DatabaseCommantResult } from '../../models/databaseCommand/databaseCommandResult';

interface Props {
  databaseCommandResult: DatabaseCommandResult;
}

export function DatabaseCommandResultView({ databaseCommandResult }: Props) {

  if (!databaseCommandResult) {
    return null;
  }

  const fields = databaseCommandResult.fields;
  const rows = databaseCommandResult.resultJson && JSON.parse(databaseCommandResult.resultJson);

  if (!fields) {
    return null;
  }

  return (
    <div className="border mb-1">
      <div className="overflow-x-auto overflow-y-auto bg-white dark:bg-neutral-700">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="uppercase tracking-wider border-b-2 dark:border-neutral-600 border-t">
            <tr>
              {fields?.map(field => (
                <th
                  scope="col"
                  className="px-3 py-2 border-x dark:border-neutral-600"
                  key={field.index}
                >
                  {field.fieldName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows && Array.isArray(rows) && rows.map(row => (
              <tr className="border-b dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-600" key={row}>
                {row && Array.isArray(row) && row.map(cell => (
                  <td className="px-3 py-2 border-x dark:border-neutral-600" key={cell}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /*
  const commandResult = useAppSelector(appDatabaseCommandResult);
  const { batchResult } = useSignalRStore();

  const databaseCommandResult = useRef<DatabaseCommantResult>();
  const databaseCommantResultUI = useRef<DatabaseCommantResultUI>();

  useEffect(() => {
    batchResult.createHubConnection(commandId);
  }, [batchResult, commandId]);

  if (commandResult?.id === commandId) {
    databaseCommandResult.current = commandResult;
  }

  const fields = databaseCommandResult.current?.fields;

  if (!fields) {
    return null;
  }

  let rows = databaseCommandResult.current?.resultJson && JSON.parse(databaseCommandResult.current?.resultJson);

  // console.log('batchResult.batchResult');
  // console.log(batchResult.result);

  if (batchResult.result?.length > 0) {
    batchResult.result.forEach((res) => {
      debugger
      const newRows = res.resultJson && JSON.parse(res.resultJson);
      if (newRows.length > 0) {
        rows = rows.concat(newRows);
      }
    })
  }

  databaseCommantResultUI.current = {
    rows
  };

  console.log('Final Rows');
  console.log(rows);

  return (
    <div className="border mb-1">
      <div className="overflow-x-auto overflow-y-auto bg-white dark:bg-neutral-700">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="uppercase tracking-wider border-b-2 dark:border-neutral-600 border-t">
            <tr>
              {fields?.map(field => (
                <th
                  scope="col"
                  className="px-3 py-2 border-x dark:border-neutral-600"
                  key={field.index}
                >
                  {field.fieldName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows && Array.isArray(rows) && rows.map(row => (
              <tr className="border-b dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-600" key={row}>
                {row && Array.isArray(row) && row.map(cell => (
                  <td className="px-3 py-2 border-x dark:border-neutral-600" key={cell}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  */
}

