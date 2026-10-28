import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import { DatabaseCommandActions, DatabaseCommandActionTypes } from "./DatabaseCommandActionType";
import { DatabaseCommandBatchResult } from "../../models/databaseCommand/result/databaseCommandBatchResult";
import { DatabaseCommandResult } from "../../models/databaseCommand/result/databaseCommandResult";
import { DatabaseSingleCommandResult } from "../../models/databaseCommand/result/databaseSingleCommandResult";
import { CommandExecutionStatus } from "../../models/databaseCommand/result/commandFinishedResult";
import { HubStatus } from "../../services/commandResultHub";

export type DatabaseCommandStats = {
  rowCount: number;
  recordsAffected: number;
  elapsedMs: number;
}

export type DatabaseCommand = {
  id: string;
  isExecuting: boolean;
  error: string | null;
  // Identifies the current streamed run; messages of older runs are ignored.
  executionId: string | null;
  status: CommandExecutionStatus | null;
  stats: DatabaseCommandStats | null;

  query: DatabaseSQLCommandQuery | null;
  result: DatabaseCommandResult | null;
  batchResults: DatabaseCommandBatchResult[];
}

export type DatabaseCommandState = {
  commands: DatabaseCommand[];
  hubStatus: HubStatus;
}

export const initialDatabaseCommandState: DatabaseCommandState = {
  commands: [],
  hubStatus: 'disconnected',
};

export type DatabaseCommandContextType = {
  state: DatabaseCommandState,
  dispatch: React.Dispatch<DatabaseCommandActions>,
}

const CONNECTION_LOST_MESSAGE = 'Connection to server lost during execution';

function createCommand(id: string): DatabaseCommand {
  return {
    id,
    isExecuting: false,
    error: null,
    executionId: null,
    status: null,
    stats: null,
    query: null,
    result: null,
    batchResults: []
  };
}

function isCurrentExecution(command: DatabaseCommand, executionId: string) {
  return command.executionId !== null && command.executionId === executionId;
}

export function databaseCommandReducer(state: DatabaseCommandState, action: DatabaseCommandActions): DatabaseCommandState {
  switch(action.type) {
    case DatabaseCommandActionTypes.Executing: {
      const { commandId, executionId } = action.payload;
      const running: Partial<DatabaseCommand> = {
        isExecuting: true,
        executionId,
        status: null,
        stats: null,
        result: null,
        batchResults: [],
        error: null
      };
      const existingCommand = state.commands.find(c => c.id === commandId);

      if (existingCommand) {
        return {
          ...state,
          commands: state.commands.map(c =>
            c.id === commandId ? { ...c, ...running } : c
          )
        };
      } else {
        return {
          ...state,
          commands: [...state.commands, { ...createCommand(commandId), ...running }]
        };
      }
    }

    case DatabaseCommandActionTypes.Queried: {
      const query = action.payload;
      const existingCommand = state.commands.find(c => c.id === query.id);

      if (existingCommand) {
        return {
          ...state,
          commands: state.commands.map(c =>
            c.id === query.id
              ? { ...c, query, result: null, batchResults: [], error: null }
              : c
          )
        };
      } else {
        return {
          ...state,
          commands: [...state.commands, { ...createCommand(query.id), query }]
        };
      }
    }

    case DatabaseCommandActionTypes.StreamResultStarted: {
      const batch = action.payload;
      const singleResult: DatabaseSingleCommandResult = {
        id: batch.id,
        recordsAffected: 0,
        rowCount: 0,
        fields: batch.fields ?? [],
        resultJson: batch.resultJson
      };
      return {
        ...state,
        commands: state.commands.map(c => {
          if (c.id !== batch.commandId || !isCurrentExecution(c, batch.executionId)) return c;
          const existing = c.result;
          // isExecuting stays true until CommandFinished arrives.
          return {
            ...c,
            result: existing
              ? { ...existing, results: [...existing.results, singleResult] }
              : { id: batch.commandId, results: [singleResult] }
          };
        })
      };
    }

    case DatabaseCommandActionTypes.BatchResultReceived: {
      const batchResult = action.payload;
      return {
        ...state,
        commands: state.commands.map(c =>
          c.id === batchResult.commandId && isCurrentExecution(c, batchResult.executionId)
            ? { ...c, batchResults: [...c.batchResults, batchResult] }
            : c
        )
      };
    }

    case DatabaseCommandActionTypes.CommandFinished: {
      const finished = action.payload;
      return {
        ...state,
        commands: state.commands.map(c =>
          c.id === finished.commandId && isCurrentExecution(c, finished.executionId)
            ? {
                ...c,
                isExecuting: false,
                status: finished.status,
                error: finished.status === 'Failed' ? finished.error ?? 'Query execution failed' : null,
                stats: {
                  rowCount: finished.rowCount,
                  recordsAffected: finished.recordsAffected,
                  elapsedMs: finished.elapsedMs
                }
              }
            : c
        )
      };
    }

    case DatabaseCommandActionTypes.HubStatusChanged: {
      const hubStatus = action.payload;
      const connectionLost = hubStatus === 'reconnecting' || hubStatus === 'disconnected';

      return {
        hubStatus,
        // Batches sent while the hub is down are lost, so running streamed executions cannot complete.
        commands: connectionLost
          ? state.commands.map(c =>
              c.isExecuting && c.executionId !== null
                ? { ...c, isExecuting: false, status: 'Failed', error: CONNECTION_LOST_MESSAGE }
                : c
            )
          : state.commands
      };
    }

    case DatabaseCommandActionTypes.Error: {
      const { commandId, message } = action.payload;
      return {
        ...state,
        commands: state.commands.map(c =>
          c.id === commandId
            ? { ...c, isExecuting: false, status: 'Failed', error: message }
            : c
        )
      };
    }

    default:
      console.log("Unsupported Action type");
      return state;
  }
}
