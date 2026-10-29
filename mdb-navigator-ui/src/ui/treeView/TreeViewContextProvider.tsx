import { useMemo, useReducer } from "react";
import { initialState, treeReducer } from "./TreeViewReducer";
import { TreeViewContext } from "./useTreeViewContext";

export function TreeContextProvider({ children }: React.PropsWithChildren) {
  const [state, dispatch] = useReducer(treeReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return ( <TreeViewContext.Provider value={value}>
      {children}
    </TreeViewContext.Provider>
  );
}
