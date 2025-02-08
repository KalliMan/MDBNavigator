import { useReducer } from "react";
import { databaseSchemaReducer, initialDatabaseConnectState } from "./DatabaseSchemaReducer";
import { DatabaseSchemaContext } from "./useDatabaseSchema";

export default function DatabaseSchemaContextProvider({ children }: React.PropsWithChildren) {
  const [state, dispatch] = useReducer(databaseSchemaReducer, initialDatabaseConnectState);

  return ( <DatabaseSchemaContext.Provider value={{ state, dispatch }}>
      {children}
    </DatabaseSchemaContext.Provider>
  );
}
