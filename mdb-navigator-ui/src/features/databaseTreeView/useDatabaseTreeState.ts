import { useEffect, useReducer, useRef } from "react";
import { TreeViewNodeData } from "../../ui/treeView/TreeViewNodeData";
import { DatabaseSchema } from "../../contexts/databaseSchema/DatabaseSchemaReducer";
import { createDatabaseNode, createDatabasesFolderNode, createFunctionNode, createServerNode, createServersNode, createStoredProcedureNode, createTableNode, getDatabaseNodeFromServerNode, getFunctionsNode, getServerNodeFromServersNode, getStoredProceduresNode, getTablesFolderNode } from "./databaseTreeViewUtils";
import { NodeType } from "./NodeType";
import { DatabaseServerConnection } from "../../contexts/databaseServerConnect/DatabaseServerConnectReducer";

export default function useDatabaseTreeState(databaseSchemas: DatabaseSchema[] | null, databaseServerConnections: DatabaseServerConnection[] | null) {
  const rootRef = useRef<TreeViewNodeData | null>(null);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const root = rootRef.current;


  // Initial Servers load
  useEffect(() => {
    async function getServers() {

      const isConnectedToDB = databaseServerConnections && databaseServerConnections.length > 0;
      if (databaseSchemas && isConnectedToDB) {

        const connectedResult =
          databaseServerConnections.filter(c => root
            ? !getServerNodeFromServersNode(root, c.connectedResult?.connectionId || '')
            : true)[0]?.connectedResult;

        if (connectedResult) {
          if (!root) {
            rootRef.current = createServersNode(true);
          }

          const serverNode = createServerNode(connectedResult.connectionId, connectedResult.serverName, true);
          rootRef.current!.nodes!.push(serverNode);

          forceUpdate();
        }
      }
    }

    getServers();

  }, [databaseSchemas, databaseServerConnections, root]);

  // Databases refresh
  useEffect(() => {

    if (!root) {
      return;
    }

    const databaseSchemasForRresh = databaseSchemas?.filter(s => s.refreshDatabases);
    if(!databaseSchemasForRresh?.length) {
      return;
    }

    databaseSchemasForRresh.forEach(schema => {

      schema.refreshDatabases = false;
      const serverNode = getServerNodeFromServersNode(root!, schema.connectionId);
      if (!serverNode) {
        return;
      }

      const databaseFolderNodes = createDatabasesFolderNode(serverNode, true);
      serverNode.nodes = [];
      serverNode.nodes = [databaseFolderNodes];

      schema.databasesDetails?.databases?.forEach(db => databaseFolderNodes.nodes?.push(createDatabaseNode(db.name, databaseFolderNodes, true)));
    });

    forceUpdate();
  }, [databaseSchemas, root]);

  // disconnect server
  useEffect(() => {
    if (!root) {
      return;
    }
    const connectedServerIds = databaseServerConnections?.map(c => c.connectedResult?.connectionId) || [];
    let hasChanges = false;
    const filteredNodes = root.nodes!.filter(serverNode => {
      if (serverNode.type === NodeType.Server) {
        if (!connectedServerIds.includes(serverNode.id)) {
          hasChanges = true;
          return false;
        }
      }
      return true;
    });

    if (hasChanges) {
      root.nodes = filteredNodes;
      forceUpdate();
    }
  }, [databaseServerConnections, root]);

  // Tables/SP/Functions refresh
  useEffect(() => {

    function updateTablesForSchema(schema: DatabaseSchema) {
      const serverNode = getServerNodeFromServersNode(root!, schema.connectionId);
      if (!serverNode) {
        return;
      }

      const databaseNode = getDatabaseNodeFromServerNode(serverNode!, schema.lastUpdatedDatabaseName || '');
      if (!databaseNode) {
        return;
      }

      const tablesFoldersNode = getTablesFolderNode(databaseNode);
      if (!tablesFoldersNode) {
        return;
      }

      const database = schema.databasesDetails?.databases.find(db => db.name === schema.lastUpdatedDatabaseName);
      if (!database) {
        return;
      }

      tablesFoldersNode.nodes = database.tablesDetails?.tables?.map(t =>
        createTableNode(t.databaseSchema, t.name, tablesFoldersNode)
      ) || [];
    }

    if (!root) {
      return;
    }

    // Handle Tables refresh
    const tablesToRefresh = databaseSchemas?.filter((s) => s.refreshTables);
    if (!tablesToRefresh?.length) {
      return;
    }

    tablesToRefresh.forEach((schema) => {
      schema.refreshTables = false;
      updateTablesForSchema(schema);
    });

    forceUpdate();
  }, [databaseSchemas, root]);

  // SP Refresh
  useEffect(() => {
    function updateStoredProceduresForSchema(schema: DatabaseSchema) {
      const serverNode = getServerNodeFromServersNode(root!, schema.connectionId);
      if (!serverNode) {
        return;
      }

      const databaseNode = getDatabaseNodeFromServerNode(serverNode!, schema.lastUpdatedDatabaseName || '');
      if (!databaseNode) {
        return;
      }

      const storedproceduresFoldersNode = getStoredProceduresNode(databaseNode);
      if (!storedproceduresFoldersNode) {
        return;
      }

      const database = schema.databasesDetails?.databases.find(db => db.name === schema.lastUpdatedDatabaseName);
      if (!database) {
        return;
      }

      storedproceduresFoldersNode.nodes = [];
      storedproceduresFoldersNode.nodes = database.storedProceduresDetails?.procedures?.map(t =>
        createStoredProcedureNode(t.databaseSchema, t.name, storedproceduresFoldersNode)
      ) || [];
    }

    if (!root) {
      return;
    }

    const databaseSchemasForRresh = databaseSchemas?.filter(s => s.refreshStoredProcedures);
    if (!databaseSchemasForRresh?.length) {
      return;
    }

    databaseSchemasForRresh.forEach(schema => {
      schema.refreshStoredProcedures = false;
      updateStoredProceduresForSchema(schema);
    });

    forceUpdate();

  }, [databaseSchemas, root]);

  // Functions refresh
  useEffect(() => {
    function updateFunctionsForSchema(schema: DatabaseSchema) {
     const serverNode = getServerNodeFromServersNode(root!, schema.connectionId);
      if (!serverNode) {
        return;
      }

      const databaseNode = getDatabaseNodeFromServerNode(serverNode!, schema.lastUpdatedDatabaseName || '');
      if (!databaseNode) {
        return;
      }

      const functionsFoldersNode = getFunctionsNode(databaseNode);
      if (!functionsFoldersNode) {
        return;
      }

      const database = schema.databasesDetails?.databases.find(db => db.name === schema.lastUpdatedDatabaseName);
      if (!database) {
        return;
      }

      functionsFoldersNode.nodes = [];
      functionsFoldersNode.nodes = database.functionsDetails?.procedures?.map(t =>
        createFunctionNode(t.databaseSchema, t.name, functionsFoldersNode)
      ) || [];
    }

     if (!root) {
      return;
    }

    const databaseSchemasForRresh = databaseSchemas?.filter(s => s.refreshFunctions);
    if (!databaseSchemasForRresh?.length) {
      return;
    }

    databaseSchemasForRresh.forEach(schema => {
      schema.refreshFunctions = false;
      updateFunctionsForSchema(schema);

    });

    forceUpdate();

  }, [databaseSchemas, root]);

  return { root };
}