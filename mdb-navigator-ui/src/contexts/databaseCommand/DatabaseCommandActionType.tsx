import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import { CommandFinishedResult } from "../../models/databaseCommand/result/commandFinishedResult";
import { HubStatus } from "../../services/commandResultHub";
import { DatabaseCommandBatchResult } from "../../models/databaseCommand/result/databaseCommandBatchResult";

export enum DatabaseCommandActionTypes {
  Executing = 'command/executing',
  Queried = 'command/queried',
  RowsAppended = 'command/rowsAppended',
  CommandFinished = 'command/finished',
  CommandRemoved = 'command/removed',
  HubStatusChanged = 'command/hubStatusChanged',
  Error = 'command/error'
}

export type ExecutingAction = {
  type: DatabaseCommandActionTypes.Executing;
  payload: { commandId: string; executionId: string };
};

export type CommandQueriedAction = {
  type: DatabaseCommandActionTypes.Queried;
  payload: DatabaseSQLCommandQuery;
}

// A group of batches (possibly of several commands), collected by batchBuffer.
export type RowsAppendedAction = {
  type: DatabaseCommandActionTypes.RowsAppended;
  payload: DatabaseCommandBatchResult[];
}

export type CommandFinishedAction = {
  type: DatabaseCommandActionTypes.CommandFinished;
  payload: CommandFinishedResult;
}

export type CommandRemovedAction = {
  type: DatabaseCommandActionTypes.CommandRemoved;
  payload: string;
}

export type HubStatusChangedAction = {
  type: DatabaseCommandActionTypes.HubStatusChanged;
  payload: HubStatus;
}

export type ErrorAction = {
  type: DatabaseCommandActionTypes.Error;
  payload: { commandId: string; message: string };
};

export type DatabaseCommandActions = ExecutingAction
| CommandQueriedAction
| RowsAppendedAction
| CommandFinishedAction
| CommandRemovedAction
| HubStatusChangedAction
| ErrorAction;
