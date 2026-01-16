import { DatabasesDetails } from "../../models/schema/databasesDetails";
import { ProceduresDetails } from "../../models/schema/proceduresDetails";
import { TablesDetails } from "../../models/schema/tablesDetails";
import { ViewDetails } from "../../models/schema/viewsDetails";
import { DatabaseSchema } from "./DatabaseSchemaReducer";

export enum RefreshFlagType {
  RefreshDatabases = 'refreshDatabases',
  RefreshTables = 'refreshTables',
  RefreshStoredProcedures = 'refreshStoredProcedures',
  RefreshFunctions = 'refreshFunctions',
  RefreshViews = 'refreshViews'
}

export enum DatabaseSchemaActionTypes {
  Loading = 'schema/loading',
  AddedSchema = 'schema/addedSchema',
  FetchedDatabases = 'schema/fetchedDatabases',
  FetchedTables = 'schema/fetchedTables',
  FetchedStoredProcedures = 'schema/fetchedStoredProcedures',
  FetchedFunctions = 'schema/fetchedFunctions',
  FetchedViews = 'schema/fetchedViews',
  ClearRefreshFlags = 'schema/clearRefreshFlags',
  Error = 'schema/error'
}

export type LoadingAction = {
  type: DatabaseSchemaActionTypes.Loading;
};

export type AddedSchemaAction = {
  type: DatabaseSchemaActionTypes.AddedSchema;
  payload: DatabaseSchema;
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

export type FetchedViewsAction = {
  type: DatabaseSchemaActionTypes.FetchedViews;
  payload: ViewDetails;
};

export type ErrorDatabaseSchemaActionAction = {
  type: DatabaseSchemaActionTypes.Error;
  payload: string;
};

export type ClearRefreshFlagsAction = {
  type: DatabaseSchemaActionTypes.ClearRefreshFlags;
  payload: {
    connectionId: string;
    flags: RefreshFlagType[];
  };
};

export type DatabaseSchemaActions = LoadingAction
  | AddedSchemaAction
  | FetchedDatabasesAction
  | FetchedTablesAction
  | FetchedStoredProceduresAction
  | FetchedFunctionsAction
  | FetchedViewsAction
  | ClearRefreshFlagsAction
  | ErrorDatabaseSchemaActionAction;