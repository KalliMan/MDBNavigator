import { TreeViewNodeData } from "./TreeViewNodeData";

export enum NodeDataActionTypes {
  SET_NODES = 'SET',
  EXPAND_NODE = 'EXPAND',
  ADD_NODE = 'ADD',
  REMOVE_NODE = 'REMOVE',
  UPDATE_NODE = 'UPDATE',
  SELECT_NODE = 'SELECT'
}

export type SetNodesAction = {
  type: NodeDataActionTypes.SET_NODES;
  payload: TreeViewNodeData;
};

export type ExpandNodeAction = {
  type: NodeDataActionTypes.EXPAND_NODE;
  payload: {
    id: string;
    expand: boolean;
  }
};

export type AddNodeAction = {
  type: NodeDataActionTypes.ADD_NODE;
  payload: {
    parentId: string;
    newNode: TreeViewNodeData;
  }
}

export type RemoveNodeAction = {
  type: NodeDataActionTypes.REMOVE_NODE;
  id: string;
}

export type UpdateNodeAction = {
  type: NodeDataActionTypes.UPDATE_NODE;
  newNode: TreeViewNodeData;
}

export type SelectNodeAction = {
  type: NodeDataActionTypes.SELECT_NODE;
  payload: {
    id: string;
    selected: boolean;
  }
}

export type TreeNodeActions =
  SetNodesAction
  | ExpandNodeAction
  | AddNodeAction
  | SelectNodeAction;

