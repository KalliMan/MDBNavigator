import { FaServer } from "react-icons/fa";
import { TreeViewNodeData } from "../../ui/treeView/TreeViewNodeData";
import { FcDatabase, FcFolder, FcOpenedFolder } from "react-icons/fc";
import { NodeType } from "./NodeType";
import { v4 as uuidv4 } from 'uuid';
import { FaTable } from "react-icons/fa6";
import { PiBracketsCurly } from "react-icons/pi";
import { LuSquareFunction } from "react-icons/lu";
import { findFirstParentOfType, findNodeOfType } from "../../ui/treeView/treeViewUtils";

export function createLoaderNode(parentNode: TreeViewNodeData): TreeViewNodeData {
  return {
    id: uuidv4(),
    nodeName: 'Loading...',
    isExpanded: false,
    nodes: [],
    type: NodeType.Loader,
    className:'z-order-0 z-0',
    parentNode
  };
}

export function createServerNode(name: string): TreeViewNodeData {
  return {
    id: name,
    nodeName: name,
    isExpanded: false,
    Icon: <FaServer />,
    nodes: [],
    type: NodeType.Server,
  };
}

export function createDatabasesFolderNode(parentNode: TreeViewNodeData): TreeViewNodeData {
  return {
    id: uuidv4(),
    nodeName: 'Databases',
    isExpanded: false,
    Icon: <FcFolder />,
    IconExpanded: <FcOpenedFolder />,
    nodes: [],
    type: NodeType.Databases,
    parentNode
  };
}

export function createDatabaseNode(name: string, parentNode: TreeViewNodeData): TreeViewNodeData {

  const dbNode: TreeViewNodeData = {
    id: name,
    nodeName: name,
    Icon: <FcDatabase />,
    IconExpanded: <FcDatabase />,
    isExpanded: false,
    nodes: [],
    type: NodeType.Database,
    parentNode
  };

  const tableFoldersNode = createTableFoldersNode(dbNode);
  const programmability = createProgrammabilityFoldersNode(dbNode);
  dbNode.nodes!.push(tableFoldersNode, programmability);

  return dbNode;
}

function createTableFoldersNode(parentNode: TreeViewNodeData): TreeViewNodeData {
  const result: TreeViewNodeData = {
    id: uuidv4(),
    nodeName: 'Tables',
    isExpanded: false,
    Icon: <FcFolder />,
    IconExpanded: <FcOpenedFolder />,
    nodes: [],
    type: NodeType.Tables,
    parentNode
  };

//  result.nodes!.push(createLoaderNode(result));
  return result;
}

export function createTableNode(databaseSchema: string, name: string, parentNode: TreeViewNodeData): TreeViewNodeData {
  return {
    id: uuidv4(),
    nodeName: name,
    isExpanded: true,
    Icon: <FaTable />,
    nodes: [],
    type: NodeType.Table,
    metaData: databaseSchema,
    parentNode
  };
}

export function createProgrammabilityFoldersNode(parentNode: TreeViewNodeData): TreeViewNodeData {
  const result: TreeViewNodeData = {
    id: uuidv4(),
    nodeName: 'Programability',
    isExpanded: false,
    Icon: <FcFolder />,
    IconExpanded: <FcOpenedFolder />,
    nodes: [],
    type: NodeType.Programability,
    parentNode
  };

  result.nodes!.push(createStoredProceduresFoldersNode(result));
  result.nodes!.push(createFunctionsFoldersNode(result));
  return result;
}

function createStoredProceduresFoldersNode(parentNode: TreeViewNodeData): TreeViewNodeData {
  const result: TreeViewNodeData = {
    id: uuidv4(),
    nodeName: 'Stored Procedures',
    isExpanded: false,
    Icon: <FcFolder />,
    IconExpanded: <FcOpenedFolder />,
    nodes: [],
    type: NodeType.StoredProcedures,
    parentNode
  };

//  result.nodes!.push(createLoaderNode(result));
  return result;
}

export function createStoredProcedureNode(databaseSchema: string, name: string, parentNode: TreeViewNodeData): TreeViewNodeData {
  return {
    id: uuidv4(),
    nodeName: name,
    isExpanded: true,
    Icon: <PiBracketsCurly />,
    nodes: [],
    type: NodeType.StoredProcedure,
    metaData: databaseSchema,
    parentNode
  };
}

function createFunctionsFoldersNode(parentNode: TreeViewNodeData): TreeViewNodeData {
  const result: TreeViewNodeData = {
    id: uuidv4(),
    nodeName: 'Functions',
    isExpanded: false,
    Icon: <FcFolder />,
    IconExpanded: <FcOpenedFolder />,
    nodes: [],
    type: NodeType.Functions,
    parentNode
  };

//  result.nodes!.push(createLoaderNode(result));
  return result;
}

export function createFunctionNode(databaseSchema: string, name: string, parentNode: TreeViewNodeData): TreeViewNodeData {
  return {
    id: uuidv4(),
    nodeName: name,
    isExpanded: true,
    Icon: <LuSquareFunction />,
    nodes: [],
    type: NodeType.Function,
    metaData: databaseSchema,
    parentNode
  };
}


export function hasLoaderNode(databaseNode: TreeViewNodeData): boolean {
  return databaseNode?.nodes?.length === 1 && databaseNode?.nodes?.[0].type === NodeType.Loader;
}


export function getDatabaseNodeFromServerNode(serverNode: TreeViewNodeData, databaseName: string): TreeViewNodeData | undefined {
  if (serverNode?.nodes?.length) {
    const databasesNode = serverNode.nodes[0];
    return databasesNode?.nodes?.find(node => node.nodeName === databaseName);
  }

  return undefined;
}

export function getDatabaseParentNode(targetNode: TreeViewNodeData): TreeViewNodeData | undefined {
  return findFirstParentOfType(targetNode, NodeType.Database);
}

export function getTablesFolderNode(databaseNode: TreeViewNodeData): TreeViewNodeData | undefined {
  return databaseNode?.nodes?.find(node => node.type === NodeType.Tables);
}

export function getStoredProceduresNode(databaseNode: TreeViewNodeData): TreeViewNodeData | undefined {
  return findNodeOfType(databaseNode, NodeType.StoredProcedures);
}

export function getFunctionsNode(databaseNode: TreeViewNodeData): TreeViewNodeData | undefined {
  return findNodeOfType(databaseNode, NodeType.Functions);
}