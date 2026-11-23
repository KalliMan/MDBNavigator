import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import { CommandFinishedResult } from "../../models/databaseCommand/result/commandFinishedResult";
import { HubStatus } from "../../services/commandResultHub";
import { DatabaseCommandBatchResult } from "../../models/databaseCommand/result/databaseCommandBatchResult";
import { StatementStartedResult } from "../../models/databaseCommand/result/statementStartedResult";
import type { RanOn } from "./DatabaseCommandReducer";
import type { PlanMode } from "../../models/databaseCommand/query/planMode";

export enum DatabaseCommandActionTypes {
  Executing = 'command/executing',
  Queried = 'command/queried',
  RowsAppended = 'command/rowsAppended',
  StatementStarted = 'command/statementStarted',
  CommandFinished = 'command/finished',
  CommandRemoved = 'command/removed',
  HubStatusChanged = 'command/hubStatusChanged',
  Error = 'command/error'
}

export type ExecutingAction = {
  type: DatabaseCommandActionTypes.Executing;
  // ranOn: where this run goes. The tab's target can change afterwards (1.2d), so the run keeps its own copy.
  // plan: the run asks for the plan of one statement instead of running the script; null for a normal run.
  payload: { commandId: string; executionId: string; ranOn: RanOn; plan: PlanMode | null };
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

// The latest StatementStarted message of a run, collected by batchBuffer.
export type StatementStartedAction = {
  type: DatabaseCommandActionTypes.StatementStarted;
  payload: StatementStartedResult;
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
| StatementStartedAction
| CommandFinishedAction
| CommandRemovedAction
| HubStatusChangedAction
| ErrorAction;
