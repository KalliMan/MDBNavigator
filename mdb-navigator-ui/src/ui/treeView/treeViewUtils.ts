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

export function findSelectedNode(root: TreeViewNodeData): TreeViewNodeData | null {
  if (root.isSelected) {
    return root;
  }

  if (!root.nodes?.length) {
    return null;
  }

  for(const node of root.nodes) {
    const result = findSelectedNode(node);
    if (result) {
      return result;
    }
  }
  return null;
}
