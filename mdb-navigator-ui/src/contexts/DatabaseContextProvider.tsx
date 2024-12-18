import { createContext, useContext, useReducer } from "react";
import { ConnectionSettings } from "../models/connect/connectionSettings";
import { DatabaseActionTypes } from "./DatabaseActionType";
import { DatabaseContextType, databaseReducer, databaseInitialState } from "./DatabaseReducer";
import agent from "../services/apiAgent";
//import { AppGlobalState } from "../types/appGlobalState";


const DatabaseContext = createContext<DatabaseContextType | null>(null);


export function DatabaseContextProvider({ children }: React.PropsWithChildren) {
  const [state, dispatch] = useReducer(databaseReducer, databaseInitialState);

  return ( <DatabaseContext.Provider value={{ state, dispatch }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabaseContext() {
  const context = useContext(DatabaseContext);

  if (!context) {
      throw new Error('TreeViewContext must be used inside the Provider');
  }

  async function connect(connectionSettings: ConnectionSettings) {
    context!.dispatch({
      type: DatabaseActionTypes.Loading,
    });

    const result = await agent.databaseConnectionApi.connect(connectionSettings);

    if (result ){
      context!.dispatch({
        type:DatabaseActionTypes.DatabaseConnected,
        payload: connectionSettings
      });
    } else {
      context!.dispatch({
        type:DatabaseActionTypes.Error,
        payload: `Cannot connect to ${connectionSettings.serverName}`
      });
    }
  }

  async function fetchDatabases() {
    context!.dispatch({
      type: DatabaseActionTypes.Loading,
    });

    const result = await agent.databaseSchemaApi.fetchDatabases();

    context!.dispatch({
      type: DatabaseActionTypes.FetchedDatabases,
      payload: result
    });
  }

  async function fetchTables(databaseName: string) {
    context!.dispatch({
      type: DatabaseActionTypes.Loading,
    });

    const result = await agent.databaseSchemaApi.fetchTables(databaseName);

    context!.dispatch({
      type: DatabaseActionTypes.FetchedTables,
      payload: result
    });

  }

  const {isLoading, isConnectedToDB, error, connectionSettings, databasesDetails, tablesDetails} = context.state;

  return {isLoading, isConnectedToDB, error, connectionSettings, databasesDetails, tablesDetails, connect, fetchDatabases, fetchTables};
}

