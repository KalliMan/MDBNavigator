import { useEffect, useState } from "react";
import { TreeViewNodeData } from "../../ui/treeView/TreeViewNodeData";
import { DatabaseSchema } from "../../contexts/databaseSchema/DatabaseSchemaReducer";
import { createDatabaseNode, createDatabasesFolderNode, createFunctionNode, createServerNode, createServersNode, createStoredProcedureNode, createTableNode, getDatabaseNodeFromServerNode, getFunctionsNode, getServerNodeFromServersNode, getStoredProceduresNode, getTablesFolderNode } from "./databaseTreeViewUtils";
import { NodeType } from "./NodeType";
import { DatabaseServerConnection } from "../../contexts/databaseServerConnect/DatabaseServerConnectReducer";

export default function useDatabaseTreeState(databaseSchemas: DatabaseSchema[] | null, databaseServerConnections: DatabaseServerConnection[] | null) {
  const [root, setRoot] = useState<TreeViewNodeData | null>(null);

  // Initial Servers load
  useEffect(() => {
    async function getServers() {

      const isConnectedToDB = databaseServerConnections && databaseServerConnections.length > 0;
      if (databaseSchemas && isConnectedToDB) {

        setRoot(prevRoot => {
          const connectedResult =
            databaseServerConnections.filter(c => prevRoot
              ? !getServerNodeFromServersNode(prevRoot, c.connectedResult?.connectionId || '')
              : true)[0]?.connectedResult;

          if (connectedResult) {
            const newRoot = prevRoot || createServersNode(true);
            const updatedRoot = { ...newRoot, nodes: [...(newRoot.nodes || [])] };
            const serverNode = createServerNode(connectedResult.connectionId, connectedResult.serverName, true);
            updatedRoot.nodes.push(serverNode);
            return updatedRoot;
          }

          return prevRoot;
        });
      }
    }

    getServers();

  }, [databaseSchemas, databaseServerConnections]);

  // Databases refresh
  useEffect(() => {
    const databaseSchemasForRresh = databaseSchemas?.filter(s => s.refreshDatabases);
    if(!databaseSchemasForRresh?.length) {
      return;
    }

    setRoot(prevRoot => {
      if (!prevRoot) {
        return prevRoot;
      }

      const newRoot = { ...prevRoot, nodes: prevRoot.nodes?.map(node => ({ ...node })) || [] };

      databaseSchemasForRresh.forEach(schema => {
        schema.refreshDatabases = false;
        const serverNode = getServerNodeFromServersNode(newRoot, schema.connectionId);
        if (!serverNode) {
          return;
        }

        const databaseFolderNodes = createDatabasesFolderNode(serverNode, true);
        serverNode.nodes = [databaseFolderNodes];

        schema.databasesDetails?.databases?.forEach(db => databaseFolderNodes.nodes?.push(createDatabaseNode(db.name, databaseFolderNodes, true)));
      });

      return newRoot;
    });
  }, [databaseSchemas]);

  // disconnect server
  useEffect(() => {
    const connectedServerIds = databaseServerConnections?.map(c => c.connectedResult?.connectionId) || [];

    setRoot(prevRoot => {
      if (!prevRoot) {
        return prevRoot;
      }

      let hasChanges = false;
      const filteredNodes = prevRoot.nodes!.filter(serverNode => {
        if (serverNode.type === NodeType.Server) {
          if (!connectedServerIds.includes(serverNode.id)) {
            hasChanges = true;
            return false;
          }
        }
        return true;
      });

      if (hasChanges) {
        return { ...prevRoot, nodes: filteredNodes };
      }

      return prevRoot;
    });
  }, [databaseServerConnections]);

  // Tables refresh
  useEffect(() => {
    const tablesToRefresh = databaseSchemas?.filter((s) => s.refreshTables);
    if (!tablesToRefresh?.length) {
      return;
    }

    setRoot(prevRoot => {
      if (!prevRoot) {
        return prevRoot;
      }

      const newRoot = { ...prevRoot, nodes: prevRoot.nodes?.map(node => ({ ...node })) || [] };

      function updateTablesForSchema(schema: DatabaseSchema) {
        const serverNode = getServerNodeFromServersNode(newRoot, schema.connectionId);
        if (!serverNode) {
          return;
        }

        const databaseNode = getDatabaseNodeFromServerNode(serverNode, schema.lastUpdatedDatabaseName || '');
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

      tablesToRefresh.forEach((schema) => {
        schema.refreshTables = false;
        updateTablesForSchema(schema);
      });

      return newRoot;
    });
  }, [databaseSchemas]);

  // SP Refresh
  useEffect(() => {
    const databaseSchemasForRresh = databaseSchemas?.filter(s => s.refreshStoredProcedures);
    if (!databaseSchemasForRresh?.length) {
      return;
    }

    setRoot(prevRoot => {
      if (!prevRoot) {
        return prevRoot;
      }

      const newRoot = { ...prevRoot, nodes: prevRoot.nodes?.map(node => ({ ...node })) || [] };

      function updateStoredProceduresForSchema(schema: DatabaseSchema) {
        const serverNode = getServerNodeFromServersNode(newRoot, schema.connectionId);
        if (!serverNode) {
          return;
        }

        const databaseNode = getDatabaseNodeFromServerNode(serverNode, schema.lastUpdatedDatabaseName || '');
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

        storedproceduresFoldersNode.nodes = database.storedProceduresDetails?.procedures?.map(t =>
          createStoredProcedureNode(t.databaseSchema, t.name, storedproceduresFoldersNode)
        ) || [];
      }

      databaseSchemasForRresh.forEach(schema => {
        schema.refreshStoredProcedures = false;
        updateStoredProceduresForSchema(schema);
      });

      return newRoot;
    });
  }, [databaseSchemas]);

  // Functions refresh
  useEffect(() => {
    const databaseSchemasForRresh = databaseSchemas?.filter(s => s.refreshFunctions);
    if (!databaseSchemasForRresh?.length) {
      return;
    }

    setRoot(prevRoot => {
      if (!prevRoot) {
        return prevRoot;
      }

      const newRoot = { ...prevRoot, nodes: prevRoot.nodes?.map(node => ({ ...node })) || [] };

      function updateFunctionsForSchema(schema: DatabaseSchema) {
        const serverNode = getServerNodeFromServersNode(newRoot, schema.connectionId);
        if (!serverNode) {
          return;
        }

        const databaseNode = getDatabaseNodeFromServerNode(serverNode, schema.lastUpdatedDatabaseName || '');
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

        functionsFoldersNode.nodes = database.functionsDetails?.procedures?.map(t =>
          createFunctionNode(t.databaseSchema, t.name, functionsFoldersNode)
        ) || [];
      }

      databaseSchemasForRresh.forEach(schema => {
        schema.refreshFunctions = false;
        updateFunctionsForSchema(schema);
      });

      return newRoot;
    });
  }, [databaseSchemas]);

  return { root };
}