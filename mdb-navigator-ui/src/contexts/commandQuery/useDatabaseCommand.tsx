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

  async function queryCommandGetTopNTableRecords(connectionId: string, databaseName: string, schema: string, table: string, recordsNumber: number) {

    const id = uuidv4();
    const topNRecordsQuery = await agent.databaseCommandApi.getTopNTableRecordsScript(connectionId, id, databaseName, schema, table, recordsNumber);

    const query: DatabaseSQLCommandQuery = {
      connectionId: connectionId,
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

  async function queryForDatabase(connectionId: string, databaseName: string, schema: string) {
    const id = uuidv4();

    const query: DatabaseSQLCommandQuery = {
      connectionId,
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

  async function queryCommandProcedureDefinition(connectionId: string, databaseName: string, schema: string, name: string) {
    const procedureCodeQuery = await agent.databaseCommandApi.getProcedureDefinition(connectionId, databaseName, schema, name);

    const id = uuidv4();
    const query: DatabaseSQLCommandQuery = {
      connectionId,
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

  async function queryCommandCreateStoredProcedureScript(connectionId: string, databaseName: string, schema: string = 'public') {
    const createProcedureScript = await agent.databaseCommandApi.getCreateStoredProcedureScript(connectionId, databaseName, schema);

    const id = uuidv4();
    const query: DatabaseSQLCommandQuery = {
      connectionId,
      id,
      databaseName,
      name: `[${schema}].[ProcedureName]`,
      cmdQuery: createProcedureScript,
      executeImmediately: false
    };

    context!.dispatch({
      type: CommandQueryActionTypes.Queried,
      payload: query
    });
  }

  async function queryCommandCreateFunctionScript(connectionId: string, databaseName: string, schema: string = 'public') {
    const createFunctionScript = await agent.databaseCommandApi.getCreateFunctionScript(connectionId, databaseName, schema);

    const query: DatabaseSQLCommandQuery = {
      connectionId,
      id: uuidv4(),
      databaseName,
      name: `[${schema}].[FunctionName]`,
      cmdQuery: createFunctionScript,
      executeImmediately: false
    };

    context!.dispatch({
      type: CommandQueryActionTypes.Queried,
      payload: query
    });
  }

  async function queryCommandViewDefinition(connectionId: string, databaseName: string, schema: string, name: string) {
    const viewCodeQuery = await agent.databaseCommandApi.getViewDefinition(connectionId, databaseName, schema, name);

    const id = uuidv4();
    const query: DatabaseSQLCommandQuery = {
      connectionId,
      id,
      databaseName,
      name: `${schema}.${name}`,
      cmdQuery: viewCodeQuery,
      executeImmediately: false
    };

    context!.dispatch({
      type: CommandQueryActionTypes.Queried,
      payload: query
    });
  }

  async function queryCommandCreateViewScript(connectionId: string, databaseName: string, schema: string = 'public') {
    const createViewScript = await agent.databaseCommandApi.getCreateViewScript(connectionId, databaseName, schema);

    const query: DatabaseSQLCommandQuery = {
      connectionId,
      id: uuidv4(),
      databaseName,
      name: `[${schema}].[ViewName]`,
      cmdQuery: createViewScript,
      executeImmediately: false
    };

    context!.dispatch({
      type: CommandQueryActionTypes.Queried,
      payload: query
    });
  }

  async function queryCommandCreateTableScript(connectionId: string, databaseName: string, schema: string = 'public') {
    const createTableQuery = await agent.databaseCommandApi.getCreateTableScript(connectionId, databaseName, schema);

    const query: DatabaseSQLCommandQuery = {
      connectionId,
      id: uuidv4(),
      databaseName,
      name: `[${schema}].[TableName]`,
      cmdQuery: createTableQuery,
      executeImmediately: false
    };

    context!.dispatch({
      type: CommandQueryActionTypes.Queried,
      payload: query
    });
  }

  async function queryCommandDropTableScript(connectionId: string, databaseName: string, schema: string, table: string) {
    const createTableQuery = await agent.databaseCommandApi.getDropTableScript(connectionId, databaseName, schema, table);

    const query: DatabaseSQLCommandQuery = {
      connectionId,
      id: uuidv4(),
      databaseName,
      name: `[${schema}].[${table}]`,
      cmdQuery: createTableQuery,
      executeImmediately: false
    };

    context!.dispatch({
      type: CommandQueryActionTypes.Queried,
      payload: query
    });
  }

  async function queryCommandDropProcedureScript(connectionId: string, databaseName: string, schema: string, name: string) {
    const dropProcedureScript = await agent.databaseCommandApi.getDropProcedureScript(connectionId, databaseName, schema, name);

    const query: DatabaseSQLCommandQuery = {
      connectionId,
      id: uuidv4(),
      databaseName,
      name: `[${schema}].[${name}]`,
      cmdQuery: dropProcedureScript,
      executeImmediately: false
    };

    context!.dispatch({
      type: CommandQueryActionTypes.Queried,
      payload: query
    });
  }

  async function queryCommandDropViewScript(connectionId: string, databaseName: string, schema: string, name: string) {
    const dropViewScript = await agent.databaseCommandApi.getDropViewScript(connectionId, databaseName, schema, name);

    const query: DatabaseSQLCommandQuery = {
      connectionId,
      id: uuidv4(),
      databaseName,
      name: `${schema}.${name}`,
      cmdQuery: dropViewScript,
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
    queryCommandCreateStoredProcedureScript,
    queryCommandCreateFunctionScript,
    queryCommandViewDefinition,
    queryCommandCreateViewScript,
    queryCommandCreateTableScript,
    queryCommandDropTableScript,
    queryCommandDropProcedureScript,
    queryCommandDropViewScript,
    clearDatabaseCommandQuery
  };
}