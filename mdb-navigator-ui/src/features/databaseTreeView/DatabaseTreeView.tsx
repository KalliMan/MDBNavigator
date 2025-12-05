import { useEffect, useReducer, useRef, useState } from "react";
import TreeView from "../../ui/treeView/TreeView"
import { TreeViewNodeData } from "../../ui/treeView/TreeViewNodeData"
import { createDatabaseNode, createDatabasesFolderNode, createFunctionNode, createServerNode, createStoredProcedureNode, createTableNode, getDatabaseNodeFromServerNode, getDatabaseParentNode, getFunctionsNode, getStoredProceduresNode, getTablesFolderNode, hasLoaderNode } from "./databaseTreeViewUtils";
import { findNode } from "../../ui/treeView/treeViewUtils";
import { NodeType } from "./NodeType";
import { CoordPosition, EmptyPosition } from "../../types/coordPosition";
import Menus from "../../ui/contextMenu/Menus";
import { PiRows } from "react-icons/pi";
import useDatabaseConnectContext from "../../contexts/databaseConnect/useDatabaseConnect";
import useDatabaseSchemaContext from "../../contexts/databaseSchema/useDatabaseSchema";
import { BsFiletypeSql } from "react-icons/bs";
import useCommandQueryContext from "../../contexts/commandQuery/useDatabaseCommand";
import { TiDelete } from "react-icons/ti";
import { GrRefresh, GrTableAdd } from "react-icons/gr";


function DatabaseTreeView() {
  const {isConnectedToDB,
    connectionSettings,
  } = useDatabaseConnectContext();

  const {
    databasesDetails,
    tablesDetails,
    storedProceduresDetails,
    functionsDetails,
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
  const databasesLoaded = useRef(false);
  const loadedTablesForDatabases = useRef<Set<string>>(new Set());
  const loadedProceduresForDatabases = useRef<Set<string>>(new Set());
  const loadedFunctionsForDatabases = useRef<Set<string>>(new Set());
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const [contextMenuTarget, setContextMenuTarget] = useState(EmptyPosition);
  const [currentNode, setCurrentNode] = useState<TreeViewNodeData>();

  useEffect(() => {
    async function getDatabases() {
      if (!databasesDetails?.databases && isConnectedToDB && connectionSettings) {
        await fetchDatabases();

        const serverNode = createServerNode(`${connectionSettings.serverName}:${connectionSettings.port}`);
        setRoot(serverNode);
      }
    }

    getDatabases();

  }, [connectionSettings, databasesDetails?.databases, isConnectedToDB, fetchDatabases]);

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
    if(databasesLoaded.current && tablesDetails && root) {
      if (loadedTablesForDatabases.current.has(tablesDetails.databaseName)) {
        return;
      }

      const databaseNode = getDatabaseNodeFromServerNode(root, tablesDetails.databaseName);
      if (databaseNode) {
        const tablesFoldersNode = getTablesFolderNode(databaseNode);
        if (tablesFoldersNode) {
          tablesFoldersNode.nodes = tablesDetails?.tables?.map(t => 
            createTableNode(t.databaseSchema, t.name, tablesFoldersNode)
          ) || [];

          loadedTablesForDatabases.current.add(tablesDetails.databaseName);
          forceUpdate();
        }
      }
    }
  }, [tablesDetails, root]);

  useEffect(() => {
    if(databasesLoaded.current && storedProceduresDetails && root) {
      if (loadedProceduresForDatabases.current.has(storedProceduresDetails.databaseName)) {
        return;
      }

      const databaseNode = getDatabaseNodeFromServerNode(root, storedProceduresDetails.databaseName);
      if (databaseNode) {
        const storedProceduresFolderNode = getStoredProceduresNode(databaseNode);
        if (storedProceduresFolderNode) {
          storedProceduresFolderNode.nodes = storedProceduresDetails?.procedures.map(t =>
            createStoredProcedureNode(t.databaseSchema, t.name, storedProceduresFolderNode)
          ) || [];

          loadedProceduresForDatabases.current.add(storedProceduresDetails.databaseName);
          forceUpdate();
        }
      }
    }
  }, [storedProceduresDetails, root]);

  useEffect(() => {
    if(databasesLoaded.current && functionsDetails && root) {
      if (loadedFunctionsForDatabases.current.has(functionsDetails.databaseName)) {
        return;
      }

      const databaseNode = getDatabaseNodeFromServerNode(root, functionsDetails.databaseName);
      if (databaseNode) {
        const functionsFolderNode = getFunctionsNode(databaseNode);
        if (functionsFolderNode) {
          functionsFolderNode.nodes = functionsDetails?.procedures.map(t =>
            createFunctionNode(t.databaseSchema, t.name, functionsFolderNode)
          ) || [];

          loadedFunctionsForDatabases.current.add(functionsDetails.databaseName);
          forceUpdate();
        }
      }
    }
  }, [functionsDetails, root]);

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
        if (databaseNode) {
          switch (targetNode.type) {
          case NodeType.Tables:
            await fetchTables(databaseNode.nodeName);
            break;
          case NodeType.StoredProcedures:
            await fetchStoredProcedures(databaseNode.nodeName);
            break;
          case NodeType.Functions:
            await fetchFunctions(databaseNode.nodeName);
            break;
          default:
            break;
          }
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
      const databaseNode = getDatabaseParentNode(targetNode);

      if (databaseNode){
        queryCommandGetTopNTableRecords(
          databaseNode.nodeName,
          targetNode.metaData || '',
          targetNode.nodeName,
          recordsNumber);
      }
    }
  }

  function handleNewQueryForTables(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);

    if (root && targetNode) {
      const databaseNode = getDatabaseParentNode(targetNode);
      if (databaseNode){
        queryForDatabase(databaseNode.nodeName, targetNode?.metaData || '');
      }
    }
  }

  function handleNewQueryForDatabase(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);

    if (targetNode){
      queryForDatabase(targetNode.nodeName, targetNode?.metaData || '');
    }
  }

  function handleQueryProcedureDefinition(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);

    if (targetNode){
      const databaseNode = getDatabaseParentNode(targetNode);
      if (databaseNode){
        queryCommandProcedureDefinition(databaseNode.nodeName, targetNode.metaData || '', targetNode.nodeName);
      }
    }
  }

  async function handleRefreshProcedures(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    if (targetNode){
      const databaseNode = getDatabaseParentNode(targetNode);
      if (databaseNode){
        loadedProceduresForDatabases.current.delete(databaseNode.nodeName);
        await fetchStoredProcedures(databaseNode.nodeName);
      }
    }
  }

  async function handleRefreshFunctions(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    if (targetNode){
      const databaseNode = getDatabaseParentNode(targetNode);
      if (databaseNode){
        loadedFunctionsForDatabases.current.delete(databaseNode.nodeName);
        await fetchFunctions(databaseNode.nodeName);
      }
    }
  }

  function handleCreateNewTable(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    if (targetNode){
      const databaseNode = getDatabaseParentNode(targetNode);
      if (databaseNode){
        queryCommandCreateTableScript(databaseNode.nodeName);
      }
    }
  }

  async function handleRefreshTables(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);
    if (targetNode){
      const databaseNode = getDatabaseParentNode(targetNode);
      if (databaseNode){
        loadedTablesForDatabases.current.delete(databaseNode.nodeName);
        await fetchTables(databaseNode.nodeName);
      }
    }
  }

  function handleDeleteTable(targetNode: TreeViewNodeData | undefined) {
    setContextMenuTarget(EmptyPosition);

    setContextMenuTarget(EmptyPosition);
    if (targetNode){
      const databaseNode = getDatabaseParentNode(targetNode);
      if (databaseNode){
        queryCommandDropTableScript(databaseNode.nodeName, targetNode.metaData || '', targetNode.nodeName);
      }
    }
  }

  if (!root) {
    return null;
  }

  const currentNodeType = currentNode?.type as NodeType;

  return (<>
    <TreeView root={root} onNodeClick={handleOnNodeClick} onExpand={handleExpand}/>

    <Menus targetPosition={contextMenuTarget} id="DatabaseMenu" clickedOutside={() => setContextMenuTarget(EmptyPosition)}>
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
