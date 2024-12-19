import { TreeViewNodeData } from "./TreeViewNodeData";
import { TreeContextProvider } from "./TreeViewContextProvider";
import { TreeViewRoot } from "./TreeViewRoot";
import { CoordPosition } from "../../types/coordPosition";

export interface TreeViewNodeProps {
  root: TreeViewNodeData;
  onNodeClick: (node: TreeViewNodeData, target: CoordPosition) => void;
  onExpand: (id: string, expanded: boolean) => void;
}

export default function TreeView({root, onNodeClick, onExpand}: TreeViewNodeProps) {

  return( <TreeContextProvider>
    <TreeViewRoot root={root}
      onNodeClick={onNodeClick}
      onExpand={onExpand}
    />
  </TreeContextProvider>);
}
