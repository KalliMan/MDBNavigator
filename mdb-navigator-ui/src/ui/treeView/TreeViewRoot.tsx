import { useEffect } from "react";
import { NodeData } from "./TreeViewNodeData";
import { NodeDataActionTypes } from "./TreeViewNodeActionTypes";
import { useTreeViewContext } from "./TreeViewContextProvider";
import { TreeViewNode } from "./TreeViewNode";

export interface Props {
  root: NodeData;
}

export function TreeViewRoot({root}: Props) {
  const {dispatch, state} = useTreeViewContext();

  useEffect(() => {
    dispatch({type: NodeDataActionTypes.SET_NODES, payload: root})
  }, [dispatch, root]);

  if (!state.nodeData) {
    return null;
  }

  return (
    <div className="w-fit text-left cursor-pointer">
      <TreeViewNode node={state.nodeData!}/>
    </div>
  );
}
