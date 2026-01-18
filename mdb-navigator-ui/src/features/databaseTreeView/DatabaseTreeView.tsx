import { useState } from "react";
import TreeView from "../../ui/treeView/TreeView";
import { TreeViewNodeData } from "../../ui/treeView/TreeViewNodeData";
import { EmptyPosition } from "../../types/coordPosition";
import useDatabaseConnectContext from "../../contexts/databaseServerConnect/useDatabaseServerConnect";
import useDatabaseSchemaContext from "../../contexts/databaseSchema/useDatabaseSchema";
import useCommandQueryContext from "../../contexts/commandQuery/useDatabaseCommand";
import useDatabaseTreeState from "./useDatabaseTreeState";
import useContextMenuHandlers from "./useContextMenuHandlers";
import DatabaseContextMenu from "./DatabaseContextMenu";


export default function DatabaseTreeView() {
  const { databaseServerConnections, connectNewDatabase, disconnect, promptReconnectWithSettings } = useDatabaseConnectContext();

  const {
    databaseSchemas,
    fetchTables,
    fetchStoredProcedures,
    fetchFunctions,
    fetchViews,
    clearRefreshFlags,
  } = useDatabaseSchemaContext();

  const {
    queryCommandGetTopNTableRecords,
    queryForDatabase,
    queryCommandProcedureDefinition,
    queryCommandViewDefinition,
    queryCommandCreateTableScript,
    queryCommandDropTableScript
  } = useCommandQueryContext();

  const { root } = useDatabaseTreeState(databaseSchemas, databaseServerConnections, clearRefreshFlags);

  const [contextMenuTarget, setContextMenuTarget] = useState(EmptyPosition);
  const [currentNode, setCurrentNode] = useState<TreeViewNodeData>();

  const handlers = useContextMenuHandlers({
    root,
    setContextMenuTarget,
    setCurrentNode,
    connectNewDatabase,
    disconnect,
    promptReconnectWithSettings,
    fetchTables,
    fetchStoredProcedures,
    fetchFunctions,
    fetchViews,
    queryForDatabase,
    queryCommandGetTopNTableRecords,
    queryCommandProcedureDefinition,
    queryCommandViewDefinition,
    queryCommandCreateTableScript,
    queryCommandDropTableScript
  });

  if (!root) {
    return null;
  }

  return (
    <>
      <TreeView root={root}
        settings={{
          allowKeepSelectedNode: true
        }}
        onNodeClick={handlers.handleOnNodeClick}
        onExpand={handlers.handleExpand}
      />
      <DatabaseContextMenu
        targetPosition={contextMenuTarget}
        currentNode={currentNode}
        handlers={handlers}
      />
    </>
  );
}
