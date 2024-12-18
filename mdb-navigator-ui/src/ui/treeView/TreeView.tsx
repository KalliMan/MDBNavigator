import { TreeViewNodeData } from "./TreeViewNodeData";
import { TreeContextProvider } from "./TreeViewContextProvider";
import { TreeViewRoot } from "./TreeViewRoot";

export interface TreeViewNodeProps {
  root: TreeViewNodeData;
  onExpand: (id: string, expanded: boolean) => void;
}

export default function TreeView({root, onExpand}: TreeViewNodeProps) {

  return( <TreeContextProvider>
    <TreeViewRoot root={root} onExpand={(id, expanded) => onExpand(id, expanded)}/>
  </TreeContextProvider>);
}
