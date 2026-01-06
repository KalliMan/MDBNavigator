import { useReducer } from "react";
import { databaseConnectReducer, initialDatabaseConnectState } from "./DatabaseServerConnectReducer";
import { DatabaseServerConnectContext } from "./useDatabaseServerConnect";

export default function DatabaseServerConnectContextProvider({ children }: React.PropsWithChildren) {
  const [state, dispatch] = useReducer(databaseConnectReducer, initialDatabaseConnectState);

  return ( <DatabaseServerConnectContext.Provider value={{ state, dispatch }}>
      {children}
    </DatabaseServerConnectContext.Provider>
  );
}
