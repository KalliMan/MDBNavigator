import { createContext, useContext } from "react";
import { DatabaseCommandContextType } from "./DatabaseCommandReducer";
import { v4 as uuidv4 } from 'uuid';
import agent from "../../services/apiAgent";
import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import { DatabaseCommandActionTypes } from "./DatabaseCommandActionType";
import { DatabaseCommandResult } from "../../models/databaseCommand/databaseCommandResult";

export const DatabaseCommandContext = createContext<DatabaseCommandContextType | null>(null);

export default function useDatabaseCommandContext(){
  const context = useContext(DatabaseCommandContext);
  if (!context) {
    throw new Error('useDatabaseCommandContext must be used within a DatabaseCommandContextProvider');
  }

  async function queryCommandGetTopNTableRecords(databaseName: string, schema: string, table: string, recordsNumber: number) {

    const id = uuidv4();
    const topNRecordsQuery = await agent.databaseCommandApi.getTopNTableRecordsScript(id, databaseName, schema, table, recordsNumber);

    const query: DatabaseSQLCommandQuery = {
      id,
      databaseName,
      cmdQuery: topNRecordsQuery,
      executeImmediately: true
    };

    context!.dispatch({
      type: DatabaseCommandActionTypes.Queried,
      payload: query
    });
  }

  async function executeDatabaseSQLCommand(cmdQuery: DatabaseSQLCommandQuery) {
    context!.dispatch({
      type: DatabaseCommandActionTypes.Executing,
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
    });

    const result = await agent.databaseCommandApi.getTopNTableRecords(id, databaseName, schema, table, recordsNumber);

    context!.dispatch({
      type: DatabaseCommandActionTypes.ResultReceived,
      payload: result
    });
  }

  function getDatabaseCommantResult(id: string): DatabaseCommandResult | undefined{
    return context!.state.databaseCommandResults.find(r => r.id === id);
  }

  const {databaseCommandQueries, databaseCommandResults } = context.state;

  return { databaseCommandQueries,
    databaseCommandResults,
    queryCommandGetTopNTableRecords,
    executeDatabaseSQLCommand,
    getTopNTableRecords,
    getDatabaseCommantResult};
}