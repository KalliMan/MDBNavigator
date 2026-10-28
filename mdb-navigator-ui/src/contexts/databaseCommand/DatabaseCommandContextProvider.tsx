import { useReducer, useState } from "react";
import { databaseCommandReducer, initialDatabaseCommandState } from "./DatabaseCommandReducer";
import { DatabaseCommandContext } from "./useDatabaseCommandContext";
import { createBatchBuffer } from "./batchBuffer";

export default function DatabaseCommandContextProvider({ children }: React.PropsWithChildren) {
  const [state, dispatch] = useReducer(databaseCommandReducer, initialDatabaseCommandState);
  // One buffer for the app lifetime; dispatch from useReducer is stable.
  const [batchBuffer] = useState(() => createBatchBuffer(dispatch));

  return ( <DatabaseCommandContext.Provider value={{ state, dispatch, batchBuffer }}>
      {children}
    </DatabaseCommandContext.Provider>
  );
}
