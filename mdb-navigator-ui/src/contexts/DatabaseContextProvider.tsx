import { createContext, useContext, useReducer } from "react";
import { ConnectionSettings } from "../models/connect/connectionSettings";
import { AppGlobalState } from "../types/AppGlobalState";
import { DatabaseActionTypes } from "./DatabaseActionType";
import { DatabaseContextType, databaseReducer, databaseInitialState } from "./DatabaseReducer";
import agent from "../services/apiAgent";


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
      payload: AppGlobalState.Connecting
    });

    const connection = await agent.databaseConnectionApi.connect(connectionSettings);
    await new Promise(f => setTimeout(f, 1000));

    context!.dispatch({
      type:DatabaseActionTypes.DatabaseConnected,
      payload: connection
    });
  }

  const {isLoading, appState, databaseConnectionInfo} = context.state;

  return {isLoading, appState, databaseConnectionInfo, connect};
}

