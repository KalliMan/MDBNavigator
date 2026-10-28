import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import { DatabaseCommandBatchResult } from "../../models/databaseCommand/result/databaseCommandBatchResult";
import { CommandFinishedResult } from "../../models/databaseCommand/result/commandFinishedResult";
import { HubStatus } from "../../services/commandResultHub";

export enum DatabaseCommandActionTypes {
  Executing = 'command/executing',
  Queried = 'command/queried',
  StreamResultStarted = 'command/streamResultStarted',
  BatchResultReceived = 'command/batchResultReceived',
  CommandFinished = 'command/finished',
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


export type CommandBatchResultReceivedAction = {
  type: DatabaseCommandActionTypes.BatchResultReceived;
  payload: DatabaseCommandBatchResult;
}

export type CommandStreamResultStartedAction = {
  type: DatabaseCommandActionTypes.StreamResultStarted;
  payload: DatabaseCommandBatchResult;
}

export type CommandFinishedAction = {
  type: DatabaseCommandActionTypes.CommandFinished;
  payload: CommandFinishedResult;
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
| CommandStreamResultStartedAction
| CommandBatchResultReceivedAction
| CommandFinishedAction
| HubStatusChangedAction
| ErrorAction;
