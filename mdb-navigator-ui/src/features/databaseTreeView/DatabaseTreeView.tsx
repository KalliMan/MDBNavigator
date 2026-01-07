import { useCallback, useEffect, useState } from "react";
import TreeView from "../../ui/treeView/TreeView"
import { TreeViewNodeData } from "../../ui/treeView/TreeViewNodeData"
import {
  createDatabaseNode,
  createDatabasesFolderNode,
  createFunctionNode,
  createServerNode,
  createServersNode,
  createStoredProcedureNode,
  createTableNode,
  getDatabaseNodeFromServerNode,
  getDatabaseParentNode,
  getFunctionsNode,
  getNodeHierarchy,
  getServerNodeFromDatabaseNode,
  getServerNodeFromServersNode,
  getStoredProceduresNode,
  getTablesFolderNode,
  hasLoaderNode
} from "./databaseTreeViewUtils";
import { findNode } from "../../ui/treeView/treeViewUtils";
import { NodeType } from "./NodeType";
import { CoordPosition, EmptyPosition } from "../../types/coordPosition";
import Menus from "../../ui/contextMenu/Menus";
import { PiRows } from "react-icons/pi";
import useDatabaseConnectContext from "../../contexts/databaseServerConnect/useDatabaseServerConnect";
import useDatabaseSchemaContext from "../../contexts/databaseSchema/useDatabaseSchema";
import { BsFiletypeSql } from "react-icons/bs";
import useCommandQueryContext from "../../contexts/commandQuery/useDatabaseCommand";
import { TiDelete } from "react-icons/ti";
import { GrRefresh, GrTableAdd } from "react-icons/gr";


function DatabaseTreeView() {
  const { databaseServerConnections, connectNewDatabase, disconnect } = useDatabaseConnectContext();

  const {
    databaseSchemas,
    fetchDatabases,
    fetchTables,
    fetchStoredProcedures,
    fetchFunctions
  } = useDatabaseSchemaContext()

  const {
    queryCommandGetTopNTableRecords,
    queryForDatabase,
    queryCommandProcedureDefinition,
    queryCommandCreateTableScript,
    queryCommandDropTableScript
  } = useCommandQueryContext();

  const [root, setRoot] = useState<TreeViewNodeData | null>();
  const [contextMenuTarget, setContextMenuTarget] = useState(EmptyPosition);
  const [currentNode, setCurrentNode] = useState<TreeViewNodeData>();

  // Initial Servers load
  useEffect(() => {
    async function getServers() {

      const isConnectedToDB = databaseServerConnections && databaseServerConnections.length > 0;
      if (databaseSchemas && isConnectedToDB) {

        const connectedResult =
          databaseServerConnections.filter(c => root
            ? !getServerNodeFromServersNode(root, c.connectedResult?.connectionId || '')
            : true)[0]?.connectedResult;

        if (connectedResult) {
          const serversNode = root ? {...root} : createServersNode(true);

          const serverNode = createServerNode(connectedResult.connectionId, connectedResult.serverName, true);
          serversNode.nodes!.push(serverNode);

          setRoot(serversNode);
        }
      }
    }

    getServers();

  }, [fetchDatabases, databaseSchemas, root, databaseServerConnections]);

  // Databases refresh
  useEffect(() => {

    if (!root) {
      return;
    }

    const databaseSchemasForRresh = databaseSchemas?.filter(s => s.refreshDatabases);
    if(!databaseSchemasForRresh?.length) {
      return;
    }

    const newRoot = { ...root };
    databaseSchemasForRresh.forEach(schema => {

      schema.refreshDatabases = false;
      const serverNode = getServerNodeFromServersNode(newRoot!, schema.connectionId);
      if (!serverNode) {
        return;
      }

      const databaseFolderNodes = createDatabasesFolderNode(serverNode, true);
      serverNode.nodes = [];
      serverNode.nodes = [databaseFolderNodes];

      schema.databasesDetails?.databases?.forEach(db => databaseFolderNodes.nodes?.push(createDatabaseNode(db.name, databaseFolderNodes, true)));
    });

    setRoot(newRoot);
  }, [root, databaseSchemas]);

  // disconnect server
  useEffect(() => {
    if (!root) {
      return;
    }
    const connectedServerIds = databaseServerConnections.map(c => c.connectedResult?.connectionId);
    const newRoot = { ...root };
    let hasChanges = false;
    newRoot.nodes = newRoot.nodes!.filter(serverNode => {
      if (serverNode.type === NodeType.Server) {
        if (!connectedServerIds.includes(serverNode.id)) {
          hasChanges = true;
          return false;
        }
      }
      return true;
    });

    if (hasChanges) {
      setRoot(newRoot);
    }
  }, [databaseServerConnections, root]);

  // Tables refresh
  useEffect(() => {
    if (!root) {
      return;
    }

    const databaseSchemasForRresh = databaseSchemas?.filter(s => s.refreshTables);
    if (!databaseSchemasForRresh?.length) {
      return;
    }

    const newRoot = { ...root };
    databaseSchemasForRresh.forEach(schema => {
      schema.refreshTables = false;

      const serverNode = getServerNodeFromServersNode(newRoot!, schema.connectionId);
      if (!serverNode) {
        return;
      }

      const databaseNode = getDatabaseNodeFromServerNode(serverNode!, schema.lastUpdatedDatabaseName || '');
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

      tablesFoldersNode.nodes = [];
      tablesFoldersNode.nodes = database.tablesDetails?.tables?.map(t =>
        createTableNode(t.databaseSchema, t.name, tablesFoldersNode)
      ) || [];
    });

    setRoot(newRoot);

  }, [databaseSchemas, root]);


  // SP Refresh
  useEffect(() => {
    if (!root) {
      return;
    }

    const databaseSchemasForRresh = databaseSchemas?.filter(s => s.refreshStoredProcedures);
    if (!databaseSchemasForRresh?.length) {
      return;
    }

    const newRoot = { ...root };
    databaseSchemasForRresh.forEach(schema => {
      schema.refreshStoredProcedures = false;

      const serverNode = getServerNodeFromServersNode(newRoot!, schema.connectionId);
      if (!serverNode) {
        return;
      }

      const databaseNode = getDatabaseNodeFromServerNode(serverNode!, schema.lastUpdatedDatabaseName || '');
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

      storedproceduresFoldersNode.nodes = [];
      storedproceduresFoldersNode.nodes = database.storedProceduresDetails?.procedures?.map(t =>
        createStoredProcedureNode(t.databaseSchema, t.name, storedproceduresFoldersNode)
      ) || [];

    });

    setRoot(newRoot);

  }, [databaseSchemas, root]);

  // Functions refresh
  useEffect(() => {
     if (!root) {
      return;
    }

    const databaseSchemasForRresh = databaseSchemas?.filter(s => s.refreshFunctions);
    if (!databaseSchemasForRresh?.length) {
      return;
    }

    const newRoot = { ...root };
    databaseSchemasForRresh.forEach(schema => {
      schema.refreshFunctions = false;

      const serverNode = getServerNodeFromServersNode(newRoot!, schema.connectionId);
      if (!serverNode) {
        return;
      }

      const databaseNode = getDatabaseNodeFromServerNode(serverNode!, schema.lastUpdatedDatabaseName || '');
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

      functionsFoldersNode.nodes = [];
      functionsFoldersNode.nodes = database.functionsDetails?.procedures?.map(t =>
        createFunctionNode(t.databaseSchema, t.name, functionsFoldersNode)
      ) || [];
    });

    setRoot(newRoot);

  }, [databaseSchemas, root]);

  function handleOnNodeClick(node: TreeViewNodeData, e: CoordPosition) {
    setCurrentNode(node);
    setContextMenuTarget(e);
  }

  async function handleExpand(id: string, expanded: boolean) {
    if (!root) {
      return;
    }

    const targetNode = findNode(root, id);
    if (targetNode && expanded) {
      if (hasLoaderNode(targetNode)) {
        const databaseNode = getDatabaseParentNode(targetNode);
        const serverNode = getServerNodeFromDatabaseNode(databaseNode!);

        if (databaseNode && serverNode) {
          switch (targetNode.type) {
          case NodeType.Tables:
            await fetchTables(serverNode.id, databaseNode.nodeName);
            break;
          case NodeType.StoredProcedures:
            await fetchStoredProcedures(serverNode.id, databaseNode.nodeName);
            break;
          case NodeType.Functions:
            await fetchFunctions(serverNode.id, databaseNode.nodeName);
            break;
          default:
            break;
          }
        }
      }
    }
  }


  function handleNewServerConnection(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);

    if (targetNode) {
      connectNewDatabase();
    }
  }

  function handleDisconnect(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    if (targetNode) {
      disconnect(targetNode.id);
    }
  }

  async function handleNewQueryForDatabase(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);

    if (targetNode) {
      const serverNode = getServerNodeFromDatabaseNode(targetNode!);

      if (serverNode) {
        await queryForDatabase(serverNode?.id, targetNode.nodeName, targetNode?.metaData || "");
      }
    }
  }

  async function handleSelectTop100Records(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    await selectTopNRecords(targetNode, 1000);
  }

  async function handleSelectAllRecords(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    await selectTopNRecords(targetNode, -1);
  }

  async function selectTopNRecords(targetNode: TreeViewNodeData | undefined, recordsNumber: number) {
    if (!targetNode) {
      return;
    }

    const nodes = getNodeHierarchy(targetNode);
    if (nodes) {
      await queryCommandGetTopNTableRecords(
        nodes.serverNode?.id || "",
        nodes.databaseNode.nodeName,
        targetNode.metaData || "",
        targetNode.nodeName || "",
        recordsNumber
      );
    }
  }

  async function handleNewQueryForTables(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);

    if (!targetNode) {
      return;
    }

    const nodes = getNodeHierarchy(targetNode);
    if (nodes) {
      await queryForDatabase(
        nodes.serverNode?.id,
        nodes.databaseNode.nodeName,
        targetNode.metaData || ""
      );
    }
  }

  async function handleQueryProcedureDefinition(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    const nodes = getNodeHierarchy(targetNode);
    if (nodes && targetNode) {
      await queryCommandProcedureDefinition(
        nodes.serverNode.id,
        nodes.databaseNode.nodeName,
        targetNode?.metaData || "",
        targetNode?.nodeName
      );
    }
  }

  async function handleRefreshProcedures(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    const nodes = getNodeHierarchy(targetNode);
    if (nodes) {
      await fetchStoredProcedures(
        nodes.serverNode.id,
        nodes.databaseNode.nodeName
      );
    }
  }

  async function handleRefreshFunctions(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    const nodes = getNodeHierarchy(targetNode);
    if (nodes) {
      await fetchFunctions(nodes.serverNode.id, nodes.databaseNode.nodeName);
    }
  }

  async function handleCreateNewTable(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    const nodes = getNodeHierarchy(targetNode);
    if (nodes) {
      await queryCommandCreateTableScript(
        nodes.serverNode.id,
        nodes.databaseNode.nodeName
      );
    }
  }

  async function handleRefreshTables(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    const nodes = getNodeHierarchy(targetNode);
    if (nodes) {
      await fetchTables(nodes.serverNode.id, nodes.databaseNode.nodeName);
    }
  }

  async function handleDeleteTable(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);

    if (!targetNode) {
      return;
    }

    const nodes = getNodeHierarchy(targetNode);
    if (nodes) {
      queryCommandDropTableScript(
        nodes.serverNode.id,
        nodes.databaseNode.nodeName,
        targetNode.metaData || "",
        targetNode.nodeName
      );
    }
  }

  const handleCloseContextMenu = useCallback(() => {
    setContextMenuTarget(EmptyPosition);
  }, []);


  if (!root) {
    return null;
  }

  const currentNodeType = currentNode?.type as NodeType;

  return (<>
    <TreeView root={root} onNodeClick={handleOnNodeClick} onExpand={handleExpand}/>

    <Menus targetPosition={contextMenuTarget} id="DatabaseMenu" clickedOutside={handleCloseContextMenu}>
      {currentNodeType === NodeType.Servers && (<>
          <Menus.MenuItem icon={<BsFiletypeSql />} onClick={() => handleNewServerConnection(currentNode)}>New Connection</Menus.MenuItem>
        </>
      )}

      {currentNodeType === NodeType.Server && (<>
          <Menus.MenuItem icon={<BsFiletypeSql />} onClick={() => handleDisconnect(currentNode)}>Disconnect</Menus.MenuItem>
        </>
      )}

      {currentNodeType === NodeType.Database && (<>
          <Menus.MenuItem icon={<BsFiletypeSql />} onClick={() => handleNewQueryForDatabase(currentNode)}>New Query for this database</Menus.MenuItem>
        </>
      )}

      {currentNodeType === NodeType.Tables && (<>
          <Menus.MenuItem icon={<GrTableAdd />} onClick={() => handleCreateNewTable(currentNode)}>Create New Table</Menus.MenuItem>
          <Menus.MenuItem icon={<BsFiletypeSql />} onClick={() => handleNewQueryForTables(currentNode)}>New Query for this database</Menus.MenuItem>
          <Menus.MenuItem icon={<GrRefresh />} onClick={() => handleRefreshTables(currentNode)}>Refresh</Menus.MenuItem>
        </>
      )}
      {currentNodeType === NodeType.Table && (<>
          <Menus.MenuItem icon={<PiRows />} onClick={() => handleSelectTop100Records(currentNode)}>Select TOP 100 Records</Menus.MenuItem>
          <Menus.MenuItem icon={<PiRows />} onClick={() => handleSelectAllRecords(currentNode)}>Select All Records</Menus.MenuItem>
          <Menus.MenuItem icon={<TiDelete />} onClick={() => handleDeleteTable(currentNode)}>Delete Table</Menus.MenuItem>
        </>
      )}

      {currentNodeType === NodeType.StoredProcedures && (<>
          <Menus.MenuItem icon={<GrRefresh />} onClick={() => handleRefreshProcedures(currentNode)}>Refresh</Menus.MenuItem>
        </>
      )}

      {currentNodeType === NodeType.Functions && (<>
          <Menus.MenuItem icon={<GrRefresh />} onClick={() => handleRefreshFunctions(currentNode)}>Refresh</Menus.MenuItem>
        </>
      )}

      { ([NodeType.StoredProcedure, NodeType.Function].some(t => t === currentNodeType)) && (<>
          <Menus.MenuItem icon={<BsFiletypeSql />} onClick={() => handleQueryProcedureDefinition(currentNode)}>Query Definition</Menus.MenuItem>
        </>
      )}
    </Menus>
  </>)
}

export default DatabaseTreeView
