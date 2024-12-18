import { TreeViewNodeData } from "./TreeViewNodeData";

export function findFirstParentOfType(node: TreeViewNodeData, type: string): TreeViewNodeData | null {
  if (!node) {
    return null;
  }

  if (node.type === type) {
    return node;
  }

  if (!node.parentNode) {
    return null;
  }

  const result = findFirstParentOfType(node.parentNode, type);
  if (result) {
    return result;
  }

  return null;
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