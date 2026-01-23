import Menus from "../../ui/contextMenu/Menus";
import { TreeViewNodeData } from "../../ui/treeView/TreeViewNodeData";
import { CoordPosition } from "../../types/coordPosition";
import { NodeType } from "./NodeType";
import { PiPlugsConnectedFill, PiRows } from "react-icons/pi";
import { BsFiletypeSql } from "react-icons/bs";
import { TiDelete } from "react-icons/ti";
import { GrNewWindow, GrRefresh, GrTableAdd } from "react-icons/gr";
import { TbPlugConnected, TbPlugConnectedX, TbRowInsertBottom, TbTablePlus, TbTrash } from "react-icons/tb";
import { RiFunctionAddFill, RiFunctionAddLine } from "react-icons/ri";

interface DatabaseContextMenuProps {
  targetPosition: CoordPosition;
  currentNode: TreeViewNodeData | undefined;
  isLoading: boolean;
  handlers: {
    handleCloseContextMenu: () => void;
    handleNewServerConnection: (node: TreeViewNodeData | undefined) => void;
    handleDisconnect: (node: TreeViewNodeData | undefined) => void;
    handleReconnect: (node: TreeViewNodeData | undefined) => void;
    handleNewQueryForDatabase: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleCreateNewTable: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleCreateTableScript: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleNewQueryForTables: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleInsertTableScript: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleRefreshTables: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleSelectTop100Records: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleSelectAllRecords: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleDropTable: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleRefreshProcedures: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleRefreshFunctions: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleQueryCreateStoredProcedureScript: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleQueryProcedureDefinition: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleQueryViewDefinition: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleRefreshViews: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleQueryCreateFunctionScript: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleQueryCreateViewScript: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleQueryDropProcedureScript: (node: TreeViewNodeData | undefined) => Promise<void>;
    handleQueryDropViewScript: (node: TreeViewNodeData | undefined) => Promise<void>;
  };
}

export default function DatabaseContextMenu({ targetPosition, currentNode, isLoading, handlers }: DatabaseContextMenuProps) {
  const currentNodeType = currentNode?.type as NodeType;

  return (
    <Menus targetPosition={targetPosition}  id="DatabaseMenu" clickedOutside={handlers.handleCloseContextMenu}>
      {currentNodeType === NodeType.Servers && (
        <Menus.MenuItem
        disabled={isLoading}
        icon={<PiPlugsConnectedFill />}
        onClick={() => handlers.handleNewServerConnection(currentNode)}>
          New Connection
        </Menus.MenuItem>
      )}

      {currentNodeType === NodeType.Server && (<>
          <Menus.MenuItem disabled={isLoading} icon={<TbPlugConnectedX />} onClick={() => handlers.handleDisconnect(currentNode)}>
            Disconnect
          </Menus.MenuItem>
          <Menus.MenuItem disabled={isLoading} icon={<TbPlugConnected />} onClick={() => handlers.handleReconnect(currentNode)}>
            Reconnect
          </Menus.MenuItem>
        </>
      )}

      {currentNodeType === NodeType.Database && (
        <Menus.MenuItem disabled={isLoading} icon={<BsFiletypeSql />} onClick={() => handlers.handleNewQueryForDatabase(currentNode)}>
          New Query for this database
        </Menus.MenuItem>
      )}

      {currentNodeType === NodeType.Tables && (
        <>
          <Menus.MenuItem disabled={isLoading} icon={<GrTableAdd />} onClick={() => handlers.handleCreateNewTable(currentNode)}>
            Create New Table
          </Menus.MenuItem>
          <Menus.MenuItem disabled={isLoading} icon={<BsFiletypeSql />} onClick={() => handlers.handleNewQueryForTables(currentNode)}>
            New Query for this database
          </Menus.MenuItem>
          <Menus.MenuItem disabled={isLoading} icon={<GrRefresh />} onClick={() => handlers.handleRefreshTables(currentNode)}>
            Refresh
          </Menus.MenuItem>
        </>
      )}

      {currentNodeType === NodeType.Table && (
        <>
          <Menus.MenuItem disabled={isLoading} icon={<PiRows />} onClick={() => handlers.handleSelectTop100Records(currentNode)}>
            Select TOP 100 Records
          </Menus.MenuItem>
          <Menus.MenuItem disabled={isLoading} icon={<PiRows />} onClick={() => handlers.handleSelectAllRecords(currentNode)}>
            Select All Records
          </Menus.MenuItem>

          <Menus.MenuItemSeparator />
          <Menus.MenuItem disabled={isLoading} icon={<TbTablePlus />} onClick={() => handlers.handleCreateTableScript(currentNode)}>
            Create Table Script
          </Menus.MenuItem>
          <Menus.MenuItem disabled={isLoading} icon={<TbTrash />} onClick={() => handlers.handleDropTable(currentNode)}>
            Drop Table Script
          </Menus.MenuItem>

          <Menus.MenuItemSeparator />
          <Menus.MenuItem disabled={isLoading} icon={<TbRowInsertBottom />} onClick={() => handlers.handleInsertTableScript(currentNode)}>
            Insert Table Rows Script
          </Menus.MenuItem>

        </>
      )}

      {currentNodeType === NodeType.StoredProcedures && (<>
          <Menus.MenuItem disabled={isLoading} icon={<RiFunctionAddFill />} onClick={() => handlers.handleQueryCreateStoredProcedureScript(currentNode)}>
            Create New Procedure
          </Menus.MenuItem>
          <Menus.MenuItem disabled={isLoading} icon={<GrRefresh />} onClick={() => handlers.handleRefreshProcedures(currentNode)}>
            Refresh
          </Menus.MenuItem>
        </>
      )}

      {currentNodeType === NodeType.Functions && (<>
          <Menus.MenuItem disabled={isLoading} icon={<RiFunctionAddLine />} onClick={() => handlers.handleQueryCreateFunctionScript(currentNode)}>
            Create New Function
          </Menus.MenuItem>
          <Menus.MenuItem disabled={isLoading} icon={<GrRefresh />} onClick={() => handlers.handleRefreshFunctions(currentNode)}>
            Refresh
          </Menus.MenuItem>
        </>
      )}

      {[NodeType.StoredProcedure, NodeType.Function].some(t => t === currentNodeType) && ( <>
          <Menus.MenuItem disabled={isLoading} icon={<BsFiletypeSql />} onClick={() => handlers.handleQueryProcedureDefinition(currentNode)}>
            Query Definition
          </Menus.MenuItem>
          <Menus.MenuItem disabled={isLoading} icon={<TbTrash />} onClick={() => handlers.handleQueryDropProcedureScript(currentNode)}>
            Drop {currentNodeType === NodeType.StoredProcedure ? 'Procedure' : 'Function'} Script
          </Menus.MenuItem>
        </>
      )}

      {currentNodeType === NodeType.Views && (<>
          <Menus.MenuItem disabled={isLoading} icon={<GrNewWindow />} onClick={() => handlers.handleQueryCreateViewScript(currentNode)}>
            Create New View
          </Menus.MenuItem>
          <Menus.MenuItem disabled={isLoading} icon={<GrRefresh />} onClick={() => handlers.handleRefreshViews(currentNode)}>
            Refresh
          </Menus.MenuItem>
        </>
      )}

      {currentNodeType === NodeType.View && (<>
          <Menus.MenuItem disabled={isLoading} icon={<BsFiletypeSql />} onClick={() => handlers.handleQueryViewDefinition(currentNode)}>
            Query Definition
          </Menus.MenuItem>
          <Menus.MenuItem disabled={isLoading} icon={<TbTrash />} onClick={() => handlers.handleQueryDropViewScript(currentNode)}>
            Drop View Script
          </Menus.MenuItem>
        </>
      )}

    </Menus>
  );
}
