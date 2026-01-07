import { useState } from "react";
import TreeView from "../../ui/treeView/TreeView"
import { TreeViewNodeData } from "../../ui/treeView/TreeViewNodeData"
import { EmptyPosition } from "../../types/coordPosition";
import useDatabaseConnectContext from "../../contexts/databaseServerConnect/useDatabaseServerConnect";
import useDatabaseSchemaContext from "../../contexts/databaseSchema/useDatabaseSchema";
import useCommandQueryContext from "../../contexts/commandQuery/useDatabaseCommand";
import useDatabaseTreeState from "./useDatabaseTreeState";
import useContextMenuHandlers from "./useContextMenuHandlers";
import DatabaseContextMenu from "./DatabaseContextMenu";


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

  const handlers = useContextMenuHandlers({
    root,
    setContextMenuTarget,
    setCurrentNode,
    connectNewDatabase,
    disconnect,
    fetchTables,
    fetchStoredProcedures,
    fetchFunctions,
    queryForDatabase,
    queryCommandGetTopNTableRecords,
    queryCommandProcedureDefinition,
    queryCommandCreateTableScript,
    queryCommandDropTableScript
  });

  if (!root) {
    return null;
  }

  return (
    <>
      <TreeView root={root} onNodeClick={handlers.handleOnNodeClick} onExpand={handlers.handleExpand}/>
      <DatabaseContextMenu
        targetPosition={contextMenuTarget}
        currentNode={currentNode}
        handlers={handlers}
      />
    </>
  );
}
