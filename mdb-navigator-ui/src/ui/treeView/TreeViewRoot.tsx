import { useEffect } from "react";
import { TreeViewNodeData } from "./TreeViewNodeData";
import { NodeDataActionTypes } from "./TreeViewNodeActionTypes";
import { useTreeViewContext } from "./TreeViewContextProvider";
import { TreeViewNode } from "./TreeViewNode";
import { CoordPosition } from "../../types/coordPosition";

export interface Props {
  root: TreeViewNodeData;
  onNodeClick: (node: TreeViewNodeData, target: CoordPosition) => void;
  onExpand: (id: string, expanded: boolean) => void;
}

export function TreeViewRoot({root, onNodeClick, onExpand}: Props) {
  const {dispatch, state} = useTreeViewContext();

  useEffect(() => {
    dispatch({type: NodeDataActionTypes.SET_NODES, payload: root})
  }, [dispatch, root]);

  if (!state.nodeData) {
    return null;
  }

  return (
    <div className="w-fit text-left cursor-pointer">
      <TreeViewNode node={state.nodeData!}
        onNodeClick={onNodeClick}
        onExpand={onExpand}/>
    </div>
  );
}
