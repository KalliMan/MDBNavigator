import { useReducer } from "react";
import { databaseCommandReducer, initialDatabaseCommandState } from "./DatabaseCommandReducer";
import { DatabaseCommandContext } from "./useDatabaseCommandContext";

export default function DatabaseCommandContextProvider({ children }: React.PropsWithChildren) {
  const [state, dispatch] = useReducer(databaseCommandReducer, initialDatabaseCommandState);

  return ( <DatabaseCommandContext.Provider value={{ state, dispatch }}>
      {children}
    </DatabaseCommandContext.Provider>
  );
}
