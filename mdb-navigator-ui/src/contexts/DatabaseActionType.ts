import { ConnectionSettings } from "../models/connect/connectionSettings";
import { DatabaseCommantResult } from "../models/databaseCommand/databaseCommandResult";
import { DatabaseCommandQueryBase } from "../models/databaseCommand/query/databaseCommandQueryBase";
import { DatabasesDetails } from "../models/schema/databasesDetails";
import { TablesDetails } from "../models/schema/tablesDetails";

export enum DatabaseActionTypes {
  Loading = 'loading',
  DatabaseConnected = 'database/connected',
  FetchedDatabases = 'schema/fetchedDatabases',
  FetchedTables = 'schema/fetchedTables',

//  NewDatabaseCommand = 'command/new',
  CommandQueried = 'command/queried',
  CommandResultReceived = 'command/ResultReceived',

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


// export type NewDatabaseCommand = {
//   type: DatabaseActionTypes.NewDatabaseCommand;
//   payload: string
// }

export type CommandQueried = {
  type: DatabaseActionTypes.CommandQueried;
  payload: DatabaseCommandQueryBase;
}

export type CommandResultReceived = {
  type: DatabaseActionTypes.CommandResultReceived;
  payload: DatabaseCommantResult;
}

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

  | CommandQueried
  | CommandResultReceived
  | ExecuiteAction

  | ErrorAction

