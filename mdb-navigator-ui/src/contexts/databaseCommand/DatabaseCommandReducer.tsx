import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import { DatabaseCommandActions, DatabaseCommandActionTypes } from "./DatabaseCommandActionType";
import { CommandExecutionStatus } from "../../models/databaseCommand/result/commandFinishedResult";
import { ResultSet } from "../../models/databaseCommand/result/resultSet";
import { HubStatus } from "../../services/commandResultHub";
import type { BatchBuffer, ParsedBatch } from "./batchBuffer";

export type DatabaseCommandStats = {
  rowCount: number;
  recordsAffected: number;
  elapsedMs: number;
  truncated: boolean;
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
  resultSets: ResultSet[];
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
  batchBuffer: BatchBuffer,
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
    resultSets: []
  };
}

function isCurrentExecution(command: DatabaseCommand, executionId: string) {
  return command.executionId !== null && command.executionId === executionId;
}

// Appends the rows of several batches with a single copy per result set.
function appendBatches(resultSets: ResultSet[], batches: ParsedBatch[]): ResultSet[] {
  const next = [...resultSets];
  const pendingRows = new Map<number, unknown[][][]>();

  for (const batch of batches) {
    let index = next.findIndex(rs => rs.resultSetIndex === batch.resultSetIndex);
    if (index === -1) {
      next.push({
        id: batch.id,
        resultSetIndex: batch.resultSetIndex,
        fields: batch.fields ?? [],
        rows: [],
        isComplete: false
      });
      index = next.length - 1;
    }

    const chunks = pendingRows.get(index) ?? [];
    chunks.push(batch.rows);
    pendingRows.set(index, chunks);

    if (batch.isLastBatch) {
      next[index] = { ...next[index], isComplete: true };
    }
  }

  pendingRows.forEach((chunks, index) => {
    next[index] = { ...next[index], rows: next[index].rows.concat(...chunks) };
  });

  return next;
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
        resultSets: [],
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
              ? { ...c, query, resultSets: [], error: null }
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

    case DatabaseCommandActionTypes.RowsAppended: {
      const batches = action.payload;
      return {
        ...state,
        commands: state.commands.map(c => {
          const own = batches.filter(b => isCurrentExecution(c, b.executionId));
          // isExecuting stays true until CommandFinished arrives.
          return own.length > 0 ? { ...c, resultSets: appendBatches(c.resultSets, own) } : c;
        })
      };
    }

    case DatabaseCommandActionTypes.CommandFinished: {
      const finished = action.payload;
      return {
        ...state,
        commands: state.commands.map(c =>
          isCurrentExecution(c, finished.executionId)
            ? {
                ...c,
                isExecuting: false,
                status: finished.status,
                error: finished.status === 'Failed' ? finished.error ?? 'Query execution failed' : null,
                stats: {
                  rowCount: finished.rowCount,
                  recordsAffected: finished.recordsAffected,
                  elapsedMs: finished.elapsedMs,
                  truncated: finished.truncated
                }
              }
            : c
        )
      };
    }

    case DatabaseCommandActionTypes.CommandRemoved: {
      const commandId = action.payload;
      return {
        ...state,
        commands: state.commands.filter(c => c.id !== commandId)
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
      return state;
  }
}
