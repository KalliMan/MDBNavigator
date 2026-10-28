import useDatabaseCommandSelector from '../../contexts/databaseCommand/useDatabaseCommandSelector';
import { DatabaseCommandSingleResultView } from './DatabaseCommandSingleResultView';


interface Props {
  databaseCommandQueryId: string;
}

export function DatabaseCommandResultView({ databaseCommandQueryId }: Props) {
  const { isExecuting, status, stats, resultSets } = useDatabaseCommandSelector(databaseCommandQueryId);

  if (resultSets.length === 0) {
    // Statements without a result set (INSERT/UPDATE/DDL) only report affected records.
    if (!isExecuting && status === 'Completed' && stats && stats.recordsAffected >= 0) {
      return <div className="p-2 text-sm">{stats.recordsAffected} records affected</div>;
    }
    return null;
  }

  // A single result set fills the area and scrolls itself; several are stacked with a fixed height each.
  if (resultSets.length === 1) {
    return (
      <div className="h-full">
        <DatabaseCommandSingleResultView key={resultSets[0].id} resultSet={resultSets[0]} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {resultSets.map(resultSet => (
        <div key={resultSet.id} className="h-[30vh] mb-4">
          <DatabaseCommandSingleResultView resultSet={resultSet} />
        </div>
      ))}
    </div>
  );
}
