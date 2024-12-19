import { FaServer } from "react-icons/fa";
import { TreeViewNodeData } from "../../ui/treeView/TreeViewNodeData";
import { FcDatabase, FcFolder, FcOpenedFolder } from "react-icons/fc";
import { NodeType } from "./NodeType";
import { v4 as uuidv4 } from 'uuid';
import { FaTable } from "react-icons/fa6";


export function createLoaderNode(parentNode: TreeViewNodeData): TreeViewNodeData {
  return {
    id: uuidv4(),
    nodeName: 'Loading...',
    isExpanded: false,
    nodes: [],
    type: NodeType.Loader,
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

  result.nodes!.push(createLoaderNode(result));
  return result;
}

export function hasLoaderNode(databaseNode: TreeViewNodeData): boolean {
  return databaseNode?.nodes?.length === 1 && databaseNode?.nodes?.[0].type === NodeType.Loader;
}

export function getDatabaseNode(serverNode: TreeViewNodeData, databaseName: string): TreeViewNodeData | undefined {
//  const targetServerNode = serverNodes.find(node => node.nodeName === serverName);
  if (serverNode?.nodes?.length) {
    const databasesNode = serverNode.nodes[0];
    return databasesNode?.nodes?.find(node => node.nodeName === databaseName);
  }

  return undefined;
}

export function getTablesFolderNode(databaseNode: TreeViewNodeData): TreeViewNodeData | undefined {
  return databaseNode?.nodes?.find(node => node.type === NodeType.Tables);
}