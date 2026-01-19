import { useCallback } from "react";
import { TreeViewNodeData } from "../../ui/treeView/TreeViewNodeData";
import { CoordPosition, EmptyPosition } from "../../types/coordPosition";
import { findNode } from "../../ui/treeView/treeViewUtils";
import { getDatabaseParentNode, getNodeHierarchy, getServerNodeFromDatabaseNode, hasLoaderNode } from "./databaseTreeViewUtils";
import { NodeType } from "./NodeType";
import useDatabaseSchemaContext from "../../contexts/databaseSchema/useDatabaseSchema";
import useCommandQueryContext from "../../contexts/commandQuery/useDatabaseCommand";
import useDatabaseConnectContext from "../../contexts/databaseServerConnect/useDatabaseServerConnect";

interface UseContextMenuHandlersProps {
  root: TreeViewNodeData | null;
  setContextMenuTarget: (target: CoordPosition) => void;
  setCurrentNode: (node: TreeViewNodeData | undefined) => void;
}

export default function useContextMenuHandlers({
  root,
  setContextMenuTarget,
  setCurrentNode,
}: UseContextMenuHandlersProps) {

  const {
    connectNewDatabase,
    disconnect,
    promptReconnectWithSettings
  } = useDatabaseConnectContext();

  const {
    fetchTables,
    fetchStoredProcedures,
    fetchFunctions,
    fetchViews,
  } = useDatabaseSchemaContext();

  const {
    queryCommandGetTopNTableRecords,
    queryForDatabase,
    queryCommandProcedureDefinition,
    queryCommandCreateStoredProcedureScript,
    queryCommandViewDefinition,
    queryCommandCreateTableScript,
    queryCommandDropTableScript,
    queryCommandCreateFunctionScript,
    queryCommandCreateViewScript,
    queryCommandDropProcedureScript,
    queryCommandDropViewScript
  } = useCommandQueryContext();


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
          case NodeType.Views:
            await fetchViews(serverNode.id, databaseNode.nodeName);
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

  function handleReconnect(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    if (targetNode) {
      promptReconnectWithSettings(targetNode.id);
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
        targetNode?.nodeName || ""
      );
    }
  }

  async function handleQueryCreateStoredProcedureScript(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    const nodes = getNodeHierarchy(targetNode);
    if (nodes && targetNode) {
      await queryCommandCreateStoredProcedureScript(
        nodes.serverNode.id,
        nodes.databaseNode.nodeName,
        targetNode?.metaData || ""
      );
    }
  }

  async function handleQueryCreateFunctionScript(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    const nodes = getNodeHierarchy(targetNode);
    if (nodes) {
      await queryCommandCreateFunctionScript(
        nodes.serverNode.id,
        nodes.databaseNode.nodeName,
        targetNode?.metaData || ""
      );
    }
  }

  async function handleQueryViewDefinition(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    const nodes = getNodeHierarchy(targetNode);
    if (nodes && targetNode) {
      await queryCommandViewDefinition(
        nodes.serverNode.id,
        nodes.databaseNode.nodeName,
        targetNode?.metaData || "",
        targetNode?.nodeName
      );
    }
  }

  async function handleQueryCreateViewScript(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    const nodes = getNodeHierarchy(targetNode);
    if (nodes) {
      await queryCommandCreateViewScript(
        nodes.serverNode.id,
        nodes.databaseNode.nodeName,
        targetNode?.metaData || ""
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

  async function handleQueryDropProcedureScript(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    const nodes = getNodeHierarchy(targetNode);
    if (nodes && targetNode) {
      await queryCommandDropProcedureScript(
        nodes.serverNode.id,
        nodes.databaseNode.nodeName,
        targetNode?.metaData || "",
        targetNode?.nodeName
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

  async function handleRefreshViews(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    const nodes = getNodeHierarchy(targetNode);
    if (nodes) {
      await fetchViews(nodes.serverNode.id, nodes.databaseNode.nodeName);
    }
  }

  async function handleQueryDropViewScript(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    const nodes = getNodeHierarchy(targetNode);
    if (nodes && targetNode) {
      await queryCommandDropViewScript(
        nodes.serverNode.id,
        nodes.databaseNode.nodeName,
        targetNode?.metaData || "",
        targetNode?.nodeName
      );
    }
  }

  const handleCloseContextMenu = useCallback(() => {
    setContextMenuTarget(EmptyPosition);
  }, [setContextMenuTarget]);

  return {
    handleOnNodeClick,
    handleExpand,
    handleNewServerConnection,
    handleDisconnect,
    handleReconnect,
    handleNewQueryForDatabase,
    handleSelectTop100Records,
    handleSelectAllRecords,
    handleNewQueryForTables,
    handleQueryProcedureDefinition,
    handleQueryCreateStoredProcedureScript,
    handleQueryCreateFunctionScript,
    handleQueryViewDefinition,
    handleQueryCreateViewScript,
    handleRefreshProcedures,
    handleRefreshFunctions,
    handleCreateNewTable,
    handleRefreshTables,
    handleDeleteTable,
    handleRefreshViews,
    handleQueryDropProcedureScript,
    handleQueryDropViewScript,
    handleCloseContextMenu
  };
}
