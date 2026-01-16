import Menus from "../../ui/contextMenu/Menus";
import { TreeViewNodeData } from "../../ui/treeView/TreeViewNodeData";
import { CoordPosition } from "../../types/coordPosition";
import { NodeType } from "./NodeType";
import { PiRows } from "react-icons/pi";
import { BsFiletypeSql } from "react-icons/bs";
import { TiDelete } from "react-icons/ti";
import { GrRefresh, GrTableAdd } from "react-icons/gr";

interface DatabaseContextMenuProps {
  targetPosition: CoordPosition;
  currentNode: TreeViewNodeData | undefined;
  handlers: {
    handleCloseContextMenu: () => void;
    handleNewServerConnection: (node: TreeViewNodeData | undefined) => void;
    handleDisconnect: (node: TreeViewNodeData | undefined) => void;
    handleNewQueryForDatabase: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleCreateNewTable: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleNewQueryForTables: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleRefreshTables: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleSelectTop100Records: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleSelectAllRecords: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleDeleteTable: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleRefreshProcedures: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleRefreshFunctions: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleQueryProcedureDefinition: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleQueryViewDefinition: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleRefreshViews: (node: TreeViewNodeData | undefined) => Promise<void>;
  };
}

export default function DatabaseContextMenu({ targetPosition, currentNode, handlers }: DatabaseContextMenuProps) {
  const currentNodeType = currentNode?.type as NodeType;

  return (
    <Menus targetPosition={targetPosition} id="DatabaseMenu" clickedOutside={handlers.handleCloseContextMenu}>
      {currentNodeType === NodeType.Servers && (
        <Menus.MenuItem icon={<BsFiletypeSql />} onClick={() => handlers.handleNewServerConnection(currentNode)}>
          New Connection
        </Menus.MenuItem>
      )}

      {currentNodeType === NodeType.Server && (
        <Menus.MenuItem icon={<BsFiletypeSql />} onClick={() => handlers.handleDisconnect(currentNode)}>
          Disconnect
        </Menus.MenuItem>
      )}

      {currentNodeType === NodeType.Database && (
        <Menus.MenuItem icon={<BsFiletypeSql />} onClick={() => handlers.handleNewQueryForDatabase(currentNode)}>
          New Query for this database
        </Menus.MenuItem>
      )}

      {currentNodeType === NodeType.Tables && (
        <>
          <Menus.MenuItem icon={<GrTableAdd />} onClick={() => handlers.handleCreateNewTable(currentNode)}>
            Create New Table
          </Menus.MenuItem>
          <Menus.MenuItem icon={<BsFiletypeSql />} onClick={() => handlers.handleNewQueryForTables(currentNode)}>
            New Query for this database
          </Menus.MenuItem>
          <Menus.MenuItem icon={<GrRefresh />} onClick={() => handlers.handleRefreshTables(currentNode)}>
            Refresh
          </Menus.MenuItem>
        </>
      )}

      {currentNodeType === NodeType.Table && (
        <>
          <Menus.MenuItem icon={<PiRows />} onClick={() => handlers.handleSelectTop100Records(currentNode)}>
            Select TOP 100 Records
          </Menus.MenuItem>
          <Menus.MenuItem icon={<PiRows />} onClick={() => handlers.handleSelectAllRecords(currentNode)}>
            Select All Records
          </Menus.MenuItem>
          <Menus.MenuItem icon={<TiDelete />} onClick={() => handlers.handleDeleteTable(currentNode)}>
            Delete Table
          </Menus.MenuItem>
        </>
      )}

      {currentNodeType === NodeType.StoredProcedures && (
        <Menus.MenuItem icon={<GrRefresh />} onClick={() => handlers.handleRefreshProcedures(currentNode)}>
          Refresh
        </Menus.MenuItem>
      )}

      {currentNodeType === NodeType.Functions && (
        <Menus.MenuItem icon={<GrRefresh />} onClick={() => handlers.handleRefreshFunctions(currentNode)}>
          Refresh
        </Menus.MenuItem>
      )}

      {[NodeType.StoredProcedure, NodeType.Function].some(t => t === currentNodeType) && (
        <Menus.MenuItem icon={<BsFiletypeSql />} onClick={() => handlers.handleQueryProcedureDefinition(currentNode)}>
          Query Definition
        </Menus.MenuItem>
      )}

      {currentNodeType === NodeType.Views && (
        <Menus.MenuItem icon={<GrRefresh />} onClick={() => handlers.handleRefreshViews(currentNode)}>
          Refresh
        </Menus.MenuItem>
      )}

      {currentNodeType === NodeType.View && (
        <Menus.MenuItem icon={<GrRefresh />} onClick={() => handlers.handleQueryViewDefinition(currentNode)}>
          Query Definition
        </Menus.MenuItem>
      )}

    </Menus>
  );
}
