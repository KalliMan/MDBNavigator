import { DatabaseSingleCommandResult } from "../../models/databaseCommand/result/databaseSingleCommandResult";
import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import { DatabaseCommandBatchResult } from "../../models/databaseCommand/result/databaseCommandBatchResult";
import { DatabaseCommandResult } from "../../models/databaseCommand/result/databaseCommandResult";

export enum DatabaseCommandActionTypes {
  Executing = 'command/executing',
  Queried = 'command/queried',
  ResultReceived = 'command/resultReceived',
  SingleResultReceived = 'command/singleResultReceived',
  BatchResultReceived = 'command/batchResultReceived',
  Error = 'command/error'
}

export type ExecutingAction = {
  type: DatabaseCommandActionTypes.Executing;
  payload: string;
};

export type CommandQueriedAction = {
  type: DatabaseCommandActionTypes.Queried;
  payload: DatabaseSQLCommandQuery;
}


export type CommandResultReceivedAction = {
  type: DatabaseCommandActionTypes.ResultReceived;
  payload: DatabaseCommandResult;
}

export type CommandSingleResultReceivedAction = {
  type: DatabaseCommandActionTypes.SingleResultReceived;
  payload: DatabaseSingleCommandResult;
}

export type CommandBatchResultReceivedAction = {
  type: DatabaseCommandActionTypes.BatchResultReceived;
  payload: DatabaseCommandBatchResult;
}

export type ErrorAction = {
  type: DatabaseCommandActionTypes.Error;
  payload: string;
};

export type DatabaseCommandActions = ExecutingAction
| CommandQueriedAction
| CommandResultReceivedAction
| CommandSingleResultReceivedAction
| CommandBatchResultReceivedAction
| ErrorAction;