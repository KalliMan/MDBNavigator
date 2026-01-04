import { DatabasesDetails } from "../../models/schema/databasesDetails";
import { DatabaseSchemaActions, DatabaseSchemaActionTypes } from "./DatabaseSchemaActionTypes";

export type DatabaseSchema = {
  connectionId: string;
  isLoading: boolean;
  error: string | null;

  refreshDatabases?: boolean;

  lastUpdatedDatabaseName?: string;
  refreshTables?: boolean;
  refreshStoredProcedures?: boolean;
  refreshFunctions?: boolean;

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
        refreshDatabases: true,
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
        return {...state};
      }

      const database = schema.databasesDetails?.databases.find(db => db.name === action.payload.databaseName);
      if (!database) {
        return {...state};
      }

      database.tablesDetails = action.payload;

      const updatedSchemaTables: DatabaseSchema = {
        ...schema,
        isLoading: false,
        error: null,
        refreshDatabases: false,
        refreshTables: true,
        lastUpdatedDatabaseName: action.payload.databaseName,
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
        return {...state};
      }

      const database = schema.databasesDetails?.databases.find(db => db.name === action.payload.databaseName);
      if (!database) {
        return {...state};
      }

      database.storedProceduresDetails = action.payload;

      const updatedSchemaProcedures: DatabaseSchema = {
        ...schema,
        isLoading: false,
        error: null,
        refreshDatabases: false,
        refreshTables: false,
        refreshStoredProcedures: true,
        lastUpdatedDatabaseName: action.payload.databaseName,
      };

      return {
        ...schema,
        isLoading: false,
        databaseSchemas: state.databaseSchemas!.map(s => s.connectionId === action.payload.connectionId ? updatedSchemaProcedures : s)
      };
    }

    case DatabaseSchemaActionTypes.FetchedFunctions: {
      const schema = state.databaseSchemas?.find(s => s.connectionId === action.payload.connectionId);
      if (!schema) {
        return {...state};
      }

      const database = schema.databasesDetails?.databases.find(db => db.name === action.payload.databaseName);
      if (!database) {
        return {...state};
      }

      database.functionsDetails = action.payload;

      const updatedSchemaProcedures: DatabaseSchema = {
        ...schema,
        isLoading: false,
        error: null,
        refreshDatabases: false,
        refreshTables: false,
        refreshStoredProcedures: false,
        refreshFunctions: true,
        lastUpdatedDatabaseName: action.payload.databaseName,
      };

      return {
        ...schema,
        isLoading: false,
        databaseSchemas: state.databaseSchemas!.map(s => s.connectionId === action.payload.connectionId ? updatedSchemaProcedures : s)
      };
    }

    case DatabaseSchemaActionTypes.Error: {
      
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    }

    default:
      console.log("Unsupported Action type");
      return state;
  }
}