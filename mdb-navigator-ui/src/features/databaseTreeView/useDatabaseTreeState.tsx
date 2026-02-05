import { useEffect, useState } from "react";
import { TreeViewNodeData } from "../../ui/treeView/TreeViewNodeData";
import { DatabaseSchema } from "../../contexts/databaseSchema/DatabaseSchemaReducer";
import {
  createDatabaseNode,
  createDatabasesFolderNode,
  createFunctionNode,
  createServerNode,
  createServersNode,
  createStoredProcedureNode,
  createTableNode,
  createViewNode,
  createErrorNode,
  getFunctionsNode,
  getStoredProceduresNode,
  getTablesFolderNode,
  getViewsFolderNode,
  createTableColumnsFolderNode,
  createTableIndexesFolderNode,
  createTableColumnNode,
  createTableIndexNode,
  createTableConstraintsFolderNode,
  createTableConstraintNode,
} from "./databaseTreeViewUtils";
import { DatabaseServerConnection } from "../../contexts/databaseServerConnect/DatabaseServerConnectReducer";
import TableDefinition from "../../models/schema/table/tableDefinitionDetails";

export default function useDatabaseTreeState(
  databaseSchemas: DatabaseSchema[] | null,
  databaseServerConnections: DatabaseServerConnection[] | null,
) {
  const [root, setRoot] = useState<TreeViewNodeData | null>(null);

  useEffect(() => {
  if (!databaseServerConnections || databaseServerConnections.length === 0) {
    setRoot(null);
    return;
  }

  const serversRoot = createServersNode(true);
  serversRoot.nodes = [];

  databaseServerConnections.forEach((connection) => {
    const connectedResult = connection.connectedResult;
    if (!connectedResult) {
      return;
    }

    const { connectionId, serverName } = connectedResult;
    const serverNode = createServerNode(connectionId, serverName, true);
    serversRoot.nodes!.push(serverNode);

    const schema = databaseSchemas?.find(
      (s) => s.connectionId === connectionId
    );

    if (!schema || !schema.databasesDetails) {
      return;
    }

    const databasesFolder = createDatabasesFolderNode(serverNode, true);
    serverNode.nodes!.push(databasesFolder);

    schema.databasesDetails.databases?.forEach((db) => {
      const dbNode = createDatabaseNode(db.name, databasesFolder, false);
      databasesFolder.nodes!.push(dbNode);

      // Tables --> TODDO Add the definition loading state
      const tablesFolder = getTablesFolderNode(dbNode);
      if (tablesFolder) {
        if (db.tablesDetails?.tables) {
          tablesFolder.nodes =
            db.tablesDetails.tables.map((t) => {
              const tableDefinitionDetails = db.tableDefinitionDetails?.find(td => td.databaseSchema === t.databaseSchema && td.name === t.name) || null;
              const recreateTableNode = createTableNode(t.databaseSchema, t.name, tablesFolder, tableDefinitionDetails === null);

              if (tableDefinitionDetails && !tableDefinitionDetails.tableDefinitionError) {
                const definitionNodes = createTableDefinitionNodes(tableDefinitionDetails, recreateTableNode);
                recreateTableNode.nodes!.push(...definitionNodes);
              } else { if (tableDefinitionDetails && tableDefinitionDetails.tableDefinitionError) {
                const errorNode = createErrorNode(recreateTableNode, `Error loading table definition: ${tableDefinitionDetails.tableDefinitionError}`);
                recreateTableNode.nodes = [errorNode];
              }}
              return recreateTableNode;
            }) ?? [];

        } else if (db.tablesError) {
          tablesFolder.nodes = [
            createErrorNode(tablesFolder, `Error loading tables: ${db.tablesError}`),
          ];
        }
      }

      // Stored Procedures
      const spFolder = getStoredProceduresNode(dbNode);
      if (spFolder) {
        if (db.storedProceduresDetails?.procedures) {
          spFolder.nodes =
            db.storedProceduresDetails.procedures.map((p) =>
              createStoredProcedureNode(p.databaseSchema, p.name, spFolder)
            ) ?? [];
        } else if (db.storedProceduresError) {
          spFolder.nodes = [
            createErrorNode(
              spFolder,
              `Error loading procedures: ${db.storedProceduresError}`
            ),
          ];
        }
      }

      // Functions
      const functionsFolder = getFunctionsNode(dbNode);
      if (functionsFolder) {
        if (db.functionsDetails?.procedures) {
          functionsFolder.nodes =
            db.functionsDetails.procedures.map((f) =>
              createFunctionNode(f.databaseSchema, f.name, functionsFolder)
            ) ?? [];
        } else if (db.functionsError) {
          functionsFolder.nodes = [
            createErrorNode(
              functionsFolder,
              `Error loading functions: ${db.functionsError}`
            ),
          ];
        }
      }

      // Views
      const viewsFolder = getViewsFolderNode(dbNode);
      if (viewsFolder) {
        if (db.viewsDetails?.views) {
          viewsFolder.nodes =
            db.viewsDetails.views.map((v) =>
              createViewNode(v.databaseSchema, v.name, viewsFolder)
            ) ?? [];
        } else if (db.viewsError) {
          viewsFolder.nodes = [
            createErrorNode(viewsFolder, `Error loading views: ${db.viewsError}`),
          ];
        }
      }
    });
  });

  setRoot(serversRoot);
}, [databaseServerConnections, databaseSchemas]);


  function createTableDefinitionNodes(tableDefinitionDetails: TableDefinition, tableNode: TreeViewNodeData): TreeViewNodeData[] {
    const columnsNode: TreeViewNodeData = createTableColumnsFolderNode(tableNode);
    if (tableDefinitionDetails.columns) {
      columnsNode.nodes = tableDefinitionDetails.columns.map((col) =>
        createTableColumnNode(col.columnName, col.dataType, col.maxLength, col.isNullable, col, columnsNode));
    }

    const indexesNode: TreeViewNodeData = createTableIndexesFolderNode(tableNode);
    if (tableDefinitionDetails.indexes) {
      indexesNode.nodes = tableDefinitionDetails.indexes.map((idx) =>
        createTableIndexNode(idx.indexName, idx.isUnique, idx, indexesNode));
    };

    const constraintsNode: TreeViewNodeData = createTableConstraintsFolderNode(tableNode);
    if (tableDefinitionDetails.constraints) {
      constraintsNode.nodes = tableDefinitionDetails.constraints.map(constraint =>
        createTableConstraintNode(constraint.constraintName, constraint.constraintType, constraint, constraintsNode));
    }



    return [columnsNode, indexesNode, constraintsNode];
  }

  return { root };
}