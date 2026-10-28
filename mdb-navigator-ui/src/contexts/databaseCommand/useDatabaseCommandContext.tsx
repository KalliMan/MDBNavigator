import { createContext, useContext } from "react";
import { v4 as uuidv4 } from 'uuid';
import { DatabaseCommandContextType } from "./DatabaseCommandReducer";
import agent from "../../services/apiAgent";
import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import { DatabaseCommandActionTypes } from "./DatabaseCommandActionType";
import { DatabaseCommandBatchResult } from "../../models/databaseCommand/result/databaseCommandBatchResult";
import { CommandFinishedResult } from "../../models/databaseCommand/result/commandFinishedResult";
import { HubStatus, waitUntilConnected } from "../../services/commandResultHub";
import { AxiosError } from "axios";

export const DatabaseCommandContext = createContext<DatabaseCommandContextType | null>(null);

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? error.message;
  }
  return error instanceof Error ? error.message : 'Unknown error occurred';
}

export default function useDatabaseCommandContext(){
  const context = useContext(DatabaseCommandContext);
  if (!context) {
    throw new Error('useDatabaseCommandContext must be used within a DatabaseCommandContextProvider');
  }

  async function executeDatabaseSQLCommand(cmdQuery: DatabaseSQLCommandQuery) {
    const executionId = uuidv4();
    context!.dispatch({
      type: DatabaseCommandActionTypes.Executing,
      payload: { commandId: cmdQuery.id, executionId }
    });

    try {
      // Results arrive only via SignalR, so the hub must be connected before the server starts streaming.
      await waitUntilConnected();
      await agent.databaseCommandApi.execute({ ...cmdQuery, executionId });
      // data arrives via SignalR BatchCommandResult, the run ends with CommandFinished
    } catch (error) {
      context!.dispatch({
        type: DatabaseCommandActionTypes.Error,
        payload: { commandId: cmdQuery.id, message: getErrorMessage(error) }
      });
    }
  }

  async function cancelDatabaseSQLCommand(commandId: string) {
    try {
      // The outcome is reported by the CommandFinished message (status Cancelled).
      await agent.databaseCommandApi.cancel(commandId);
    } catch {
      // Errors are already shown by the api agent interceptor.
    }
  }

  // Drops the command and its rows (e.g. when its tab is closed); a running query is cancelled first.
  function removeDatabaseSQLCommand(commandId: string) {
    const command = context!.state.commands.find(c => c.id === commandId);
    if (command?.isExecuting) {
      cancelDatabaseSQLCommand(commandId);
    }
    context!.dispatch({
      type: DatabaseCommandActionTypes.CommandRemoved,
      payload: commandId
    });
  }

  function onBatchCommandResult(result: DatabaseCommandBatchResult): void {
    context!.batchBuffer.push(result);
  }

  function onCommandFinished(result: CommandFinishedResult): void {
    // Rows still waiting in the buffer must be applied before the run is marked finished.
    context!.batchBuffer.flush();
    context!.dispatch({
      type: DatabaseCommandActionTypes.CommandFinished,
      payload: result
    });
  }

  function onHubStatusChanged(status: HubStatus): void {
    context!.dispatch({
      type: DatabaseCommandActionTypes.HubStatusChanged,
      payload: status
    });
  }

  return {
    commands: context.state.commands,
    hubStatus: context.state.hubStatus,
    executeDatabaseSQLCommand,
    cancelDatabaseSQLCommand,
    removeDatabaseSQLCommand,
    onBatchCommandResult,
    onCommandFinished,
    onHubStatusChanged,
  };
}
