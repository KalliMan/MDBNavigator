import { LuChevronRight, LuDatabase, LuPlus } from 'react-icons/lu';
import Dropdown, { DropdownOption } from '../../ui/dropdown/Dropdown';
import useDatabaseServerConnectContext from '../../contexts/databaseServerConnect/useDatabaseServerConnect';
import useDatabaseSchemaContext from '../../contexts/databaseSchema/useDatabaseSchema';
import { QueryTarget } from '../../models/databaseCommand/query/queryTarget';
import { connectionAddress } from '../../utils/connectionColor';
import { databaseForServer, databaseList, queryTargetFor } from './queryTargets';

interface Props {
  target: QueryTarget;
  // True while the tab's query runs: where it runs can't change mid-run.
  locked: boolean;
  // note: set when the database changed without the user picking it.
  onChange: (target: QueryTarget, note: string | null) => void;
  // Either menu opened; the query bar clears its note.
  onMenuOpen: () => void;
}

const LOCKED_TITLE = 'Stop the query to change where it runs';

// The server and database of a query tab's query bar, as two menus (1.2d). Only connected servers are listed; the
// database list is the one the tree already loaded, so opening a menu loads nothing.
export default function QueryTargetPicker({ target, locked, onChange, onMenuOpen }: Props) {
  const { databaseServerConnections, connectNewDatabase } = useDatabaseServerConnectContext();
  const { databaseSchemas, fetchDatabases } = useDatabaseSchemaContext();

  const connected = databaseServerConnections.flatMap(c => (c.connectedResult ? [{ connection: c, result: c.connectedResult }] : []));
  const targetEntry = connected.find(e => e.result.connectionId === target.connectionId);
  const isConnected = !!targetEntry;

  // A color square that is the same in the button and in the rows.
  const square = (color: string, faded = false) => (
    <span
      className={`size-2.5 flex-none rounded-[2px] ${faded ? 'opacity-50' : ''}`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );

  const serverOptions: DropdownOption[] = [];
  if (!isConnected) {
    // The tab's old server stays visible, so it is clear why the tab can't run. It can't be picked.
    serverOptions.push({
      key: '',
      disabled: true,
      content: (
        <span className="flex items-center gap-2">
          {square(target.color, true)}
          <span className="truncate">{target.serverName}</span>
          <span className="rounded-full border border-danger px-1.5 text-[11px] text-danger">disconnected</span>
        </span>
      ),
    });
  }
  for (const { connection, result } of connected) {
    serverOptions.push({
      key: result.connectionId,
      selected: result.connectionId === target.connectionId,
      content: (
        <span className="flex items-center gap-2">
          {square(connection.color)}
          <span className="flex min-w-0 flex-col">
            <span className="truncate">{connection.name}</span>
            <span className="truncate font-mono text-xs text-fg-muted">{connectionAddress(result)}</span>
          </span>
        </span>
      ),
    });
  }

  function handleServerSelect(key: string) {
    const entry = connected.find(e => e.result.connectionId === key);
    if (!entry || key === target.connectionId) {
      return;
    }
    const schema = databaseSchemas?.find(s => s.connectionId === key);
    const choice = databaseForServer(target.databaseName, entry.connection.name, databaseList(schema), entry.result.databaseName);
    onChange(queryTargetFor(key, choice.databaseName, databaseServerConnections), choice.note);
  }

  const list = databaseList(databaseSchemas?.find(s => s.connectionId === target.connectionId));
  const defaultDatabase = targetEntry?.result.databaseName;

  const databaseOptions: DropdownOption[] = list.state === 'loaded'
    ? list.names.map(name => ({
        key: name,
        filterText: name,
        selected: name === target.databaseName,
        content: (
          <span className="flex items-center gap-2">
            <LuDatabase size={13} className="flex-none opacity-70" aria-hidden="true" />
            <span className="truncate">{name}</span>
            {name === defaultDatabase && (
              <span className="rounded-full border border-line px-1.5 text-[11px] text-fg-muted">default</span>
            )}
          </span>
        ),
      }))
    : [];

  const databaseStatus = list.state === 'loading' ? (
    <div className="flex items-center gap-2 text-fg-muted">
      <div className="size-3 rounded-full border-2 border-accent border-t-transparent animate-spin" aria-hidden="true"></div>
      Loading databases…
    </div>
  ) : list.state === 'failed' ? (
    <div>
      <p className="text-[13px] text-danger">Couldn't load the databases: {list.message}</p>
      <button
        type="button"
        onClick={() => void fetchDatabases(target.connectionId)}
        className="mt-1 cursor-pointer font-semibold text-accent underline"
      >
        Retry
      </button>
    </div>
  ) : undefined;

  function handleDatabaseSelect(name: string) {
    if (name === target.databaseName) {
      return;
    }
    onChange({ ...target, databaseName: name }, null);
  }

  return (
    <>
      <Dropdown
        ariaLabel="Server"
        heading="Servers"
        disabled={locked}
        title={locked ? LOCKED_TITLE : target.address || target.serverName}
        label={
          <>
            {square(target.color)}
            {target.serverName}
          </>
        }
        options={serverOptions}
        onSelect={handleServerSelect}
        footer={close => (
          <button
            type="button"
            onClick={() => { close(); connectNewDatabase(); }}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-fg-muted hover:bg-hover hover:text-fg"
          >
            <LuPlus size={14} aria-hidden="true" />
            Connect to another server…
          </button>
        )}
        onOpenChange={open => { if (open) onMenuOpen(); }}
        minWidth={280}
      />
      <LuChevronRight size={12} className="text-fg-faint" aria-hidden="true" />
      <Dropdown
        ariaLabel="Database"
        heading={`Databases on ${target.serverName}`}
        disabled={locked || !isConnected}
        title={locked ? LOCKED_TITLE : !isConnected ? 'Pick a connected server first' : undefined}
        label={
          <>
            <LuDatabase size={13} className="text-fg-muted" aria-hidden="true" />
            {target.databaseName}
          </>
        }
        options={databaseOptions}
        onSelect={handleDatabaseSelect}
        filterPlaceholder="Filter"
        status={databaseStatus}
        onOpenChange={open => { if (open) onMenuOpen(); }}
        minWidth={240}
      />
    </>
  );
}
