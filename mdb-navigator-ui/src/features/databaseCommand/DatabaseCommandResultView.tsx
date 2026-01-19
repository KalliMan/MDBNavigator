import { useEffect, useState } from 'react';
import { DatabaseCommandResultField } from '../../models/databaseCommand/result/databaseCommandResultField';
import useDatabaseCommandSelector from '../../contexts/databaseCommand/useDatabaseCommandSelector';


interface Props {
  databaseCommandQueryId: string;
}

export function DatabaseCommandResultView({ databaseCommandQueryId }: Props) {
  const { isExecuting, result, batchResults } = useDatabaseCommandSelector(databaseCommandQueryId);

  const [fields, setFields] = useState<DatabaseCommandResultField[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows, setRows] = useState<any[]>([]);
  const [recordsAffected, setRecordsAffected] = useState<number>(0);

  useEffect(() => {

    if (isExecuting) {
      // If executing, clear everything
      setFields([]);
      setRows([]);
      setRecordsAffected(0);
      return;
    }

    if (!result) {
      return;
    }

    const newFields = result.fields;
    const initialRows = result.resultJson ? JSON.parse(result.resultJson) : [];

    let allRows = [...initialRows];

    const queryBatchResults = batchResults;

    if (queryBatchResults && queryBatchResults.length > 0) {
      const sortedBatches = [...queryBatchResults].sort((a, b) => a.index - b.index);

      sortedBatches.forEach(batch => {
        const batchRows = JSON.parse(batch.resultJson);
        allRows = allRows.concat(batchRows);
      });
    }

    setFields(newFields);
    setRows(allRows);
    setRecordsAffected(result.recordsAffected);

  }, [databaseCommandQueryId, result, batchResults, isExecuting]);


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
          <thead className="uppercase tracking-wider border-b-2 dark:border-neutral-600 border-t sticky top-0">
            <tr>
              <th className="w-[2%] bg-neutral-400" key={"rowIndex"}></th>
              {fields?.map(field => (
                <th
                  scope="col"
                  className="px-3 py-2 border-x dark:border-neutral-600 bg-neutral-400"
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
                <td className="px-3 py-2 border-x dark:border-neutral-600 bg-neutral-400 font-medium">{index + 1}</td>
                {row && Array.isArray(row) && row.map((cell, cellIndex) => (
                  <td className="px-3 py-2 border-x dark:border-neutral-600" key={cellIndex}>
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

