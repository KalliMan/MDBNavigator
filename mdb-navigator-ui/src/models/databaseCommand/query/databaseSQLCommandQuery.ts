export interface DatabaseSQLCommandQuery {
  id: string;
  databaseName: string;
  cmdQuery: string;
  executeImmediately: boolean;
}
