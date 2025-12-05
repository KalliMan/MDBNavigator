import { createContext, useContext, useCallback } from "react";
import { DatabaseConnectContextType } from "./DatabaseSchemaReducer";
import { DatabaseSchemaActionTypes } from "./DatabaseSchemaActionTypes";
import agent from "../../services/apiAgent";

export const DatabaseSchemaContext = createContext<DatabaseConnectContextType | null>(null);

export default function useDatabaseSchemaContext() {
  const context = useContext(DatabaseSchemaContext);
  if (!context) {
    throw new Error('useDatabaseSchema must be used within a DatabaseSchemaProvider');
  }

  const dispatch = context.dispatch;

  const fetchDatabases = useCallback(async () => {
    dispatch({
      type: DatabaseSchemaActionTypes.Loading,
    });

    const result = await agent.databaseSchemaApi.fetchDatabases();

    dispatch({
      type: DatabaseSchemaActionTypes.FetchedDatabases,
      payload: result
    });
  }, [dispatch]);

  const fetchTables = useCallback(async (databaseName: string) => {
    dispatch({
      type: DatabaseSchemaActionTypes.Loading,
    });

    try {
      const result = await agent.databaseSchemaApi.fetchTables(databaseName);

      dispatch({
        type: DatabaseSchemaActionTypes.FetchedTables,
        payload: result
      });
    } catch (error: unknown) {
      dispatch({
        type: DatabaseSchemaActionTypes.Error,
        payload: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  }, [dispatch]);

  const fetchStoredProcedures = useCallback(async (databaseName: string) => {
    dispatch({
      type: DatabaseSchemaActionTypes.Loading,
    });

    try {
      const result = await agent.databaseSchemaApi.fetchStoredProcedures(databaseName);

      dispatch({
        type: DatabaseSchemaActionTypes.FetchedStoredProcedures,
        payload: result
      });
    } catch (error: unknown) {
      dispatch({
        type: DatabaseSchemaActionTypes.Error,
        payload: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  }, [dispatch]);

  const fetchFunctions = useCallback(async (databaseName: string) => {
    dispatch({
      type: DatabaseSchemaActionTypes.Loading,
    });

    try {
      const result = await agent.databaseSchemaApi.fetchFunctions(databaseName);

      dispatch({
        type: DatabaseSchemaActionTypes.FetchedFunctions,
        payload: result
      });
    } catch (error: unknown) {
      dispatch({
        type: DatabaseSchemaActionTypes.Error,
        payload: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  }, [dispatch]);

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