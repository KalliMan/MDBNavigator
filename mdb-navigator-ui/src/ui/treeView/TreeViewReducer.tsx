import { NodeDataActionTypes, TreeNodeActions } from "./TreeViewNodeActionTypes";
import { TreeViewNodeData } from "./TreeViewNodeData";
import { addNode, expandNode } from "./treeViewUtils";

export type NodeDataState = {
  nodeData: TreeViewNodeData | null;
}

export const initialState: NodeDataState = {
  nodeData: null
};

export function treeReducer(state: NodeDataState, action: TreeNodeActions): NodeDataState {
  switch(action.type) {
    case NodeDataActionTypes.SET_NODES:
      return {
        nodeData: {...action.payload}
      };
    case NodeDataActionTypes.EXPAND_NODE:
      if (!state.nodeData) {
        return { nodeData: null }
      }

      expandNode(state.nodeData, action.payload.id, action.payload.expand)
      return {
        nodeData: { ...state.nodeData }
      };

    case NodeDataActionTypes.ADD_NODE: {

      if (!state.nodeData) {
        return { nodeData: null }
      }
      const nodeData = addNode(state.nodeData, action.payload.parentId, action.payload.newNode);
      return {
        nodeData: { ...nodeData }
      };
    }

    default:
      throw new Error('Unsupported Action type');
  }

  return state;
}