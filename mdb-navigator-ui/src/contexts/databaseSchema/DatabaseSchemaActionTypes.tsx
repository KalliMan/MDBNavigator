import { DatabasesDetails } from "../../models/schema/databasesDetails";
import { ProceduresDetails } from "../../models/schema/procedureDetails";
import { TablesDetails } from "../../models/schema/tablesDetails";

export enum DatabaseSchemaActionTypes {
  Loading = 'schema/loading',
  FetchedDatabases = 'schema/fetchedDatabases',
  FetchedTables = 'schema/fetchedTables',
  FetchedStoredProcedures = 'schema/fetchedStoredProcedures',
  FetchedFunctions = 'schema/fetchedFunctions',
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

export type FetchedStoredProceduresAction = {
  type: DatabaseSchemaActionTypes.FetchedStoredProcedures;
  payload: ProceduresDetails;
};

export type FetchedFunctionsAction = {
  type: DatabaseSchemaActionTypes.FetchedFunctions;
  payload: ProceduresDetails;
};

export type ErrorDatabaseSchemaActionAction = {
  type: DatabaseSchemaActionTypes.Error;
  payload: string;
};

export type DatabaseSchemaActions = LoadingAction
  | FetchedDatabasesAction
  | FetchedTablesAction
  | FetchedStoredProceduresAction
  | FetchedFunctionsAction
  | ErrorDatabaseSchemaActionAction;