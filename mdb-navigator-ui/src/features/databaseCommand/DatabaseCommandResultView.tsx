import useDatabaseCommandContext from '../../contexts/databaseCommand/useDatabaseCommand';

interface Props {
  databaseCommandQueryId: string;
}

export function DatabaseCommandResultView({ databaseCommandQueryId }: Props) {

  const { getDatabaseCommantResult } = useDatabaseCommandContext();

  const databaseCommandResult = getDatabaseCommantResult(databaseCommandQueryId);
  if (!databaseCommandResult) {
    return null;
  }

  const fields = databaseCommandResult.fields;
  const rows = databaseCommandResult.resultJson && JSON.parse(databaseCommandResult.resultJson);

  if (!fields) {
    return null;
  }

  return (
    <div className="">
      <div className="overflow-x-auto overflow-y-auto bg-white dark:bg-neutral-700">
      { !fields || fields.length === 0 && (
        <span>{databaseCommandResult.recordsAffected} records affected</span>
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
      )}
    </div>
  </div>
  );
}

