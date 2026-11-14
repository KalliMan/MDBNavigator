import { LuPlus, LuSquareTerminal } from 'react-icons/lu';
import useCommandQueryContext from '../../contexts/commandQuery/useCommandQueryContext';
import useDatabaseSchemaContext from '../../contexts/databaseSchema/useDatabaseSchema';
import useDatabaseServerConnectContext from '../../contexts/databaseServerConnect/useDatabaseServerConnect';
import Button from '../../ui/common/Button';
import { ButtonType } from '../../ui/common/ButtonType.enum';
import EmptyState from '../../ui/common/EmptyState';
import Kbd from '../../ui/common/Kbd';
import { newQueryTarget } from './queryTargets';

// The workspace while no query tab is open: says how to open one, and offers the shortest way.
export default function NoQueryOpen() {
  const { databaseServerConnections } = useDatabaseServerConnectContext();
  const { databaseSchemas } = useDatabaseSchemaContext();
  const { lastTreeDatabase, queryForDatabase } = useCommandQueryContext();

  const target = newQueryTarget(lastTreeDatabase, databaseServerConnections, databaseSchemas);
  const connected = databaseServerConnections.some(c => c.connectedResult);

  return (
    <EmptyState icon={<LuSquareTerminal size={40} strokeWidth={1.25} aria-hidden="true" />} title="No query open">
      <span>Click a database in the tree and choose "New Query for this database", or start here.</span>
      <div className="flex flex-col items-center gap-2">
        <Button type={ButtonType.primary} disabled={!target} onClick={() => target && queryForDatabase(target.connectionId, target.databaseName, '')}>
          <LuPlus size={14} aria-hidden="true" />
          New query
        </Button>
        {target ? (
          <span className="flex items-center gap-1.5 text-xs">
            on
            <span className="size-2.5 flex-none rounded-[2px]" style={{ backgroundColor: target.color }} />
            {target.serverName} · {target.databaseName}
          </span>
        ) : (
          <span className="text-xs">{connected ? 'Waiting for the list of databases…' : 'Connect to a server first.'}</span>
        )}
      </div>
      <div className="mt-2 grid grid-cols-[max-content_max-content] items-center gap-x-4 gap-y-2 border-t border-line-subtle pt-5 text-left text-[13px]">
        <span className="justify-self-end"><Kbd>Ctrl+Enter</Kbd></span><span>Run the query</span>
        <span className="justify-self-end"><Kbd>Double-click</Kbd></span><span>See a cell's full value</span>
        <span className="justify-self-end"><Kbd>Ctrl+C</Kbd></span><span>Copy the selected cells</span>
      </div>
    </EmptyState>
  );
}
