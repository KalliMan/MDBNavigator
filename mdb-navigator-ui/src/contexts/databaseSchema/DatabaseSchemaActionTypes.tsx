import { DatabasesDetails } from "../../models/schema/database/databasesDetails";
import { ProceduresDetails } from "../../models/schema/procedure/proceduresDetails";
import TableDefinitionDetails from "../../models/schema/table/tableDefinitionDetails";
import { TablesDetails } from "../../models/schema/table/tablesDetails";
import { ViewDetails } from "../../models/schema/view/viewsDetails";
import { DatabaseSchema } from "./DatabaseSchemaReducer";

export enum DatabaseSchemaErrorScope {
  Databases = "databases",
  Tables = "tables",
  TableDefinition = "tableDefinition",
  Procedures = "procedures",
  Functions = "functions",
  Views = "views",
}

export enum DatabaseSchemaActionTypes {
  Loading = 'schema/loading',
  AddedSchema = 'schema/addedSchema',
  FetchedDatabases = 'schema/fetchedDatabases',

  FetchedTables = 'schema/fetchedTables',
  FetchedTableDefinition = 'schema/fetchedTableDefinition',

  FetchedStoredProcedures = 'schema/fetchedStoredProcedures',
  FetchedFunctions = 'schema/fetchedFunctions',
  FetchedViews = 'schema/fetchedViews',
  ResetTables = 'schema/resetTables',
  ResetStoredProcedures = 'schema/resetStoredProcedures',
  ResetFunctions = 'schema/resetFunctions',
  ResetViews = 'schema/resetViews',
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

export type FetchedTableDefinitionAction = {
  type: DatabaseSchemaActionTypes.FetchedTableDefinition;
  payload: TableDefinitionDetails;
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

export type ResetTablesAction = {
  type: DatabaseSchemaActionTypes.ResetTables;
  payload: {
    connectionId: string;
    databaseName: string;
  };
};

export type ResetStoredProceduresAction = {
  type: DatabaseSchemaActionTypes.ResetStoredProcedures;
  payload: {
    connectionId: string;
    databaseName: string;
  };
};

export type ResetFunctionsAction = {
  type: DatabaseSchemaActionTypes.ResetFunctions;
  payload: {
    connectionId: string;
    databaseName: string;
  };
};

export type ResetViewsAction = {
  type: DatabaseSchemaActionTypes.ResetViews;
  payload: {
    connectionId: string;
    databaseName: string;
  };
};

export type ErrorDatabaseSchemaActionAction = {
  type: DatabaseSchemaActionTypes.Error;
  payload: {
    message: string;
    connectionId?: string;
    databaseName?: string;
    tableName?: string;
    databaseSchema?: string;
    scope?: DatabaseSchemaErrorScope;
  };
};

export type DatabaseSchemaActions = LoadingAction
  | AddedSchemaAction
  | FetchedDatabasesAction

  | FetchedTablesAction
  | FetchedTableDefinitionAction

  | FetchedStoredProceduresAction
  | FetchedFunctionsAction
  | FetchedViewsAction
  | ResetTablesAction
  | ResetStoredProceduresAction
  | ResetFunctionsAction
  | ResetViewsAction
  | ErrorDatabaseSchemaActionAction;