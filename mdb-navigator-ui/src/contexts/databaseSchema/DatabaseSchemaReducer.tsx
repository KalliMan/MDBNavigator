import { DatabasesDetails } from "../../models/schema/databasesDetails";
import { TablesDetails } from "../../models/schema/tablesDetails";
import { DatabaseSchemaActions, DatabaseSchemaActionTypes } from "./DatabaseSchemaActionTypes";

export type DatabaseSchemaState = {
  isLoading: boolean;
  error: string | null;

  databasesDetails: DatabasesDetails | null,
  tablesDetails: TablesDetails | null,
}

export const initialDatabaseConnectState: DatabaseSchemaState = {
  isLoading: false,
  error: null,

  databasesDetails: null,
  tablesDetails: null
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
    case DatabaseSchemaActionTypes.FetchedDatabases:
      return {
        ...state,
        isLoading: false,
        databasesDetails: action.payload
      };
    case DatabaseSchemaActionTypes.FetchedTables:
      return {
        ...state,
        isLoading: false,
        tablesDetails: action.payload
      };
    case DatabaseSchemaActionTypes.Error:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    default:
      console.log("Unsupported Action type");
      return state;
  }
}