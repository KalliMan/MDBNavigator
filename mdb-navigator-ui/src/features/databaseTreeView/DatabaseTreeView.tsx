import { useCallback, useState } from "react";
import TreeView from "../../ui/treeView/TreeView"
import { TreeViewNodeData } from "../../ui/treeView/TreeViewNodeData"
import { getDatabaseParentNode, getNodeHierarchy, getServerNodeFromDatabaseNode, hasLoaderNode } from "./databaseTreeViewUtils";
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
import useDatabaseTreeState from "./useDatabaseTreeState";


export default function DatabaseTreeView() {
  const { databaseServerConnections, connectNewDatabase, disconnect } = useDatabaseConnectContext();

  const {
    databaseSchemas,
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

  const { root } = useDatabaseTreeState(databaseSchemas, databaseServerConnections);

  const [contextMenuTarget, setContextMenuTarget] = useState(EmptyPosition);
  const [currentNode, setCurrentNode] = useState<TreeViewNodeData>();

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
