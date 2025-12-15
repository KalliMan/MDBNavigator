import { createContext, useContext } from "react";
import { CommandQueryContextType } from "./CommandQueryReducer";
import { v4 as uuidv4 } from 'uuid';
import agent from "../../services/apiAgent";
import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import { CommandQueryActionTypes } from "./CommandQueryActionType";

export const CommandQueryContext = createContext<CommandQueryContextType | null>(null);

export default function useCommandQueryContext(){
  const context = useContext(CommandQueryContext);
  if (!context) {
    throw new Error('useCommandQueryContext must be used within a CommandQueryContext');
  }

  async function queryCommandGetTopNTableRecords(databaseName: string, schema: string, table: string, recordsNumber: number) {

    const id = uuidv4();
    const topNRecordsQuery = await agent.databaseCommandApi.getTopNTableRecordsScript(id, databaseName, schema, table, recordsNumber);

    const query: DatabaseSQLCommandQuery = {
      id,
      databaseName,
      name: `${schema}.${table}`,
      cmdQuery: topNRecordsQuery,
      executeImmediately: true
    };

    context!.dispatch({
      type: CommandQueryActionTypes.Queried,
      payload: query
    });
  }

  async function queryForDatabase(databaseName: string, schema: string) {
    const id = uuidv4();

    const query: DatabaseSQLCommandQuery = {
      id,
      databaseName,
      name: `${schema}.*`,
      cmdQuery: `SELECT * FROM ${schema || '{Schema}'}.{TableName}`,
      executeImmediately: false
    };

    context!.dispatch({
      type: CommandQueryActionTypes.Queried,
      payload: query
    });
  }

  async function queryCommandProcedureDefinition(databaseName: string, schema: string, name: string) {
    const procedureCodeQuery = await agent.databaseCommandApi.getProcedureDefinition(databaseName, schema, name);

    const id = uuidv4();
    const query: DatabaseSQLCommandQuery = {
      id,
      databaseName,
      name: `${schema}.${name}`,
      cmdQuery: procedureCodeQuery,
      executeImmediately: false
    };

    context!.dispatch({
      type: CommandQueryActionTypes.Queried,
      payload: query
    });
  }

  async function queryCommandCreateTableScript(databaseName: string) {
    const createTableQuery = await agent.databaseCommandApi.getCreateTableScript(databaseName, '[schema]');

    const query: DatabaseSQLCommandQuery = {
      id: uuidv4(),
      databaseName,
      name: '[schema].[TableName]',
      cmdQuery: createTableQuery,
      executeImmediately: false
    };

    context!.dispatch({
      type: CommandQueryActionTypes.Queried,
      payload: query
    });
  }

  async function queryCommandDropTableScript(databaseName: string, schema: string, table: string) {
    const createTableQuery = await agent.databaseCommandApi.getDropTableScript(databaseName, schema, table);

    const query: DatabaseSQLCommandQuery = {
      id: uuidv4(),
      databaseName,
      name: `${schema}.${table}`,
      cmdQuery: createTableQuery,
      executeImmediately: false
    };

    context!.dispatch({
      type: CommandQueryActionTypes.Queried,
      payload: query
    });
  }

  function clearDatabaseCommandQuery() {
    context!.dispatch({
      type: CommandQueryActionTypes.Cleared
    });
  }

  const {isExecuting, executingCommandId, databaseCommandQueries } = context.state;

  return { isExecuting,
    executingCommandId,
    databaseCommandQueries,
    queryCommandGetTopNTableRecords,
    queryForDatabase,
    queryCommandProcedureDefinition,
    queryCommandCreateTableScript,
    queryCommandDropTableScript,
    clearDatabaseCommandQuery
  };
}