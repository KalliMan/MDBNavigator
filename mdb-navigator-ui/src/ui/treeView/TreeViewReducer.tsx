import { produce } from "immer";
import { NodeDataActionTypes, TreeNodeActions } from "./TreeViewNodeActionTypes";
import { TreeViewNodeData } from "./TreeViewNodeData";
import { findNode, findSelectedNode } from "./treeViewUtils";

export type NodeDataState = {
  nodeData: TreeViewNodeData | null;
};

export const initialState: NodeDataState = {
  nodeData: null,
};

export function treeReducer(state: NodeDataState, action: TreeNodeActions): NodeDataState {
  return produce(state, draft => {
    switch (action.type) {
      case NodeDataActionTypes.SET_NODES: {
        if (!draft.nodeData) {
          draft.nodeData = action.payload;
        } else {
          draft.nodeData = mergeTreeState(draft.nodeData, action.payload);
        }
        break;
      }

      case NodeDataActionTypes.EXPAND_NODE: {
        if (!draft.nodeData) {
          break;
        }

        const node = findNode(draft.nodeData, action.payload.id);
        if (node) {
          node.isExpanded = action.payload.expand;
        }
        break;
      }

      case NodeDataActionTypes.ADD_NODE: {
        if (!draft.nodeData) {
          break;
        }

        const parentNode = findNode(draft.nodeData, action.payload.parentId);
        if (!parentNode) {
          break;
        }

        if (!parentNode.nodes) {
          parentNode.nodes = [action.payload.newNode];
        } else {
          parentNode.nodes.push(action.payload.newNode);
        }
        break;
      }

      case NodeDataActionTypes.SELECT_NODE: {
        if (!draft.nodeData) {
          break;
        }

        const prevSelectedNode = findSelectedNode(draft.nodeData);
        if (prevSelectedNode) {
          prevSelectedNode.isSelected = false;
        }

        const node = findNode(draft.nodeData, action.payload.id);
        if (node) {
          node.isSelected = action.payload.selected;
        }
        break;
      }

      default:
        throw new Error("Unsupported Action type");
    }
  });
}

function mergeTreeState(prev: TreeViewNodeData, next: TreeViewNodeData): TreeViewNodeData {
  // Start from new data, but carry over UI flags from previous tree
  const merged: TreeViewNodeData = {
    ...next,
    isExpanded: prev.isExpanded ?? next.isExpanded,
  };

  if (prev.nodes && next.nodes) {
    merged.nodes = next.nodes.map(nextChild => {
      const matchingPrev = prev.nodes!.find(p => p.id === nextChild.id);
      return matchingPrev ? mergeTreeState(matchingPrev, nextChild) : nextChild;
    });
  }

  return merged;
}

