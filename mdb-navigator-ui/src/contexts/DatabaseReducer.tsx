import { ConnectionSettings } from "../models/connect/connectionSettings";
import { DatabaseCommandResult } from "../models/databaseCommand/databaseCommandResult";
import { DatabaseSQLCommandQuery } from "../models/databaseCommand/query/databaseSQLCommandQuery";
import { DatabasesDetails } from "../models/schema/databasesDetails";
import { TablesDetails } from "../models/schema/tablesDetails";
import { DatabaseActions, DatabaseActionTypes } from "./DatabaseActionType";

export type DatabaseState = {
  isConnectedToDB: boolean;
  isLoading: boolean;

  connectionSettings: ConnectionSettings | null;
  error: string | null;

  databasesDetails: DatabasesDetails | null;
  tablesDetails: TablesDetails | null;

  databaseCommandQueries: DatabaseSQLCommandQuery[];
  databaseCommantResults: DatabaseCommandResult[];
}

export const databaseInitialState: DatabaseState = {
  isConnectedToDB: false,
  isLoading: false,

  connectionSettings: null,
  error: null,

  databasesDetails: null,
  tablesDetails: null,

  databaseCommandQueries: [],
  databaseCommantResults: []
};

export type DatabaseContextType = {
  state: DatabaseState,
  dispatch: React.Dispatch<DatabaseActions>,
}

export function databaseReducer(state: DatabaseState, action: DatabaseActions): DatabaseState {
  switch(action.type) {
    case DatabaseActionTypes.Loading:
      return {
        ...state,
        isLoading: true
      }
    case DatabaseActionTypes.DatabaseConnected:
      return {
        ...state,
        isLoading: false,
        isConnectedToDB: true,
        connectionSettings: action.payload
      };
    case DatabaseActionTypes.FetchedDatabases:
      return {
        ...state,
        isLoading: false,
        databasesDetails: action.payload
      };
    case DatabaseActionTypes.FetchedTables:
      return {
        ...state,
        isLoading: false,
        tablesDetails: action.payload
      };
    case DatabaseActionTypes.CommandQueried:

      return {
        ...state,
        isLoading: false,
        databaseCommandQueries: [...state.databaseCommandQueries?.filter(q => q.id !== action.payload.id) ?? [],
          action.payload]
      }
    case DatabaseActionTypes.CommandResultReceived:
      return {
        ...state,
          isLoading: false,
          databaseCommantResults: [...state.databaseCommantResults?.filter(q => q.id !== action.payload.id) ?? [],
            action.payload]
      }
    case DatabaseActionTypes.Error:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      }
    default:
      throw new Error(`Unsupported Action type: ${action.type}`);
  }
}