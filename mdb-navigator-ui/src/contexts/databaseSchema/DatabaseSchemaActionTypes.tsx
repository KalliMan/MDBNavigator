import { DatabasesDetails } from "../../models/schema/databasesDetails";
import { TablesDetails } from "../../models/schema/tablesDetails";

export enum DatabaseSchemaActionTypes {
  Loading = 'schema/loading',
  FetchedDatabases = 'schema/fetchedDatabases',
  FetchedTables = 'schema/fetchedTables',
  Error = 'schema/error'
}

export type LoadingAction = {
  type: DatabaseSchemaActionTypes.Loading;
};

export type FetchedDatabasesAction = {
  type: DatabaseSchemaActionTypes.FetchedDatabases;
  payload: DatabasesDetails;
};

export type FetchedTablesAction = {
  type: DatabaseSchemaActionTypes.FetchedTables;
  payload: TablesDetails;
};

export type ErrorActionAction = {
  type: DatabaseSchemaActionTypes.Error;
  payload: string;
};

export type DatabaseSchemaActions = LoadingAction
  | FetchedDatabasesAction
  | FetchedTablesAction
  | ErrorActionAction;