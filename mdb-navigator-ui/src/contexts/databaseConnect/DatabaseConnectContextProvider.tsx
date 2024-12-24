import { useReducer } from "react";
import { databaseConnectReducer, initialDatabaseConnectState } from "./DatabaseConnectReducer";
import { DatabaseConnectContext } from "./useDatabaseConnect";

export default function DatabaseConnectContextProvider({ children }: React.PropsWithChildren) {
  const [state, dispatch] = useReducer(databaseConnectReducer, initialDatabaseConnectState);

  return ( <DatabaseConnectContext.Provider value={{ state, dispatch }}>
      {children}
    </DatabaseConnectContext.Provider>
  );
}
