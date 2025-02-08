import { createContext, useContext } from "react";
import { DatabaseConnectContextType } from "./DatabaseSchemaReducer";
import { DatabaseSchemaActionTypes } from "./DatabaseSchemaActionTypes";
import agent from "../../services/apiAgent";

export const DatabaseSchemaContext = createContext<DatabaseConnectContextType | null>(null);

export default function useDatabaseSchemaContext() {
  const context = useContext(DatabaseSchemaContext);
  if (!context) {
    throw new Error('useDatabaseSchema must be used within a DatabaseSchemaProvider');
  }

  async function fetchDatabases() {
    context!.dispatch({
      type: DatabaseSchemaActionTypes.Loading,
    });

    const result = await agent.databaseSchemaApi.fetchDatabases();

    context!.dispatch({
      type: DatabaseSchemaActionTypes.FetchedDatabases,
      payload: result
    });
  }

  async function fetchTables(databaseName: string) {
    context!.dispatch({
      type: DatabaseSchemaActionTypes.Loading,
    });

    try {
      const result = await agent.databaseSchemaApi.fetchTables(databaseName);

      context!.dispatch({
        type: DatabaseSchemaActionTypes.FetchedTables,
        payload: result
      });
    } catch (error: any) {
      context!.dispatch({
        type: DatabaseSchemaActionTypes.Error,
        payload: error?.message
      });
    }
  }

  async function fetchStoredProcedures(databaseName: string) {
    context!.dispatch({
      type: DatabaseSchemaActionTypes.Loading,
    });

    try {
      const result = await agent.databaseSchemaApi.fetchStoredProcedures(databaseName);

      context!.dispatch({
        type: DatabaseSchemaActionTypes.FetchedStoredProcedures,
        payload: result
      });
    } catch (error: any) {
      context!.dispatch({
        type: DatabaseSchemaActionTypes.Error,
        payload: error?.message
      });
    }
  }

  async function fetchFunctions(databaseName: string) {
    context!.dispatch({
      type: DatabaseSchemaActionTypes.Loading,
    });

    try {
      const result = await agent.databaseSchemaApi.fetchFunctions(databaseName);

      context!.dispatch({
        type: DatabaseSchemaActionTypes.FetchedFunctions,
        payload: result
      });
    } catch (error: any) {
      context!.dispatch({
        type: DatabaseSchemaActionTypes.Error,
        payload: error?.message
      });
    }
  }

  const {isLoading, error, databasesDetails, tablesDetails, storedProceduresDetails, functionsDetails} = context.state;

  return {
    isLoading,
    error,
    databasesDetails,
    tablesDetails,
    storedProceduresDetails,
    functionsDetails,
    fetchDatabases,
    fetchTables,
    fetchStoredProcedures,
    fetchFunctions
  };
};