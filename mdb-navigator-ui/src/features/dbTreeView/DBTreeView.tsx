import { useEffect, useRef, useState } from "react";
import { useDatabaseContext } from "../../contexts/DatabaseContextProvider";
import TreeView from "../../ui/treeView/TreeView"
import { TreeViewNodeData } from "../../ui/treeView/TreeViewNodeData"
import { createDatabaseNode, createDatabasesFolderNode, createServerNode, createTableNode, getDatabaseNode, getTablesFolderNode } from "./dbTreeViewUtils";
import { findFirstParentOfType, findNode } from "../../ui/treeView/treeViewUtils";
import { NodeType } from "./NodeType";
/*
const root: NodeData = {
  id: '1',
  nodeName: "KalliMan's Server",
  isExpanded: true,
  nodes: [{
    id: '11',
    nodeName: 'Databases',
    isExpanded: true,
    nodes: [{
      id: '111',
      nodeName: 'BookStoreDB',
      nodes: [{
          id: '1111',
          nodeName: 'Tables',
          nodes: [{
            id:'table1',
            nodeName: 'AspNetUserClaims',
          },
          {
            id:'table2',
            nodeName: 'AspNetUserLogins',
          }]
      }]
    }]
  }]
}
*/

function DBTreeView() {
  const {isConnectedToDB, connectionSettings, databasesDetails, tablesDetails, fetchDatabases, fetchTables} = useDatabaseContext();
  const [root, setRoot] = useState<TreeViewNodeData | null>();
  const databasesLoaded = useRef(false);

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

  // useEffect(() => {
  //   if(root && databasesLoaded.current && tablesDetails?.tables?.length) {
  //     const copy = {...root};
  //     const databaseNode = getDatabaseNode(copy, tablesDetails.databaseName);
  //     if (databaseNode){
  //       const tablesFoldersNode = getTablesFolderNode(databaseNode);

  //       tablesDetails?.tables.forEach(t => tablesFoldersNode?.nodes?.push(createTableNode(t.databaseSchema, t.name, tablesFoldersNode)));

  //       setRoot(copy);
  //     }
  //   }
  // }, [root, tablesDetails]);

  if (!root) {
    return null;
  }

  function handleExpand(id: string, expanded: boolean) {
    if (!root) {
      return;
    }

    const targetNode = findNode(root, id);
    if (expanded && targetNode) {
      switch(targetNode.type) {
        case NodeType.Tables: {
          const databaseNode = findFirstParentOfType(targetNode, NodeType.Database);
          if (databaseNode) {
            fetchTables(databaseNode.nodeName);
          }
          break;
        }
      }
    }
  }

  return (
    <TreeView root={root} onExpand={handleExpand}/>
  )
}

export default DBTreeView
