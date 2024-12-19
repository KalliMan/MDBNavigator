import { ConnectionSettings } from "../models/connect/connectionSettings";
import { DatabasesDetails } from "../models/schema/databasesDetails";
import { TablesDetails } from "../models/schema/tablesDetails";

export enum DatabaseActionTypes {
  Loading = 'loading',
  DatabaseConnected = 'database/connected',
  FetchedDatabases = 'database/fetchedDatabases',
  FetchedTables = 'database/fetchedtables',
  Execute = 'database/execute',
  Error = 'error'
}

export type LoadingAction = {
  type: DatabaseActionTypes.Loading;
};

export type DatabaseConnected = {
  type: DatabaseActionTypes.DatabaseConnected;
  payload: ConnectionSettings;
};

export type FetchedDatabases = {
  type: DatabaseActionTypes.FetchedDatabases;
  payload: DatabasesDetails;
};

export type FetchedTables = {
  type: DatabaseActionTypes.FetchedTables;
  payload: TablesDetails;
};

export type ExecuiteAction = {
  type: DatabaseActionTypes.Execute;
  payload: string;
};

export type ErrorAction = {
  type: DatabaseActionTypes.Error;
  payload: string;
};


export type DatabaseActions =
  LoadingAction
  | DatabaseConnected
  | FetchedDatabases
  | FetchedTables
  | ExecuiteAction
  | ErrorAction;

