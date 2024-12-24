import { DatabaseCommandResult } from "../../models/databaseCommand/databaseCommandResult";
import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";

export enum DatabaseCommandActionTypes {
  Executing = 'command/executing',
  Queried = 'command/queried',
  ResultReceived = 'command/ResultReceived',
  Error = 'command/error'
}

export type ExecutingAction = {
  type: DatabaseCommandActionTypes.Executing;
};

export type CommandQueriedAction = {
  type: DatabaseCommandActionTypes.Queried;
  payload: DatabaseSQLCommandQuery;
}

export type CommandResultReceivedAction = {
  type: DatabaseCommandActionTypes.ResultReceived;
  payload: DatabaseCommandResult;
}

export type ErrorAction = {
  type: DatabaseCommandActionTypes.Error;
  payload: string;
};

export type DatabaseCommandActions = ExecutingAction
| CommandQueriedAction
| CommandResultReceivedAction
| ErrorAction;