// Where a query tab runs. Captured when the tab opens, so the tab still shows it after its server is disconnected.
export interface QueryTarget {
  serverName: string;
  databaseName: string;
  // user@host:port; empty when the connection was not found
  address: string;
  color: string;
}
