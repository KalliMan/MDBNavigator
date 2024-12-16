import { NodeData } from "./TreeViewNodeData";

export enum NodeDataActionTypes {
  SET_NODES = 'SET',
  EXPAND_NODE = 'EXPAND',
  ADD_NODE = 'ADD',
  REMOVE_NODE = 'REMOVE',
  UPDATE_NODE = 'UPDATE'
}

export type SetNodesAction = {
  type: NodeDataActionTypes.SET_NODES;
  payload: NodeData;
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
    newNode: NodeData;
  }
}

export type RemoveNodeAction = {
  type: NodeDataActionTypes.REMOVE_NODE;
  id: string;
}

export type UpdateNodeAction = {
  type: NodeDataActionTypes.UPDATE_NODE;
  newNode: NodeData;
}

export type TreeNodeActions =
  SetNodesAction
  | ExpandNodeAction
  | AddNodeAction

