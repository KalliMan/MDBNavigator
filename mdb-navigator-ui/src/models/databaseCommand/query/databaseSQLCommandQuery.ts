export interface DatabaseSQLCommandQuery {
  id: string;
  name: string;
  databaseName: string;
  cmdQuery: string;
  executeImmediately: boolean;
}
