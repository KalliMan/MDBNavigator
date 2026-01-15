import { NodeDataActionTypes, TreeNodeActions } from "./TreeViewNodeActionTypes";
import { TreeViewNodeData } from "./TreeViewNodeData";
import { findNode, findSelectedNode } from "./treeViewUtils";

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

    case NodeDataActionTypes.SELECT_NODE: {

      if (!state.nodeData) {
        return { nodeData: null }
      }

      selectNode(state.nodeData, action.payload.id, action.payload.selected);
      return {
        nodeData: { ...state.nodeData }
      };
    }

    default:
      throw new Error('Unsupported Action type');
  }

  return state;
}

function expandNode(root: TreeViewNodeData, id: string, expand: boolean): void {
  const node = findNode(root, id);
  if (node) {
    node.isExpanded = expand;
  }
}

function selectNode(root: TreeViewNodeData, id: string, selected: boolean): void {
  const prevSelectedNode = findSelectedNode(root);
  if (prevSelectedNode) {
    prevSelectedNode.isSelected = false;
  }

  const node = findNode(root, id);
  if (node) {
    node.isSelected = selected;
  }
}

function addNode(nodeData: TreeViewNodeData, parentId: string, newNode: TreeViewNodeData): TreeViewNodeData {

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
