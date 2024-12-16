import { NodeDataActionTypes, TreeNodeActions } from "./TreeViewNodeActionTypes";
import { NodeData } from "./TreeViewNodeData";

export type NodeDataState = {
  nodeData: NodeData | null;
}

export const initialState: NodeDataState = {
  nodeData: null
};

function expandNode(root: NodeData, id: string, expand: boolean): void {
  const node = findNode(root, id);
  if (node) {
    node.isExpanded = expand;
  }
}

function findNode(root: NodeData, id: string): NodeData | null {
  if (root.id === id) {
    return root;
  }

  if (!root.nodes?.length) {
    return null;
  }

  for(const node of root.nodes) {
    const result = findNode(node, id);

    if (result) {
      return result;
    }
  }

  return null;
}

function addNode(nodeData: NodeData, parentId: string, newNode: NodeData): NodeData {

  const parentNode = findNode(nodeData,parentId);

  if (!parentNode) {
    return nodeData;
  }

  if (!parentNode.nodes) {
    parentNode.nodes = [newNode];
  } else {
    parentNode.nodes.push(newNode);
  }

  return nodeData;
}

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