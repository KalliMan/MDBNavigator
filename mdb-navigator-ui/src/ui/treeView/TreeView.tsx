import { TreeViewNodeData } from "./TreeViewNodeData";
import { TreeContextProvider } from "./TreeViewContextProvider";
import { TreeViewRoot } from "./TreeViewRoot";
import { CoordPosition } from "../../types/coordPosition";
import { DefaultTreeViewSettings, TreeViewSettings } from "./TreeViewSettings";

export interface TreeViewNodeProps {
  root: TreeViewNodeData;
  onNodeClick: (node: TreeViewNodeData, target: CoordPosition) => void;
  onExpand: (id: string, expanded: boolean) => void;

  settings?: TreeViewSettings;
}

export default function TreeView({root, onNodeClick, onExpand, settings = DefaultTreeViewSettings}: TreeViewNodeProps) {

  return( <TreeContextProvider>
    <TreeViewRoot root={root}
      settings={settings}
      onNodeClick={onNodeClick}
      onExpand={onExpand}
    />
  </TreeContextProvider>);
}
