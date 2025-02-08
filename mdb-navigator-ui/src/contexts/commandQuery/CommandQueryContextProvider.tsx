import { useReducer } from "react";
import { commandQueryReducer, initialCommandQueryState } from "./CommandQueryReducer";
import { CommandQueryContext } from "./useDatabaseCommand";


export default function CommandQueryContextProvider({ children }: React.PropsWithChildren) {
  const [state, dispatch] = useReducer(commandQueryReducer, initialCommandQueryState);

  return ( <CommandQueryContext.Provider value={{ state, dispatch }}>
      {children}
    </CommandQueryContext.Provider>
  );
}
