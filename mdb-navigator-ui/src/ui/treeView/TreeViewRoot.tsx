import { useEffect } from "react";
import { TreeViewNodeData } from "./TreeViewNodeData";
import { NodeDataActionTypes } from "./TreeViewNodeActionTypes";
import { useTreeViewContext } from "./useTreeViewContext";
import { TreeViewNode } from "./TreeViewNode";
import { CoordPosition } from "../../types/coordPosition";
import { TreeViewSettings } from "./TreeViewSettings";

export interface Props {
  root: TreeViewNodeData;
  onNodeClick: (node: TreeViewNodeData, target: CoordPosition) => void;
  onExpand: (id: string, expanded: boolean) => void;

  settings: TreeViewSettings;
}

export function TreeViewRoot({root, settings, onNodeClick, onExpand}: Props) {
  const {dispatch, state} = useTreeViewContext();

  useEffect(() => {
    dispatch({type: NodeDataActionTypes.SET_NODES, payload: root})
  }, [dispatch, root]);

  if (!state.nodeData) {
    return null;
  }

  return (
    <div className="w-fit min-w-full py-1 text-left cursor-pointer">
      <ul className="pl-1">
        {settings.showRoot ? (
          <TreeViewNode
            node={state.nodeData}
            settings={settings}
            onNodeClick={onNodeClick}
            onExpand={onExpand}
          />
        ) : (
          state.nodeData.nodes?.map(childNode => (
            <TreeViewNode
              key={childNode.id}
              node={childNode}
              settings={settings}
              onNodeClick={onNodeClick}
              onExpand={onExpand}
            />
          ))
        )}
      </ul>
    </div>
  );
}
