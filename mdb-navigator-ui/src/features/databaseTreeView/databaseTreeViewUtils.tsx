import { FaHdd, FaServer } from "react-icons/fa";
import { TreeViewNodeData } from "../../ui/treeView/TreeViewNodeData";
import { FcDatabase, FcFolder, FcOpenedFolder } from "react-icons/fc";
import { MdErrorOutline } from "react-icons/md";
import { NodeType } from "./NodeType";
import { v4 as uuidv4 } from "uuid";
import { FaTable } from "react-icons/fa6";
import { PiBracketsCurly, PiSelectionForegroundBold } from "react-icons/pi";
import { LuSquareFunction } from "react-icons/lu";
import { findFirstParentOfType, findNodeOfType } from "../../ui/treeView/treeViewUtils";
import { TbColumns1 } from "react-icons/tb";

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

export function createErrorNode(parentNode: TreeViewNodeData, message: string): TreeViewNodeData {
  return {
    id: `${parentNode.id}::error`,
    nodeName: message,
    isExpanded: false,
    nodes: [],
    type: NodeType.Error,
    className: "text-red-600 dark:text-red-400",
    Icon: <MdErrorOutline />,
    parentNode,
  };
}

export function createServersNode(isExpanded: boolean): TreeViewNodeData {
  return {
    id: "servers-root",
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
    nodeText: name,
    isExpanded: isExpanded,
    Icon: <FaHdd />,
    nodes: [],
    type: NodeType.Server,
  };
}

export function createDatabasesFolderNode(parentNode: TreeViewNodeData, isExpanded: boolean): TreeViewNodeData {
  return {
    id: `${parentNode.id}::databases`,
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
    id: `${parentNode.id}::db::${name}`,
    nodeName: name,
    nodeText: name,
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
    id: `${parentNode.id}::tables`,
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

export function createTableNode(databaseSchema: string, name: string, parentNode: TreeViewNodeData, createDefinitionLoaderNode: boolean): TreeViewNodeData {
  const result: TreeViewNodeData = {
    id: `${parentNode.id}::table::${databaseSchema}::${name}`,
    nodeName: name,
    nodeText: `${databaseSchema}.${name}`,
    isExpanded: false,
    Icon: <FaTable />,
    nodes: [],
    type: NodeType.Table,
    metaData: databaseSchema,
    parentNode
  };

  if (createDefinitionLoaderNode) {
    result.nodes!.push(createLoaderNode(result));
  }

  return result;
}

export function createTableColumnsFolderNode(parentNode: TreeViewNodeData): TreeViewNodeData {
  return {
    id: `${parentNode.id}::columns`,
    nodeName: 'Columns',
    isExpanded: false,
    Icon: <FcFolder />,
    IconExpanded: <FcOpenedFolder />,
    nodes: [],
    type: NodeType.TableColumns,
    parentNode
  };
}

export function createTableColumnNode(columnName: string, dataType: string, maxLength: number | undefined, isNullable: boolean, parentMetaData: object,  parentNode: TreeViewNodeData): TreeViewNodeData {
  const typeText = `${dataType}` + (maxLength ? `(${maxLength})` : '');
  const nullText = isNullable ? ' (NULL)' : ' (NOT NULL)';
  const nodeText = `${columnName}: ${typeText}${nullText}`;

  const nodeTextElement = (
    <>
      <strong>{columnName}</strong>
      {": "}
      <span style={{ color: "blue" }}>{typeText}</span>
      <span>{nullText}</span>
    </>
  );

  return {
    id: `${parentNode.id}::column::${columnName}`,
    nodeName: columnName,
    nodeText: nodeText,
    nodeTextElement,
    isExpanded: false,
    Icon: <TbColumns1 />,
    nodes: [],
    type: NodeType.TableColumn,
    metaData: JSON.stringify(parentMetaData),
    parentNode
  };
}

export function createTableIndexesFolderNode(parentNode: TreeViewNodeData): TreeViewNodeData {
  return {
    id: `${parentNode.id}::indexes`,
    nodeName: 'Indexes',
    isExpanded: false,
    Icon: <FcFolder />,
    IconExpanded: <FcOpenedFolder />,
    nodes: [],
    type: NodeType.TableIndexes,
    parentNode
  };
}

export function createProgrammabilityFoldersNode(parentNode: TreeViewNodeData): TreeViewNodeData {
  const result: TreeViewNodeData = {
    id: `${parentNode.id}::programmability`,
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
  result.nodes!.push(createViewsNode(result));
  return result;
}

function createStoredProceduresFoldersNode(parentNode: TreeViewNodeData): TreeViewNodeData {
  const result: TreeViewNodeData = {
    id: `${parentNode.id}::stored-procedures`,
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
    nodeText: `${databaseSchema}.${name}`,
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
    id: `${parentNode.id}::functions`,
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
    nodeText: `${databaseSchema}.${name}`,
    isExpanded: true,
    Icon: <LuSquareFunction />,
    nodes: [],
    type: NodeType.Function,
    metaData: databaseSchema,
    parentNode
  };
}

export function createViewsNode(parentNode: TreeViewNodeData): TreeViewNodeData {
  const result: TreeViewNodeData = {
    id: `${parentNode.id}::views`,
    nodeName: 'Views',
    isExpanded: false,
    Icon: <FcFolder />,
    IconExpanded: <FcOpenedFolder />,
    nodes: [],
    type: NodeType.Views,
    parentNode
  };
  result.nodes!.push(createLoaderNode(result));
  return result;
}

export function createViewNode(databaseSchema: string, name: string, parentNode: TreeViewNodeData): TreeViewNodeData {
  return {
    id: uuidv4(),
    nodeName: name,
    nodeText: `${databaseSchema}.${name}`,
    isExpanded: true,
    Icon: <PiSelectionForegroundBold />,
    nodes: [],
    type: NodeType.View,
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

export function getViewsFolderNode(databaseNode: TreeViewNodeData): TreeViewNodeData | undefined {
  return findNodeOfType(databaseNode, NodeType.Views);
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
