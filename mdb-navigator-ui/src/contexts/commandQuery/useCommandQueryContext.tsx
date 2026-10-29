import { createContext, useContext } from "react";
import { CommandQueryContextType } from "./CommandQueryReducer";
import { v4 as uuidv4 } from 'uuid';
import agent from "../../services/apiAgent";
import { CommandQueryActionTypes } from "./CommandQueryActionType";

export const CommandQueryContext = createContext<CommandQueryContextType | null>(null);

const api = agent.databaseCommandApi;

export default function useCommandQueryContext(){
  const context = useContext(CommandQueryContext);
  if (!context) {
    throw new Error('useCommandQueryContext must be used within a CommandQueryContext');
  }

  // Every tree action ends here: a new query becomes a new tab (see MainBar).
  function openQueryTab(connectionId: string, databaseName: string, name: string, cmdQuery: string, executeImmediately = false) {
    context!.dispatch({
      type: CommandQueryActionTypes.Queried,
      payload: { connectionId, id: uuidv4(), databaseName, name, cmdQuery, executeImmediately }
    });
  }

  // Tables
  async function queryCommandGetTopNTableRecords(connectionId: string, databaseName: string, schema: string, table: string, recordsNumber: number) {
    const script = await api.getTopNTableRecordsScript(connectionId, databaseName, schema, table, recordsNumber);
    openQueryTab(connectionId, databaseName, `${schema}.${table}`, script, true);
  }

  async function queryForDatabase(connectionId: string, databaseName: string, schema: string) {
    openQueryTab(connectionId, databaseName, `${schema}.*`, `SELECT * FROM ${schema || '{Schema}'}.{TableName}`);
  }

  async function queryCommandCreateNewTableScript(connectionId: string, databaseName: string, schema: string = 'public') {
    openQueryTab(connectionId, databaseName, `${schema}.TableName`, await api.getCreateNewTableScript(connectionId, databaseName, schema));
  }

  async function queryCommandCreateTableScript(connectionId: string, databaseName: string, schema: string, table: string) {
    openQueryTab(connectionId, databaseName, `${schema}.${table}`, await api.getCreateTableScript(connectionId, databaseName, schema, table));
  }

  async function queryCommandInsertTableScript(connectionId: string, databaseName: string, schema: string, table: string) {
    openQueryTab(connectionId, databaseName, `${schema}.${table}`, await api.getInsertTableScript(connectionId, databaseName, schema, table));
  }

  async function queryCommandDropTableScript(connectionId: string, databaseName: string, schema: string, table: string) {
    openQueryTab(connectionId, databaseName, `${schema}.${table}`, await api.getDropTableScript(connectionId, databaseName, schema, table));
  }

  // Procedures and functions
  async function queryCommandProcedureDefinition(connectionId: string, databaseName: string, schema: string, name: string) {
    openQueryTab(connectionId, databaseName, `${schema}.${name}`, await api.getProcedureDefinition(connectionId, databaseName, schema, name));
  }

  async function queryCommandCreateStoredProcedureScript(connectionId: string, databaseName: string, schema: string = 'public') {
    openQueryTab(connectionId, databaseName, `${schema}.ProcedureName`, await api.getCreateStoredProcedureScript(connectionId, databaseName, schema));
  }

  async function queryCommandCreateFunctionScript(connectionId: string, databaseName: string, schema: string = 'public') {
    openQueryTab(connectionId, databaseName, `${schema}.FunctionName`, await api.getCreateFunctionScript(connectionId, databaseName, schema));
  }

  async function queryCommandDropProcedureScript(connectionId: string, databaseName: string, schema: string, name: string) {
    openQueryTab(connectionId, databaseName, `${schema}.${name}`, await api.getDropProcedureScript(connectionId, databaseName, schema, name));
  }

  // Views
  async function queryCommandViewDefinition(connectionId: string, databaseName: string, schema: string, name: string) {
    openQueryTab(connectionId, databaseName, `${schema}.${name}`, await api.getViewDefinition(connectionId, databaseName, schema, name));
  }

  async function queryCommandCreateViewScript(connectionId: string, databaseName: string, schema: string = 'public') {
    openQueryTab(connectionId, databaseName, `${schema}.ViewName`, await api.getCreateViewScript(connectionId, databaseName, schema));
  }

  async function queryCommandDropViewScript(connectionId: string, databaseName: string, schema: string, name: string) {
    openQueryTab(connectionId, databaseName, `${schema}.${name}`, await api.getDropViewScript(connectionId, databaseName, schema, name));
  }

  const { databaseCommandQueries } = context.state;

  return {
    databaseCommandQueries,
    queryCommandGetTopNTableRecords: catchErrors(queryCommandGetTopNTableRecords),
    queryForDatabase: catchErrors(queryForDatabase),
    queryCommandProcedureDefinition: catchErrors(queryCommandProcedureDefinition),
    queryCommandCreateStoredProcedureScript: catchErrors(queryCommandCreateStoredProcedureScript),
    queryCommandCreateFunctionScript: catchErrors(queryCommandCreateFunctionScript),
    queryCommandViewDefinition: catchErrors(queryCommandViewDefinition),
    queryCommandCreateViewScript: catchErrors(queryCommandCreateViewScript),
    queryCommandCreateNewTableScript: catchErrors(queryCommandCreateNewTableScript),
    queryCommandCreateTableScript: catchErrors(queryCommandCreateTableScript),
    queryCommandInsertTableScript: catchErrors(queryCommandInsertTableScript),
    queryCommandDropTableScript: catchErrors(queryCommandDropTableScript),
    queryCommandDropProcedureScript: catchErrors(queryCommandDropProcedureScript),
    queryCommandDropViewScript: catchErrors(queryCommandDropViewScript),
  };
}

// Failed requests are already shown as a toast by the api agent; this only keeps
// a failed script request from becoming an unhandled promise rejection.
function catchErrors<TArgs extends unknown[]>(fn: (...args: TArgs) => Promise<void>) {
  return async (...args: TArgs): Promise<void> => {
    try {
      await fn(...args);
    } catch (error) {
      console.error(error);
    }
  };
}
