import { DatabaseServerConnection } from '../../contexts/databaseServerConnect/DatabaseServerConnectReducer';
import { DatabaseSchema } from '../../contexts/databaseSchema/DatabaseSchemaReducer';
import { QueryTarget } from '../../models/databaseCommand/query/queryTarget';
import { connectionAddress, UNKNOWN_CONNECTION_COLOR } from '../../utils/connectionColor';

// Helpers for a query tab's target (1.2d). Pure, so they can get unit tests in 0.3a.

export function findConnection(connections: DatabaseServerConnection[], connectionId: string): DatabaseServerConnection | undefined {
  return connections.find(c => c.connectedResult?.connectionId === connectionId);
}

export function queryTargetFor(connectionId: string, databaseName: string, connections: DatabaseServerConnection[]): QueryTarget {
  const match = findConnection(connections, connectionId);
  const connection = match?.connectedResult;
  if (!match || !connection) {
    return { connectionId, serverName: 'Unknown server', databaseName, address: '', color: UNKNOWN_CONNECTION_COLOR };
  }
  return { connectionId, serverName: match.name, databaseName, address: connectionAddress(connection), color: match.color };
}

export type DatabaseList =
  | { state: 'loaded'; names: string[] }
  | { state: 'loading' }
  | { state: 'failed'; message: string };

// A loaded list wins over an error: a failed refresh keeps the list it had.
export function databaseList(schema: DatabaseSchema | undefined): DatabaseList {
  if (schema?.databasesDetails) {
    return { state: 'loaded', names: schema.databasesDetails.databases.map(d => d.name) };
  }
  if (schema?.error) {
    return { state: 'failed', message: schema.error };
  }
  return { state: 'loading' };
}

export interface DatabaseChoice {
  databaseName: string;
  // Shown in the query bar when the database changed without the user picking it.
  note: string | null;
}

// The database a tab uses after switching to another server: the same name when that server has it, else the
// connection's default database, else the server's first database.
export function databaseForServer(
  currentDatabase: string,
  serverName: string,
  list: DatabaseList,
  defaultDatabase: string | null | undefined,
): DatabaseChoice {
  if (list.state !== 'loaded') {
    const databaseName = defaultDatabase || currentDatabase;
    return {
      databaseName,
      note: databaseName === currentDatabase
        ? null
        : `${serverName}'s database list isn't loaded, so the tab uses its default database "${databaseName}".`,
    };
  }
  if (list.names.includes(currentDatabase)) {
    return { databaseName: currentDatabase, note: null };
  }
  const fallback = defaultDatabase && list.names.includes(defaultDatabase) ? defaultDatabase : list.names[0];
  if (!fallback) {
    return { databaseName: currentDatabase, note: null };
  }
  return { databaseName: fallback, note: `"${currentDatabase}" isn't on ${serverName}, so the tab now uses "${fallback}".` };
}

export interface TreeDatabase {
  connectionId: string;
  databaseName: string;
}

export interface NewQueryTarget extends TreeDatabase {
  serverName: string;
  color: string;
}

// Where the "New query" button of the empty workspace opens its tab: the database clicked last in the tree while
// its server is still connected, else the first connected server's default database, else that server's first
// database. null: nothing to open on yet (no server, or its database list hasn't arrived).
export function newQueryTarget(
  last: TreeDatabase | null,
  connections: DatabaseServerConnection[],
  schemas: DatabaseSchema[] | null,
): NewQueryTarget | null {
  if (last) {
    const match = findConnection(connections, last.connectionId);
    if (match) {
      return { connectionId: last.connectionId, databaseName: last.databaseName, serverName: match.name, color: match.color };
    }
  }
  const first = connections.find(c => c.connectedResult);
  const connected = first?.connectedResult;
  if (!first || !connected) {
    return null;
  }
  const target = (databaseName: string): NewQueryTarget =>
    ({ connectionId: connected.connectionId, databaseName, serverName: first.name, color: first.color });
  if (connected.databaseName) {
    return target(connected.databaseName);
  }
  const list = databaseList(schemas?.find(s => s.connectionId === connected.connectionId));
  if (list.state === 'loaded' && list.names.length > 0) {
    return target(list.names[0]);
  }
  return null;
}
