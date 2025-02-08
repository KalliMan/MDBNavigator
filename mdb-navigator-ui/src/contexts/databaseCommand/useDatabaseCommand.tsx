import { createContext, useContext } from "react";
import { DatabaseCommandContextType } from "./DatabaseCommandReducer";
import agent from "../../services/apiAgent";
import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import { DatabaseCommandActionTypes } from "./DatabaseCommandActionType";
import { DatabaseCommandResult } from "../../models/databaseCommand/result/databaseCommandResult";
import { DatabaseCommandBatchResult } from "../../models/databaseCommand/result/databaseCommandBatchResult";

export const DatabaseCommandContext = createContext<DatabaseCommandContextType | null>(null);

export default function useDatabaseCommandContext(){
  const context = useContext(DatabaseCommandContext);
  if (!context) {
    throw new Error('useDatabaseCommandContext must be used within a DatabaseCommandContextProvider');
  }

  async function executeDatabaseSQLCommand(cmdQuery: DatabaseSQLCommandQuery) {
    context!.dispatch({
      type: DatabaseCommandActionTypes.Executing,
      payload: cmdQuery.id
    });

    const result = await agent.databaseCommandApi.execute(cmdQuery);

    context!.dispatch({
      type: DatabaseCommandActionTypes.ResultReceived,
      payload: result
    });
  }

  async function getTopNTableRecords(id: string, databaseName: string, schema: string, table: string, recordsNumber: number) {
    context!.dispatch({
      type: DatabaseCommandActionTypes.Executing,
      payload: id
    });

    const result = await agent.databaseCommandApi.getTopNTableRecords(id, databaseName, schema, table, recordsNumber);

    context!.dispatch({
      type: DatabaseCommandActionTypes.ResultReceived,
      payload: result
    });
  }

  function getDatabaseCommandResult(id: string): DatabaseCommandResult | undefined {
    return context!.state.databaseCommandResults.find(r => r.id === id);
  }

  function getDatabaseCommandBatchResults(id: string): DatabaseCommandBatchResult[] | undefined {
    return context!.state.databaseCommandBatchResults.filter(r => r.id === id);
  }

  function onBatchCommandResult(result: DatabaseCommandBatchResult): void {
    context!.dispatch({
      type: DatabaseCommandActionTypes.BatchResultReceived,
      payload: result
    });
  }

  const {isExecuting, executingCommandId, databaseCommandQueries, databaseCommandResults, databaseCommandBatchResults } = context.state;

  return { isExecuting,
    executingCommandId,
    databaseCommandQueries,
    databaseCommandResults,
    databaseCommandBatchResults,
    executeDatabaseSQLCommand,
    getTopNTableRecords,
    getDatabaseCommandResult,
    getDatabaseCommandBatchResults,
    onBatchCommandResult};
}