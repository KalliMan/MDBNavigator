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
    <div className="rounded-scrollbar h-full overflow-y-auto p-2 space-y-3 bg-neutral-100 dark:bg-neutral-800">
      {/* Each stacked grid gets its own frame so its edges and scrollbars are clearly bounded. */}
      {resultSets.map(resultSet => (
        <div key={resultSet.id} className="h-[30vh] border border-neutral-400 dark:border-neutral-600 overflow-hidden">
          <DatabaseCommandSingleResultView resultSet={resultSet} />
        </div>
      ))}
    </div>
  );
}
