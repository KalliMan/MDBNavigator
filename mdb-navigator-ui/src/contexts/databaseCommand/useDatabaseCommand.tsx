import { createContext, useContext } from "react";
import { DatabaseCommandContextType } from "./DatabaseCommandReducer";
import agent from "../../services/apiAgent";
import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import { DatabaseCommandActionTypes } from "./DatabaseCommandActionType";
import { DatabaseCommandBatchResult } from "../../models/databaseCommand/result/databaseCommandBatchResult";
import { AxiosError } from "axios";

export const DatabaseCommandContext = createContext<DatabaseCommandContextType | null>(null);

export default function useDatabaseCommandContext(){
  const context = useContext(DatabaseCommandContext);
  if (!context) {
    throw new Error('useDatabaseCommandContext must be used within a DatabaseCommandContextProvider');
  }

  async function executeDatabaseSingleSQLCommand(cmdQuery: DatabaseSQLCommandQuery) {
    context!.dispatch({
      type: DatabaseCommandActionTypes.Executing,
      payload: cmdQuery.id
    });

    try {
      const result = await agent.databaseCommandApi.executeSingle(cmdQuery);

      context!.dispatch({
        type: DatabaseCommandActionTypes.SingleResultReceived,
        payload: result
      });
    } catch (error) {
      context!.dispatch({
        type: DatabaseCommandActionTypes.Error,
        payload: error instanceof AxiosError ? error.response?.data?.message ?? error.message : 'Unknown error occurred'
      });
    }
  }

    async function executeDatabaseSQLCommand(cmdQuery: DatabaseSQLCommandQuery) {
    context!.dispatch({
      type: DatabaseCommandActionTypes.Executing,
      payload: cmdQuery.id
    });

    try {
      const result = await agent.databaseCommandApi.execute(cmdQuery);

      context!.dispatch({
        type: DatabaseCommandActionTypes.ResultReceived,
        payload: result
      });
    } catch (error) {
      context!.dispatch({
        type: DatabaseCommandActionTypes.Error,
        payload: error instanceof AxiosError ? error.response?.data?.message ?? error.message : 'Unknown error occurred'
      });
    }
  }

  async function getTopNTableRecords(connectionId: string, id: string, databaseName: string, schema: string, table: string, recordsNumber: number) {
    context!.dispatch({
      type: DatabaseCommandActionTypes.Executing,
      payload: id
    });

    try {
      const result = await agent.databaseCommandApi.getTopNTableRecords(connectionId, id, databaseName, schema, table, recordsNumber);

      context!.dispatch({
        type: DatabaseCommandActionTypes.SingleResultReceived,
        payload: result
      });
    } catch (error) {
      context!.dispatch({
        type: DatabaseCommandActionTypes.Error,
        payload: error instanceof AxiosError ? error.response?.data?.message ?? error.message : 'Unknown error occurred'
      });
    }
  }

  function onBatchCommandResult(result: DatabaseCommandBatchResult): void {
    context!.dispatch({
      type: DatabaseCommandActionTypes.BatchResultReceived,
      payload: result
    });
  }

  return {
    commands: context.state.commands,
    executeDatabaseSingleSQLCommand,
    executeDatabaseSQLCommand,
    getTopNTableRecords,
    onBatchCommandResult,
  };
}