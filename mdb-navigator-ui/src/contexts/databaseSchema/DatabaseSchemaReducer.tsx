import { DatabasesDetails } from "../../models/schema/databasesDetails";
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

export function databaseSchemaReducer(state: DatabaseSchemaState, action: DatabaseSchemaActions): DatabaseSchemaState {

  switch(action.type) {
    case DatabaseSchemaActionTypes.Loading:
      return {
        ...state,
        isLoading: true
      };

    case DatabaseSchemaActionTypes.AddedSchema:
      return {
        ...state,
        isLoading: false,
        databaseSchemas: state.databaseSchemas ? [...state.databaseSchemas, action.payload] : [action.payload]
      };

    case DatabaseSchemaActionTypes.FetchedDatabases: {
      const schema = state.databaseSchemas?.find(s => s.connectionId === action.payload.connectionId);

      if (!schema) {
        return { ...state };
      }

      const updatedSchema: DatabaseSchema = {
        ...schema,
        isLoading: false,
        error: null,
        databasesDetails: action.payload
      };

      return {
        ...state,
        isLoading: false,
        databaseSchemas: state.databaseSchemas!.map(s => s.connectionId === action.payload.connectionId ? updatedSchema : s)
      };
    }

    case DatabaseSchemaActionTypes.FetchedTables: {
      const schema = state.databaseSchemas?.find(s => s.connectionId === action.payload.connectionId);
      if (!schema) {
        return { ...state, isLoading: false };
      }

      const database = schema.databasesDetails?.databases.find(db => db.name === action.payload.databaseName);
      if (!database) {
        return { ...state, isLoading: false };
      }

      database.tablesDetails = action.payload;

      const updatedSchemaTables: DatabaseSchema = {
        ...schema,
        isLoading: false,
        error: null,
      };

      return {
        ...state,
        isLoading: false,
        databaseSchemas: state.databaseSchemas!.map(s => s.connectionId === action.payload.connectionId ? updatedSchemaTables : s)
      };
    }

    case DatabaseSchemaActionTypes.FetchedStoredProcedures: {
      const schema = state.databaseSchemas?.find(s => s.connectionId === action.payload.connectionId);
      if (!schema) {
        return { ...state, isLoading: false };
      }

      const database = schema.databasesDetails?.databases.find(db => db.name === action.payload.databaseName);
      if (!database) {
        return { ...state, isLoading: false };
      }

      database.storedProceduresDetails = action.payload;

      const updatedSchemaProcedures: DatabaseSchema = {
        ...schema,
        isLoading: false,
        error: null,
      };

      return {
        ...state,
        isLoading: false,
        databaseSchemas: state.databaseSchemas!.map(s => s.connectionId === action.payload.connectionId ? updatedSchemaProcedures : s)
      };
    }

    case DatabaseSchemaActionTypes.FetchedFunctions: {
      const schema = state.databaseSchemas?.find(s => s.connectionId === action.payload.connectionId);
      if (!schema) {
        return { ...state, isLoading: false };
      }

      const database = schema.databasesDetails?.databases.find(db => db.name === action.payload.databaseName);
      if (!database) {
        return { ...state, isLoading: false };
      }

      database.functionsDetails = action.payload;

      const updatedSchemaProcedures: DatabaseSchema = {
        ...schema,
        isLoading: false,
        error: null,
      };

      return {
        ...state,
        isLoading: false,
        databaseSchemas: state.databaseSchemas!.map(s => s.connectionId === action.payload.connectionId ? updatedSchemaProcedures : s)
      };
    }

    case DatabaseSchemaActionTypes.FetchedViews: {
      const schema = state.databaseSchemas?.find(s => s.connectionId === action.payload.connectionId);

      if (!schema) {
        return { ...state, isLoading: false };
      }

      const database = schema.databasesDetails?.databases.find(db => db.name === action.payload.databaseName);
      if (!database) {
        return { ...state, isLoading: false };
      }

      database.viewsDetails = action.payload;
      const updatedSchemaViews: DatabaseSchema = {
        ...schema,
        isLoading: false,
        error: null,
      };

      return {
        ...state,
        isLoading: false,
        databaseSchemas: state.databaseSchemas!.map(s => s.connectionId === action.payload.connectionId ? updatedSchemaViews : s)
      };
    }

    case DatabaseSchemaActionTypes.Error: {
      const { message, connectionId, databaseName, scope } = action.payload;

      if (!connectionId || !scope) {
        return {
          ...state,
          isLoading: false,
          error: message,
        };
      }

      const schema = state.databaseSchemas?.find((s) => s.connectionId === connectionId);
      if (!schema || !schema.databasesDetails) {
        return {
          ...state,
          isLoading: false,
          error: message,
        };
      }

      if (scope === DatabaseSchemaErrorScope.Databases || !databaseName) {
        return {
          ...state,
          isLoading: false,
          databaseSchemas:
            state.databaseSchemas?.map((s) =>
              s.connectionId === connectionId ? { ...schema, error: message } : s
            ) || null,
        };
      }

      const database = schema.databasesDetails.databases.find((db) => db.name === databaseName);
      if (!database) {
        return {
          ...state,
          isLoading: false,
          error: message,
        };
      }

      switch (scope) {
        case DatabaseSchemaErrorScope.Tables:
          database.tablesDetails = null;
          database.tablesError = message;
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

      return {
        ...state,
        isLoading: false,
        databaseSchemas:
          state.databaseSchemas?.map((s) =>
            s.connectionId === connectionId ? { ...schema } : s
          ) || null,
      };
    }

    case DatabaseSchemaActionTypes.ResetTables: {
      const schema = state.databaseSchemas?.find(
        (s) => s.connectionId === action.payload.connectionId
      );
      if (!schema || !schema.databasesDetails) {
        return state;
      }

      const database = schema.databasesDetails.databases.find(
        (db) => db.name === action.payload.databaseName
      );
      if (!database) {
        return state;
      }

      database.tablesDetails = null;

      return {
        ...state,
        databaseSchemas: state.databaseSchemas?.map((s) =>
          s.connectionId === action.payload.connectionId ? { ...schema } : s
        ) || null,
      };
    }

    case DatabaseSchemaActionTypes.ResetStoredProcedures: {
      const schema = state.databaseSchemas?.find(
        (s) => s.connectionId === action.payload.connectionId
      );
      if (!schema || !schema.databasesDetails) {
        return state;
      }

      const database = schema.databasesDetails.databases.find(
        (db) => db.name === action.payload.databaseName
      );
      if (!database) {
        return state;
      }

      database.storedProceduresDetails = null;

      return {
        ...state,
        databaseSchemas: state.databaseSchemas?.map((s) =>
          s.connectionId === action.payload.connectionId ? { ...schema } : s
        ) || null,
      };
    }

    case DatabaseSchemaActionTypes.ResetFunctions: {
      const schema = state.databaseSchemas?.find(
        (s) => s.connectionId === action.payload.connectionId
      );
      if (!schema || !schema.databasesDetails) {
        return state;
      }

      const database = schema.databasesDetails.databases.find(
        (db) => db.name === action.payload.databaseName
      );
      if (!database) {
        return state;
      }

      database.functionsDetails = null;

      return {
        ...state,
        databaseSchemas: state.databaseSchemas?.map((s) =>
          s.connectionId === action.payload.connectionId ? { ...schema } : s
        ) || null,
      };
    }

    case DatabaseSchemaActionTypes.ResetViews: {
      const schema = state.databaseSchemas?.find(
        (s) => s.connectionId === action.payload.connectionId
      );
      if (!schema || !schema.databasesDetails) {
        return state;
      }

      const database = schema.databasesDetails.databases.find(
        (db) => db.name === action.payload.databaseName
      );
      if (!database) {
        return state;
      }

      database.viewsDetails = null;

      return {
        ...state,
        databaseSchemas: state.databaseSchemas?.map((s) =>
          s.connectionId === action.payload.connectionId ? { ...schema } : s
        ) || null,
      };
    }

    default:
      console.log("Unsupported Action type");
      return state;
  }
}