import { createContext, useContext, useCallback } from "react";
import { DatabaseConnectContextType } from "./DatabaseSchemaReducer";
import { DatabaseSchemaActions, DatabaseSchemaActionTypes, DatabaseSchemaErrorScope } from "./DatabaseSchemaActionTypes";
import agent from "../../services/apiAgent";

export const DatabaseSchemaContext = createContext<DatabaseConnectContextType | null>(null);

// Loads the database list of a connection; used by the provider for new connections and by fetchDatabases.
export async function loadDatabases(dispatch: React.Dispatch<DatabaseSchemaActions>, connectionId: string) {
  dispatch({
    type: DatabaseSchemaActionTypes.Loading,
  });

  try {
    const result = await agent.databaseSchemaApi.fetchDatabases(connectionId);

    dispatch({
      type: DatabaseSchemaActionTypes.FetchedDatabases,
      payload: result
    });
  } catch (error: unknown) {
    dispatch({
      type: DatabaseSchemaActionTypes.Error,
      payload: {
        message: error instanceof Error ? error.message : "An error occurred",
        connectionId,
        scope: DatabaseSchemaErrorScope.Databases,
      },
    });
  }
}

export default function useDatabaseSchemaContext() {
  const context = useContext(DatabaseSchemaContext);
  if (!context) {
    throw new Error('useDatabaseSchema must be used within a DatabaseSchemaProvider');
  }

  const dispatch = context.dispatch;

  const fetchDatabases = useCallback(
    (connectionId: string) => loadDatabases(dispatch, connectionId),
    [dispatch]
  );

  const fetchTables = useCallback(async (connectionId: string, databaseName: string) => {
    dispatch({
      type: DatabaseSchemaActionTypes.Loading,
    });

    try {
      const result = await agent.databaseSchemaApi.fetchTables(connectionId, databaseName);

      dispatch({
        type: DatabaseSchemaActionTypes.FetchedTables,
        payload: result
      });
    } catch (error: unknown) {
      dispatch({
        type: DatabaseSchemaActionTypes.Error,
        payload: {
          message: error instanceof Error ? error.message : "An error occurred",
          connectionId,
          databaseName,
          scope: DatabaseSchemaErrorScope.Tables,
        },
      });
    }
  }, [dispatch]);

  const fetchTableDefinition = useCallback(async (connectionId: string, databaseName: string, schema: string, table: string) => {
    dispatch({
      type: DatabaseSchemaActionTypes.Loading,
    });
    try {
      const result = await agent.databaseSchemaApi.tableDefinition(connectionId, databaseName, schema, table);
      dispatch({
        type: DatabaseSchemaActionTypes.FetchedTableDefinition,
        payload: result
      });
    }
    catch (error: unknown) {
      dispatch({
        type: DatabaseSchemaActionTypes.Error,
        payload: {
          message: error instanceof Error ? error.message : "An error occurred",
          connectionId,
          databaseName,
          tableName: table,
          databaseSchema: schema,
          scope: DatabaseSchemaErrorScope.TableDefinition,
        },
      });
    }
  }, [dispatch]);

  const fetchStoredProcedures = useCallback(async (connectionId: string, databaseName: string) => {
    dispatch({
      type: DatabaseSchemaActionTypes.Loading,
    });

    try {
      const result = await agent.databaseSchemaApi.fetchStoredProcedures(connectionId, databaseName);

      dispatch({
        type: DatabaseSchemaActionTypes.FetchedStoredProcedures,
        payload: result
      });
    } catch (error: unknown) {
      dispatch({
        type: DatabaseSchemaActionTypes.Error,
        payload: {
          message: error instanceof Error ? error.message : "An error occurred",
          connectionId,
          databaseName,
          scope: DatabaseSchemaErrorScope.Procedures,
        },
      });
    }
  }, [dispatch]);

  const fetchFunctions = useCallback(async (connectionId: string, databaseName: string) => {
    dispatch({
      type: DatabaseSchemaActionTypes.Loading,
    });

    try {
      const result = await agent.databaseSchemaApi.fetchFunctions(connectionId, databaseName);

      dispatch({
        type: DatabaseSchemaActionTypes.FetchedFunctions,
        payload: result
      });
    } catch (error: unknown) {
      dispatch({
        type: DatabaseSchemaActionTypes.Error,
        payload: {
          message: error instanceof Error ? error.message : "An error occurred",
          connectionId,
          databaseName,
          scope: DatabaseSchemaErrorScope.Functions,
        },
      });
    }
  }, [dispatch]);

  const fetchViews = useCallback(async (connectionId: string, databaseName: string) => {
    dispatch({
      type: DatabaseSchemaActionTypes.Loading,
    });
    try {
      const result = await agent.databaseSchemaApi.fetchViews(connectionId, databaseName);
      dispatch({
        type: DatabaseSchemaActionTypes.FetchedViews,
        payload: result
      });
    }
    catch (error: unknown) {
      dispatch({
        type: DatabaseSchemaActionTypes.Error,
        payload: {
          message: error instanceof Error ? error.message : "An error occurred",
          connectionId,
          databaseName,
          scope: DatabaseSchemaErrorScope.Views,
        },
      });
    }
  }, [dispatch]);

  const resetTables = useCallback((connectionId: string, databaseName: string) => {
    dispatch({
      type: DatabaseSchemaActionTypes.ResetTables,
      payload: { connectionId, databaseName }
    });
  }, [dispatch]);

  const resetStoredProcedures = useCallback((connectionId: string, databaseName: string) => {
    dispatch({
      type: DatabaseSchemaActionTypes.ResetStoredProcedures,
      payload: { connectionId, databaseName }
    });
  }, [dispatch]);

  const resetFunctions = useCallback((connectionId: string, databaseName: string) => {
    dispatch({
      type: DatabaseSchemaActionTypes.ResetFunctions,
      payload: { connectionId, databaseName }
    });
  }, [dispatch]);

  const resetViews = useCallback((connectionId: string, databaseName: string) => {
    dispatch({
      type: DatabaseSchemaActionTypes.ResetViews,
      payload: { connectionId, databaseName }
    });
  }, [dispatch]);

  const {isLoading, databaseSchemas} = context.state;

  return {
    isLoading,
    databaseSchemas,
    // error,
    fetchDatabases,

    fetchTables,
    fetchTableDefinition,

    fetchStoredProcedures,
    fetchFunctions,
    fetchViews,
    resetTables,
    resetStoredProcedures,
    resetFunctions,
    resetViews,
  };
};