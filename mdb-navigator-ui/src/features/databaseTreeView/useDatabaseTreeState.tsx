import { useEffect, useState } from "react";
import { produce } from "immer";
import { TreeViewNodeData } from "../../ui/treeView/TreeViewNodeData";
import { DatabaseSchema } from "../../contexts/databaseSchema/DatabaseSchemaReducer";
import { RefreshFlagType } from "../../contexts/databaseSchema/DatabaseSchemaActionTypes";
import { createDatabaseNode, createDatabasesFolderNode, createServerNode, createServersNode, getServerNodeFromServersNode, updateFunctionsForSchema, updateStoredProceduresForSchema, updateTablesForSchema, updateViewsForSchema } from "./databaseTreeViewUtils";
import { NodeType } from "./NodeType";
import { DatabaseServerConnection } from "../../contexts/databaseServerConnect/DatabaseServerConnectReducer";

export default function useDatabaseTreeState(
  databaseSchemas: DatabaseSchema[] | null,
  databaseServerConnections: DatabaseServerConnection[] | null,
  clearRefreshFlags: (connectionId: string, flags: RefreshFlagType[]) => void
) {
  const [root, setRoot] = useState<TreeViewNodeData | null>(null);

  // Initial Servers load
  useEffect(() => {
    function getServers() {

      const isConnectedToDB = databaseServerConnections && databaseServerConnections.length > 0;
      if (databaseSchemas && isConnectedToDB) {

        setRoot(prevRoot => produce(prevRoot, draft => {
          const connectedResult =
            databaseServerConnections.filter(c => draft && getServerNodeFromServersNode(draft as TreeViewNodeData, c.connectedResult?.connectionId || '')
              ? false
              : true)[0]?.connectedResult;

          if (!connectedResult) {
            return;
          }

          if (!draft) {
            const serversRoot = createServersNode(true);
            const serverNode = createServerNode(connectedResult.connectionId, connectedResult.serverName, true);
            serversRoot.nodes?.push(serverNode);
            return serversRoot;
          }

          if (!draft.nodes) {
            draft.nodes = [];
          }
          const serverNode = createServerNode(connectedResult.connectionId, connectedResult.serverName, true);
          draft.nodes.push(serverNode);
        }));
      }
    }

    getServers();

  }, [databaseSchemas, databaseServerConnections]);

  // Databases refresh
  useEffect(() => {
    const databaseSchemasForRefresh = databaseSchemas?.filter(s => s.refreshDatabases);
    if(!databaseSchemasForRefresh?.length) {
      return;
    }

    setRoot(prevRoot => produce(prevRoot, draft => {
      if (!draft) {
        return;
      }

      const rootDraft = draft as TreeViewNodeData;

      databaseSchemasForRefresh.forEach(schema => {
        const serverNode = getServerNodeFromServersNode(rootDraft, schema.connectionId);
        if (!serverNode) {
          return;
        }

        const databaseFolderNodes = createDatabasesFolderNode(serverNode, true);
        serverNode.nodes = [databaseFolderNodes];

        schema.databasesDetails?.databases?.forEach(db => {
          databaseFolderNodes.nodes?.push(createDatabaseNode(db.name, databaseFolderNodes, true));
        });
      });
    }));

    databaseSchemasForRefresh.forEach(schema => {
      clearRefreshFlags(schema.connectionId, [RefreshFlagType.RefreshDatabases]);
    });
  }, [databaseSchemas, clearRefreshFlags]);

  // disconnect server
  useEffect(() => {
    const connectedServerIds = databaseServerConnections?.map(c => c.connectedResult?.connectionId) || [];

    setRoot(prevRoot => produce(prevRoot, draft => {
      if (!draft || !draft.nodes) {
        return;
      }

      draft.nodes = draft.nodes.filter(serverNode => {
        if (serverNode.type === NodeType.Server) {
          return connectedServerIds.includes(serverNode.id);
        }
        return true;
      });
    }));
  }, [databaseServerConnections]);

  // Tables refresh
  useEffect(() => {
    const tablesToRefresh = databaseSchemas?.filter((s) => s.refreshTables);
    if (!tablesToRefresh?.length) {
      return;
    }

    setRoot(prevRoot => produce(prevRoot, draft => {
      if (!draft) {
        return;
      }

      const rootDraft = draft as TreeViewNodeData;

      tablesToRefresh.forEach((schema) => {
        updateTablesForSchema(rootDraft, schema);
      });
    }));

    tablesToRefresh.forEach((schema) => {
      clearRefreshFlags(schema.connectionId, [RefreshFlagType.RefreshTables]);
    });
  }, [databaseSchemas, clearRefreshFlags]);

  // SP Refresh
  useEffect(() => {
    const databaseSchemasForRefresh = databaseSchemas?.filter(s => s.refreshStoredProcedures);
    if (!databaseSchemasForRefresh?.length) {
      return;
    }

    setRoot(prevRoot => produce(prevRoot, draft => {
      if (!draft) {
        return;
      }

      const rootDraft = draft as TreeViewNodeData;

      databaseSchemasForRefresh.forEach(schema => {
        updateStoredProceduresForSchema(rootDraft, schema);
      });
    }));

    databaseSchemasForRefresh.forEach(schema => {
      clearRefreshFlags(schema.connectionId, [RefreshFlagType.RefreshStoredProcedures]);
    });
  }, [databaseSchemas, clearRefreshFlags]);

  // Functions refresh
  useEffect(() => {
    const databaseSchemasForRefresh = databaseSchemas?.filter(s => s.refreshFunctions);
    if (!databaseSchemasForRefresh?.length) {
      return;
    }

    setRoot(prevRoot => produce(prevRoot, draft => {
      if (!draft) {
        return;
      }

      const rootDraft = draft as TreeViewNodeData;

      databaseSchemasForRefresh.forEach(schema => {
        updateFunctionsForSchema(rootDraft, schema);
      });
    }));

    databaseSchemasForRefresh.forEach(schema => {
      clearRefreshFlags(schema.connectionId, [RefreshFlagType.RefreshFunctions]);
    });
  }, [databaseSchemas, clearRefreshFlags]);

  // Views refresh
  useEffect(() => {
    const databaseSchemasForRefresh = databaseSchemas?.filter(s => s.refreshViews);
    if (!databaseSchemasForRefresh?.length) {
      return;
    }

    setRoot(prevRoot => produce(prevRoot, draft => {
      if (!draft) {
        return;
      }

      const rootDraft = draft as TreeViewNodeData;

      databaseSchemasForRefresh.forEach(schema => {
        updateViewsForSchema(rootDraft, schema);
      });
    }));

    databaseSchemasForRefresh.forEach(schema => {
      clearRefreshFlags(schema.connectionId, [RefreshFlagType.RefreshViews]);
    });
  }, [databaseSchemas, clearRefreshFlags]);
  return { root };
}