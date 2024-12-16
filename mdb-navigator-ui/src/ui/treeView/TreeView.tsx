import { NodeData } from "./TreeViewNodeData";
import { TreeContextProvider } from "./TreeViewContextProvider";
import { TreeViewRoot } from "./TreeViewRoot";

export interface TreeViewNodeProps {
  root: NodeData;
}

export default function TreeView({root}: TreeViewNodeProps) {

  return( <TreeContextProvider>
    <TreeViewRoot root={root}/>
  </TreeContextProvider>);
}
