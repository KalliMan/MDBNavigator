import { LuBan, LuCircleCheck, LuTable2 } from 'react-icons/lu';
import { DatabaseCommandStats } from '../../contexts/databaseCommand/DatabaseCommandReducer';
import { CommandExecutionStatus } from '../../models/databaseCommand/result/commandFinishedResult';
import EmptyState from '../../ui/common/EmptyState';
import Kbd from '../../ui/common/Kbd';
import { recordsAffectedText } from './runStatus';

interface Props {
  isExecuting: boolean;
  // The status bar's text while a run is going.
  executingLabel: string;
  status: CommandExecutionStatus | null;
  stats: DatabaseCommandStats | null;
}

// The result pane while there is no result set and no error to show.
export default function ResultPlaceholder({ isExecuting, executingLabel, status, stats }: Props) {
  if (isExecuting) {
    return (
      <EmptyState
        icon={<div className="size-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />}
        title={executingLabel}
      />
    );
  }
  if (status === 'Completed') {
    // Statements without a result set (INSERT/UPDATE/DDL) only report affected records.
    return (
      <EmptyState
        icon={<LuCircleCheck size={32} strokeWidth={1.5} className="text-success" aria-hidden="true" />}
        title={stats && stats.recordsAffected >= 0 ? recordsAffectedText(stats.recordsAffected) : 'Done'}
      >
        The script ran and returned no rows to show.
      </EmptyState>
    );
  }
  if (status === 'Cancelled') {
    return (
      <EmptyState icon={<LuBan size={32} strokeWidth={1.5} aria-hidden="true" />} title="Query cancelled">
        It stopped before any rows arrived.
      </EmptyState>
    );
  }
  return (
    <EmptyState icon={<LuTable2 size={32} strokeWidth={1.5} aria-hidden="true" />} title="No results yet">
      <span>Press <Kbd>Ctrl+Enter</Kbd> or Run. Each statement that returns rows gets its own tab here.</span>
    </EmptyState>
  );
}
