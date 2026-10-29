import { createContext, useContext } from "react";
import { TreeNodeActions } from "./TreeViewNodeActionTypes";
import { NodeDataState } from "./TreeViewReducer";

export type NodeDataContextType = {
  state: NodeDataState,
  dispatch: React.Dispatch<TreeNodeActions>,
}

export const TreeViewContext = createContext<NodeDataContextType | null>(null);

export function useTreeViewContext(): NodeDataContextType {
  const context = useContext(TreeViewContext);
  if (!context) {
      throw new Error('TreeViewContext must be used inside the Provider');
  }

  return context;
}
