import { createContext, useContext, useCallback, useEffect } from "react";
import { DatabaseConnectContextType } from "./DatabaseSchemaReducer";
import { DatabaseSchemaActionTypes } from "./DatabaseSchemaActionTypes";
import agent from "../../services/apiAgent";
import useDatabaseConnectContext from "../databaseConnect/useDatabaseConnect";

export const DatabaseSchemaContext = createContext<DatabaseConnectContextType | null>(null);

export default function useDatabaseSchemaContext() {
  const { isConnectedToDB,
    connectedResult,
  } = useDatabaseConnectContext();

  const context = useContext(DatabaseSchemaContext);
  if (!context) {
    throw new Error('useDatabaseSchema must be used within a DatabaseSchemaProvider');
  }

  const dispatch = context.dispatch;  

  useEffect(() => {
    async function addSchema() {
      if (context?.state && isConnectedToDB && connectedResult) {
        const schema = context.state.databaseSchemas?.find(s => s.connectionId === connectedResult.connectionId);

        if (!schema) {

          const newSchema = {
            connectionId: connectedResult.connectionId,
            isLoading: false,
            error: null,
            databasesDetails: null,
            tablesDetails: null,
            storedProceduresDetails: null,
            functionsDetails: null
          }

          context.state.databaseSchemas?.push(newSchema);

          context.dispatch({
            type: DatabaseSchemaActionTypes.AddedSchema,
            payload: newSchema
          });

          try {
            dispatch({
              type: DatabaseSchemaActionTypes.Loading,
            });

            const result = await agent.databaseSchemaApi.fetchDatabases(connectedResult.connectionId);

            dispatch({
              type: DatabaseSchemaActionTypes.FetchedDatabases,
              payload: result
            });
          } catch (error: unknown) {
            dispatch({
              type: DatabaseSchemaActionTypes.Error,
              payload: error instanceof Error ? error.message : 'An error occurred'
            });
          }
        }
      }
    }

    addSchema();

  }, [connectedResult, context, context.state.databaseSchemas, dispatch, isConnectedToDB]);  

  const fetchDatabases = useCallback(async (connectionId: string) => {
    dispatch({
      type: DatabaseSchemaActionTypes.Loading,
    });

    const result = await agent.databaseSchemaApi.fetchDatabases(connectionId);

    dispatch({
      type: DatabaseSchemaActionTypes.FetchedDatabases,
      payload: result
    });
  }, [dispatch]);

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
        payload: error instanceof Error ? error.message : 'An error occurred'
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
        payload: error instanceof Error ? error.message : 'An error occurred'
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
        payload: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  }, [dispatch]);

  const {isLoading, databaseSchemas,  /*error, databasesDetails, tablesDetails, storedProceduresDetails, functionsDetails*/} = context.state;

  return {
    isLoading,
    databaseSchemas,
    // error,
    // databasesDetails,
    // tablesDetails,
    // storedProceduresDetails,
    // functionsDetails,
    fetchDatabases,
    fetchTables,
    fetchStoredProcedures,
    fetchFunctions
  };
};