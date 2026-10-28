import { useEffect, useReducer, useRef } from "react";
import { databaseSchemaReducer, initialDatabaseConnectState } from "./DatabaseSchemaReducer";
import { DatabaseSchemaContext, loadDatabases } from "./useDatabaseSchema";
import { DatabaseSchemaActionTypes } from "./DatabaseSchemaActionTypes";
import useDatabaseConnectContext from "../databaseServerConnect/useDatabaseServerConnect";

export default function DatabaseSchemaContextProvider({ children }: React.PropsWithChildren) {
  const [state, dispatch] = useReducer(databaseSchemaReducer, initialDatabaseConnectState);
  const { databaseServerConnections } = useDatabaseConnectContext();
  // Connections whose databases were already requested (guards against StrictMode double effects).
  const loadedConnectionIds = useRef<Set<string>>(new Set());

  // Keeps one schema per server connection. Lives in the provider so it runs once,
  // no matter how many components use useDatabaseSchemaContext.
  useEffect(() => {
    const connectionIds = databaseServerConnections
      .map(c => c.connectedResult?.connectionId)
      .filter((id): id is string => !!id);

    // Disconnected servers: drop their schema.
    loadedConnectionIds.current.forEach(id => {
      if (!connectionIds.includes(id)) {
        loadedConnectionIds.current.delete(id);
        dispatch({ type: DatabaseSchemaActionTypes.RemovedSchema, payload: id });
      }
    });

    // New connections: add a schema and load its databases.
    connectionIds
      .filter(id => !loadedConnectionIds.current.has(id))
      .forEach(id => {
        loadedConnectionIds.current.add(id);
        dispatch({
          type: DatabaseSchemaActionTypes.AddedSchema,
          payload: { connectionId: id, isLoading: false, error: null, databasesDetails: null }
        });
        loadDatabases(dispatch, id);
      });
  }, [databaseServerConnections]);

  return ( <DatabaseSchemaContext.Provider value={{ state, dispatch }}>
      {children}
    </DatabaseSchemaContext.Provider>
  );
}
