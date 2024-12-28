import { useEffect, useRef, useState } from "react";
import TreeView from "../../ui/treeView/TreeView"
import { TreeViewNodeData } from "../../ui/treeView/TreeViewNodeData"
import { createDatabaseNode, createDatabasesFolderNode, createServerNode, createTableNode, getDatabaseNode, getTablesFolderNode, hasLoaderNode } from "./dbTreeViewUtils";
import { findFirstParentOfType, findNode } from "../../ui/treeView/treeViewUtils";
import { NodeType } from "./NodeType";
import { CoordPosition, EmptyPosition } from "../../types/coordPosition";
import Menus from "../../ui/contextMenu/Menus";
import { PiRows } from "react-icons/pi";
import useDatabaseConnectContext from "../../contexts/databaseConnect/useDatabaseConnect";
import useDatabaseSchemaContext from "../../contexts/databaseSchema/useDatabaseSchema";
import useDatabaseCommandContext from "../../contexts/databaseCommand/useDatabaseCommand";


function DBTreeView() {
  const {isConnectedToDB,
    connectionSettings,
  } = useDatabaseConnectContext();

  const {
    databasesDetails,
    tablesDetails,
    fetchDatabases,
    fetchTables,
  } = useDatabaseSchemaContext()

  const {
    queryCommandGetTopNTableRecords
  } = useDatabaseCommandContext();

  const [root, setRoot] = useState<TreeViewNodeData | null>();
  const databasesLoaded = useRef(false);

  const [contextMenuTarget, setContextMenuTarget] = useState(EmptyPosition);
  const [currentNode, setCurrentNode] = useState<TreeViewNodeData>();

  useEffect(() => {
    if (!databasesLoaded.current && isConnectedToDB && connectionSettings) {
      fetchDatabases();

      const serverNode = createServerNode(`${connectionSettings.serverName}:${connectionSettings.port}`);
      setRoot(serverNode);
    }
  }, [isConnectedToDB, connectionSettings, fetchDatabases]);

  useEffect(() => {
    if (!databasesLoaded.current && isConnectedToDB && root && databasesDetails?.databases?.length) {
      const databaseFolderNodes = createDatabasesFolderNode(root);
      databaseFolderNodes.nodes = [];
      databasesDetails?.databases.forEach(db => databaseFolderNodes.nodes?.push(createDatabaseNode(db.name, databaseFolderNodes)));

      databasesLoaded.current = true;

      setRoot(r => {
        return {
          ...r!, nodes: [databaseFolderNodes]
        };
      });

    }
  }, [isConnectedToDB, root, databasesDetails]);

  useEffect(() => {
    if(root && databasesLoaded.current && tablesDetails?.tables?.length) {
      const databaseNode = getDatabaseNode(root, tablesDetails.databaseName);
      if (databaseNode) {
        const tablesFoldersNode = getTablesFolderNode(databaseNode);
        if (tablesFoldersNode && hasLoaderNode(tablesFoldersNode)){
          tablesFoldersNode.nodes = [];
          tablesDetails?.tables.forEach(t => tablesFoldersNode?.nodes?.push(createTableNode(t.databaseSchema, t.name, tablesFoldersNode)));

          setRoot({
            ...root,
           isExpanded: true
          });
        }
      }
    }
  }, [root, tablesDetails]);

  function handleOnNodeClick(node: TreeViewNodeData, e: CoordPosition) {
    console.log("clicked", node, e);
    setCurrentNode(node);
    setContextMenuTarget(e);
  }

  function handleExpand(id: string, expanded: boolean) {
    if (!root) {
      return;
    }

    const targetNode = findNode(root, id);
    if (targetNode && expanded) {
      switch (targetNode.type) {
        case NodeType.Tables: {
          if (hasLoaderNode(targetNode)) {
            const databaseNode = findFirstParentOfType(
              targetNode,
              NodeType.Database
            );
            if (databaseNode) {
              fetchTables(databaseNode.nodeName);
            }
          }
          break;
        }
      }
    }
  }

  function handleSelectTop100Records(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    selectTopNRecords(targetNode, 1000);
  }

  function handleSelectAllRecords(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    selectTopNRecords(targetNode, -1);
  }

  function selectTopNRecords(targetNode: TreeViewNodeData | undefined, recordsNumber: number) {
    if (root && targetNode) {
      const databaseNode = findFirstParentOfType(
        targetNode,
        NodeType.Database
      );
      if (databaseNode){
        queryCommandGetTopNTableRecords(
          databaseNode.nodeName,
          targetNode.metaData || '',
          targetNode.nodeName,
          recordsNumber);
      }
    }
  }

  if (!root) {
    return null;
  }

  const currentNodeType = currentNode?.type as NodeType;

  console.log(root);

  return (<>
    <TreeView root={root} onNodeClick={handleOnNodeClick} onExpand={handleExpand}/>

    <Menus targetPosition={contextMenuTarget} id="TestMenu" clickedOutside={() => setContextMenuTarget(EmptyPosition)}>
      {currentNodeType === NodeType.Table && (<>
          <Menus.MenuItem icon={<PiRows />} onClick={() => handleSelectTop100Records(currentNode)}>Select TOP 100 Records</Menus.MenuItem>
          <Menus.MenuItem icon={<PiRows />} onClick={() => handleSelectAllRecords(currentNode)}>Select All Records</Menus.MenuItem>
        </>
      )}
    </Menus>
  </>


  )
}

export default DBTreeView
