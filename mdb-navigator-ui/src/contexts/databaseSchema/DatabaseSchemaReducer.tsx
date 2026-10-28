import { Draft, produce } from "immer";
import { DatabasesDetails } from "../../models/schema/database/databasesDetails";
import { Database } from "../../models/schema/database/database";
import { DatabaseSchemaActions, DatabaseSchemaActionTypes, DatabaseSchemaErrorScope } from "./DatabaseSchemaActionTypes";

export type DatabaseSchema = {
  connectionId: string;
  isLoading: boolean;
  error: string | null;
  databasesDetails: DatabasesDetails | null,
}

export type DatabaseSchemaState = {
  isLoading: boolean;

  databaseSchemas: DatabaseSchema[] | null;
  error: string | null;
}

export const initialDatabaseConnectState: DatabaseSchemaState = {
  isLoading: false,
  databaseSchemas: null,
  error: null,
};

export type DatabaseConnectContextType = {
  state: DatabaseSchemaState,
  dispatch: React.Dispatch<DatabaseSchemaActions>,
}

function findSchema(draft: Draft<DatabaseSchemaState>, connectionId: string | undefined) {
  return draft.databaseSchemas?.find(s => s.connectionId === connectionId);
}

function findDatabase(draft: Draft<DatabaseSchemaState>, connectionId: string | undefined, databaseName: string | undefined): Draft<Database> | undefined {
  return findSchema(draft, connectionId)?.databasesDetails?.databases.find(db => db.name === databaseName);
}

// immer: cases change the draft directly; produce() returns a new, frozen state (nested objects included).
export function databaseSchemaReducer(state: DatabaseSchemaState, action: DatabaseSchemaActions): DatabaseSchemaState {
  return produce(state, draft => {
    switch(action.type) {
      case DatabaseSchemaActionTypes.Loading:
        draft.isLoading = true;
        break;

      case DatabaseSchemaActionTypes.AddedSchema:
        // Idempotent: a connection never gets a second schema entry.
        if (!findSchema(draft, action.payload.connectionId)) {
          draft.isLoading = false;
          (draft.databaseSchemas ??= []).push(action.payload);
        }
        break;

      case DatabaseSchemaActionTypes.RemovedSchema:
        if (draft.databaseSchemas) {
          draft.databaseSchemas = draft.databaseSchemas.filter(s => s.connectionId !== action.payload);
        }
        break;

      case DatabaseSchemaActionTypes.FetchedDatabases: {
        draft.isLoading = false;
        const schema = findSchema(draft, action.payload.connectionId);
        if (schema) {
          schema.isLoading = false;
          schema.error = null;
          schema.databasesDetails = action.payload;
        }
        break;
      }

      case DatabaseSchemaActionTypes.FetchedTables:
      case DatabaseSchemaActionTypes.FetchedStoredProcedures:
      case DatabaseSchemaActionTypes.FetchedFunctions:
      case DatabaseSchemaActionTypes.FetchedViews: {
        draft.isLoading = false;
        const database = findDatabase(draft, action.payload.connectionId, action.payload.databaseName);
        if (!database) {
          break;
        }

        switch (action.type) {
          case DatabaseSchemaActionTypes.FetchedTables: database.tablesDetails = action.payload; break;
          case DatabaseSchemaActionTypes.FetchedStoredProcedures: database.storedProceduresDetails = action.payload; break;
          case DatabaseSchemaActionTypes.FetchedFunctions: database.functionsDetails = action.payload; break;
          case DatabaseSchemaActionTypes.FetchedViews: database.viewsDetails = action.payload; break;
        }

        const schema = findSchema(draft, action.payload.connectionId)!;
        schema.isLoading = false;
        schema.error = null;
        break;
      }

      case DatabaseSchemaActionTypes.FetchedTableDefinition: {
        draft.isLoading = false;
        const { connectionId, databaseName, databaseSchema, name } = action.payload;
        const database = findDatabase(draft, connectionId, databaseName);
        if (!database) {
          break;
        }

        database.tableDefinitionDetails = (database.tableDefinitionDetails ?? [])
          .filter(t => !(t.databaseSchema === databaseSchema && t.name === name));
        database.tableDefinitionDetails.push(action.payload);
        findSchema(draft, connectionId)!.error = null;
        break;
      }

      case DatabaseSchemaActionTypes.Error: {
        draft.isLoading = false;
        const { message, connectionId, databaseName, scope } = action.payload;

        const schema = connectionId && scope ? findSchema(draft, connectionId) : undefined;
        if (!schema || !schema.databasesDetails) {
          draft.error = message;
          break;
        }

        if (scope === DatabaseSchemaErrorScope.Databases || !databaseName) {
          schema.error = message;
          break;
        }

        const database = findDatabase(draft, connectionId, databaseName);
        if (!database) {
          draft.error = message;
          break;
        }

        switch (scope) {
          case DatabaseSchemaErrorScope.Tables:
            database.tablesDetails = null;
            database.tablesError = message;
            break;
          case DatabaseSchemaErrorScope.TableDefinition:
            // Replace only the failed table's entry; definitions of other tables stay.
            database.tableDefinitionDetails = (database.tableDefinitionDetails ?? []).filter(
              t => !(t.databaseSchema === action.payload.databaseSchema && t.name === action.payload.tableName)
            );
            database.tableDefinitionDetails.push({
              connectionId: connectionId || "",
              databaseName: databaseName || "",
              databaseSchema: action.payload.databaseSchema || "",
              name: action.payload.tableName || "",
              columns: [],
              indexes: [],
              tableDefinitionError: message,
              constraints: [],
            });
            break;
          case DatabaseSchemaErrorScope.Procedures:
            database.storedProceduresDetails = null;
            database.storedProceduresError = message;
            break;
          case DatabaseSchemaErrorScope.Functions:
            database.functionsDetails = null;
            database.functionsError = message;
            break;
          case DatabaseSchemaErrorScope.Views:
            database.viewsDetails = null;
            database.viewsError = message;
            break;
        }
        break;
      }

      case DatabaseSchemaActionTypes.ResetTables:
      case DatabaseSchemaActionTypes.ResetStoredProcedures:
      case DatabaseSchemaActionTypes.ResetFunctions:
      case DatabaseSchemaActionTypes.ResetViews: {
        const database = findDatabase(draft, action.payload.connectionId, action.payload.databaseName);
        if (!database) {
          break;
        }

        switch (action.type) {
          case DatabaseSchemaActionTypes.ResetTables: database.tablesDetails = null; break;
          case DatabaseSchemaActionTypes.ResetStoredProcedures: database.storedProceduresDetails = null; break;
          case DatabaseSchemaActionTypes.ResetFunctions: database.functionsDetails = null; break;
          case DatabaseSchemaActionTypes.ResetViews: database.viewsDetails = null; break;
        }
        break;
      }
    }
  });
}
