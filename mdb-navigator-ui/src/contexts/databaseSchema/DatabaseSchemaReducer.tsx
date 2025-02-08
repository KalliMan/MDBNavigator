import { DatabasesDetails } from "../../models/schema/databasesDetails";
import { ProceduresDetails } from "../../models/schema/procedureDetails";
import { TablesDetails } from "../../models/schema/tablesDetails";
import { DatabaseSchemaActions, DatabaseSchemaActionTypes } from "./DatabaseSchemaActionTypes";

export type DatabaseSchemaState = {
  isLoading: boolean;
  error: string | null;

  databasesDetails: DatabasesDetails | null,
  tablesDetails: TablesDetails | null,
  storedProceduresDetails: ProceduresDetails | null,
  functionsDetails: ProceduresDetails | null
}

export const initialDatabaseConnectState: DatabaseSchemaState = {
  isLoading: false,
  error: null,

  databasesDetails: null,
  tablesDetails: null,
  storedProceduresDetails: null,
  functionsDetails: null
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
    case DatabaseSchemaActionTypes.FetchedStoredProcedures:
      return {
        ...state,
        isLoading: false,
        storedProceduresDetails: action.payload
      };
    case DatabaseSchemaActionTypes.FetchedFunctions:
      return {
        ...state,
        isLoading: false,
        functionsDetails: action.payload
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