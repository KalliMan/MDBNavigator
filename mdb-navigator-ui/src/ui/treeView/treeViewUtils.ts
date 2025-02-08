import { TreeViewNodeData } from "./TreeViewNodeData";

export function findFirstParentOfType(node: TreeViewNodeData, type: string): TreeViewNodeData | undefined {
  if (!node) {
    return undefined;
  }

  if (node.type === type) {
    return node;
  }

  if (!node.parentNode) {
    return undefined;
  }

  const result = findFirstParentOfType(node.parentNode, type);
  if (result) {
    return result;
  }

  return undefined;
}

export function findNodeOfType(node: TreeViewNodeData, type: string): TreeViewNodeData | undefined {
  if (!node) {
    return undefined;
  }

  if (node.type === type) {
    return node;
  }

  if (!node.nodes) {
    return undefined;
  }

  for(const child of node.nodes) {
    const result = findNodeOfType(child, type);
    if (result) {
      return result;
    }
  }

  return undefined;
}

export function expandNode(root: TreeViewNodeData, id: string, expand: boolean): void {
  const node = findNode(root, id);
  if (node) {
    node.isExpanded = expand;
  }
}

export function findNode(root: TreeViewNodeData, id: string): TreeViewNodeData | null {
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

export function addNode(nodeData: TreeViewNodeData, parentId: string, newNode: TreeViewNodeData): TreeViewNodeData {

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