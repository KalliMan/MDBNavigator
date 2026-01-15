import { FaHdd, FaServer } from "react-icons/fa";
import { TreeViewNodeData } from "../../ui/treeView/TreeViewNodeData";
import { FcDatabase, FcFolder, FcOpenedFolder } from "react-icons/fc";
import { NodeType } from "./NodeType";
import { v4 as uuidv4 } from 'uuid';
import { FaTable } from "react-icons/fa6";
import { PiBracketsCurly } from "react-icons/pi";
import { LuSquareFunction } from "react-icons/lu";
import { findFirstParentOfType, findNodeOfType } from "../../ui/treeView/treeViewUtils";
import { DatabaseSchema } from "../../contexts/databaseSchema/DatabaseSchemaReducer";

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

export function createServersNode(isExpanded: boolean): TreeViewNodeData {
  return {
    id: uuidv4(),
    nodeName: 'Servers',
    isExpanded: isExpanded,
    Icon: <FaServer />,
    nodes: [],
    type: NodeType.Servers,
  };
}

export function createServerNode(id: string, name: string, isExpanded: boolean): TreeViewNodeData {
  return {
    id: id,
    nodeName: name,
    isExpanded: isExpanded,
    Icon: <FaHdd />,
    nodes: [],
    type: NodeType.Server,
  };
}

export function createDatabasesFolderNode(parentNode: TreeViewNodeData, isExpanded: boolean): TreeViewNodeData {
  return {
    id: uuidv4(),
    nodeName: 'Databases',
    isExpanded: isExpanded,
    Icon: <FcFolder />,
    IconExpanded: <FcOpenedFolder />,
    nodes: [],
    type: NodeType.Databases,
    parentNode
  };
}

export function createDatabaseNode(name: string, parentNode: TreeViewNodeData, isExpanded: boolean): TreeViewNodeData {

  const dbNode: TreeViewNodeData = {
    id: name,
    nodeName: name,
    Icon: <FcDatabase />,
    IconExpanded: <FcDatabase />,
    isExpanded: isExpanded,
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

  result.nodes!.push(createLoaderNode(result));
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

  result.nodes!.push(createLoaderNode(result));
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

  result.nodes!.push(createLoaderNode(result));
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

export function getServerNodeFromServersNode(serversNode: TreeViewNodeData, id: string): TreeViewNodeData | undefined {
  if (serversNode?.nodes?.length) {
    return serversNode.nodes.find(node => node.id === id);
  }

  return undefined;
}

export function getDatabaseNodeFromServerNode(serverNode: TreeViewNodeData, databaseName: string): TreeViewNodeData | undefined {
  if (serverNode?.nodes?.length) {
    const databasesNode = serverNode.nodes[0];
    return databasesNode?.nodes?.find(node => node.nodeName === databaseName);
  }

  return undefined;
}

export function getServerNodeFromDatabaseNode(databaseNode: TreeViewNodeData): TreeViewNodeData | undefined {
  return findFirstParentOfType(databaseNode, NodeType.Server);
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

export function getNodeHierarchy(targetNode: TreeViewNodeData | undefined) {
  if (!targetNode) {
    return null;
  }

  const databaseNode = getDatabaseParentNode(targetNode);
  const serverNode = getServerNodeFromDatabaseNode(databaseNode!);

  if (!databaseNode || !serverNode) {
    return null;
  }

  return { databaseNode, serverNode };
}

export function updateTablesForSchema(root: TreeViewNodeData, schema: DatabaseSchema) {
  const serverNode = getServerNodeFromServersNode(root, schema.connectionId);
  if (!serverNode) {
    return;
  }

  const databaseNode = getDatabaseNodeFromServerNode(serverNode, schema.lastUpdatedDatabaseName || '');
  if (!databaseNode) {
    return;
  }

  const tablesFoldersNode = getTablesFolderNode(databaseNode);
  if (!tablesFoldersNode) {
    return;
  }

  const database = schema.databasesDetails?.databases.find(db => db.name === schema.lastUpdatedDatabaseName);
  if (!database) {
    return;
  }

  tablesFoldersNode.nodes = database.tablesDetails?.tables?.map(t =>
    createTableNode(t.databaseSchema, t.name, tablesFoldersNode)
  ) || [];
}

export function updateStoredProceduresForSchema(root: TreeViewNodeData, schema: DatabaseSchema) {
  const serverNode = getServerNodeFromServersNode(root, schema.connectionId);
  if (!serverNode) {
    return;
  }

  const databaseNode = getDatabaseNodeFromServerNode(serverNode, schema.lastUpdatedDatabaseName || '');
  if (!databaseNode) {
    return;
  }

  const storedproceduresFoldersNode = getStoredProceduresNode(databaseNode);
  if (!storedproceduresFoldersNode) {
    return;
  }

  const database = schema.databasesDetails?.databases.find(db => db.name === schema.lastUpdatedDatabaseName);
  if (!database) {
    return;
  }

  storedproceduresFoldersNode.nodes = database.storedProceduresDetails?.procedures?.map(t =>
    createStoredProcedureNode(t.databaseSchema, t.name, storedproceduresFoldersNode)
  ) || [];
}

export function updateFunctionsForSchema(root: TreeViewNodeData, schema: DatabaseSchema) {
  const serverNode = getServerNodeFromServersNode(root, schema.connectionId);
  if (!serverNode) {
    return;
  }

  const databaseNode = getDatabaseNodeFromServerNode(serverNode, schema.lastUpdatedDatabaseName || '');
  if (!databaseNode) {
    return;
  }

  const functionsFoldersNode = getFunctionsNode(databaseNode);
  if (!functionsFoldersNode) {
    return;
  }

  const database = schema.databasesDetails?.databases.find(db => db.name === schema.lastUpdatedDatabaseName);
  if (!database) {
    return;
  }

  functionsFoldersNode.nodes = database.functionsDetails?.procedures?.map(t =>
    createFunctionNode(t.databaseSchema, t.name, functionsFoldersNode)
  ) || [];
}