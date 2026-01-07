import { useState } from "react";
import TreeView from "../../ui/treeView/TreeView"
import { TreeViewNodeData } from "../../ui/treeView/TreeViewNodeData"
import { EmptyPosition } from "../../types/coordPosition";
import Menus from "../../ui/contextMenu/Menus";
import { PiRows } from "react-icons/pi";
import useDatabaseConnectContext from "../../contexts/databaseServerConnect/useDatabaseServerConnect";
import useDatabaseSchemaContext from "../../contexts/databaseSchema/useDatabaseSchema";
import { BsFiletypeSql } from "react-icons/bs";
import useCommandQueryContext from "../../contexts/commandQuery/useDatabaseCommand";
import { TiDelete } from "react-icons/ti";
import { GrRefresh, GrTableAdd } from "react-icons/gr";
import useDatabaseTreeState from "./useDatabaseTreeState";
import { NodeType } from "./NodeType";
import useContextMenuHandlers from "./useContextMenuHandlers";


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

  const currentNodeType = currentNode?.type as NodeType;

  return (<>
    <TreeView root={root} onNodeClick={handlers.handleOnNodeClick} onExpand={handlers.handleExpand}/>

    <Menus targetPosition={contextMenuTarget} id="DatabaseMenu" clickedOutside={handlers.handleCloseContextMenu}>
      {currentNodeType === NodeType.Servers && (<>
          <Menus.MenuItem icon={<BsFiletypeSql />} onClick={() => handlers.handleNewServerConnection(currentNode)}>New Connection</Menus.MenuItem>
        </>
      )}

      {currentNodeType === NodeType.Server && (<>
          <Menus.MenuItem icon={<BsFiletypeSql />} onClick={() => handlers.handleDisconnect(currentNode)}>Disconnect</Menus.MenuItem>
        </>
      )}

      {currentNodeType === NodeType.Database && (<>
          <Menus.MenuItem icon={<BsFiletypeSql />} onClick={() => handlers.handleNewQueryForDatabase(currentNode)}>New Query for this database</Menus.MenuItem>
        </>
      )}

      {currentNodeType === NodeType.Tables && (<>
          <Menus.MenuItem icon={<GrTableAdd />} onClick={() => handlers.handleCreateNewTable(currentNode)}>Create New Table</Menus.MenuItem>
          <Menus.MenuItem icon={<BsFiletypeSql />} onClick={() => handlers.handleNewQueryForTables(currentNode)}>New Query for this database</Menus.MenuItem>
          <Menus.MenuItem icon={<GrRefresh />} onClick={() => handlers.handleRefreshTables(currentNode)}>Refresh</Menus.MenuItem>
        </>
      )}
      {currentNodeType === NodeType.Table && (<>
          <Menus.MenuItem icon={<PiRows />} onClick={() => handlers.handleSelectTop100Records(currentNode)}>Select TOP 100 Records</Menus.MenuItem>
          <Menus.MenuItem icon={<PiRows />} onClick={() => handlers.handleSelectAllRecords(currentNode)}>Select All Records</Menus.MenuItem>
          <Menus.MenuItem icon={<TiDelete />} onClick={() => handlers.handleDeleteTable(currentNode)}>Delete Table</Menus.MenuItem>
        </>
      )}

      {currentNodeType === NodeType.StoredProcedures && (<>
          <Menus.MenuItem icon={<GrRefresh />} onClick={() => handlers.handleRefreshProcedures(currentNode)}>Refresh</Menus.MenuItem>
        </>
      )}

      {currentNodeType === NodeType.Functions && (<>
          <Menus.MenuItem icon={<GrRefresh />} onClick={() => handlers.handleRefreshFunctions(currentNode)}>Refresh</Menus.MenuItem>
        </>
      )}

      { ([NodeType.StoredProcedure, NodeType.Function].some(t => t === currentNodeType)) && (<>
          <Menus.MenuItem icon={<BsFiletypeSql />} onClick={() => handlers.handleQueryProcedureDefinition(currentNode)}>Query Definition</Menus.MenuItem>
        </>
      )}
    </Menus>
  </>)
}
