import { createContext, useContext, useReducer } from "react";
import { TreeNodeActions } from "./TreeViewNodeActionTypes";
import { initialState, NodeDataState, treeReducer } from "./TreeViewReducer";

export type NodeDataContextType = {
  state: NodeDataState,
  dispatch: React.Dispatch<TreeNodeActions>,
}

const TreeViewContext = createContext<NodeDataContextType | null>(null);

export function TreeContextProvider({ children }: React.PropsWithChildren) {
  const [state, dispatch] = useReducer(treeReducer, initialState);

  return ( <TreeViewContext.Provider value={{ state, dispatch }}>
      {children}
    </TreeViewContext.Provider>
  );
}

export function useTreeViewContext(): NodeDataContextType {
  const context = useContext(TreeViewContext);
  if (!context) {
      throw new Error('TreeViewContext must be used inside the Provider');
  }

  return context;
}
