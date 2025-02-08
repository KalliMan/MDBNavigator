import { useEffect, useRef, useState } from 'react';
import useDatabaseCommandContext from '../../contexts/databaseCommand/useDatabaseCommand';
import { DatabaseCommandResultField } from '../../models/databaseCommand/result/databaseCommandResultField';

interface Props {
  databaseCommandQueryId: string;
}

export function DatabaseCommandResultView({ databaseCommandQueryId }: Props) {

  const { isExecuting, executingCommandId, getDatabaseCommandResult, getDatabaseCommandBatchResults} = useDatabaseCommandContext();

  const [fields, setFields] = useState<DatabaseCommandResultField[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows, setRows] = useState<any[]>([]);
  const [recordsAffected, setRecordsAffected] = useState<number>(0);
  const lastProcessedIndex = useRef<number>(-1);

  const databaseCommandResult = getDatabaseCommandResult(databaseCommandQueryId);
  const databaseCommandBatchResults = getDatabaseCommandBatchResults(databaseCommandQueryId);

  useEffect(() => {
    if (isExecuting && executingCommandId === databaseCommandQueryId) {
      lastProcessedIndex.current = -1;
      setFields([]);
      setRows([]);
      setRecordsAffected(0);
    }
  },[databaseCommandQueryId, executingCommandId, isExecuting])

  useEffect(() => {

    if (!databaseCommandResult) {
      return;
    }

    const newFields = databaseCommandResult.fields;
    const newRows = databaseCommandResult.resultJson && JSON.parse(databaseCommandResult.resultJson);
    setRecordsAffected(databaseCommandResult.recordsAffected);

    setFields(newFields);
    setRows(r => [...newRows, ...r]);
  }, [databaseCommandResult]);

  useEffect(() => {
    if (!databaseCommandBatchResults) {
      return;
    }

    const newResults = databaseCommandBatchResults.filter(r => r.id === databaseCommandQueryId && r.index > lastProcessedIndex.current);
    if (!newResults?.length) {
      return;
    }

    lastProcessedIndex.current = newResults[newResults.length - 1].index;
    setRows(r => {
      let result = [...r];
      newResults.forEach(nr => {
        result = result.concat(JSON.parse(nr.resultJson));
      });

      return result;
    });

  }, [databaseCommandBatchResults, databaseCommandQueryId]);


  if (!fields) {
    return null;
  }

  return (
    <>
      <div className="overflow-x-auto overflow-y-auto bg-white dark:bg-neutral-700">
      { !fields || fields.length === 0 && (
        <span>{recordsAffected} records affected</span>
      )}
      { fields && fields.length > 0 && (
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
            {rows && Array.isArray(rows) && rows.map((row, index) => (
              <tr className="border-b dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-600" key={index}>
                {row && Array.isArray(row) && row.map(cell => (
                  <td className="px-3 py-2 border-x dark:border-neutral-600" key={cell}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </>
  );
}

