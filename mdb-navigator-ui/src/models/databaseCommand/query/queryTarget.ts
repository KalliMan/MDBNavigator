// Where a query tab runs. It starts as the query's own connection and database, and the query bar can change it
// (1.2d). Names and color are copied in, so the tab still shows them after its server is disconnected.
export interface QueryTarget {
  connectionId: string;
  serverName: string;
  databaseName: string;
  // user@host:port; empty when the connection was not found
  address: string;
  color: string;
}
