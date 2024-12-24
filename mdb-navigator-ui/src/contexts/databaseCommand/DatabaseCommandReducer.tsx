import { DatabaseCommandResult } from "../../models/databaseCommand/databaseCommandResult";
import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import { DatabaseCommandActions, DatabaseCommandActionTypes } from "./DatabaseCommandActionType";

export type DatabaseCommandState = {
  isExecuting: boolean;
  error: string | null;

  databaseCommandQueries: DatabaseSQLCommandQuery[];
  databaseCommandResults: DatabaseCommandResult[];
}

export const initialDatabaseCommandState: DatabaseCommandState = {
  isExecuting: false,
  error: null,

  databaseCommandQueries: [],
  databaseCommandResults: []
};

export type DatabaseCommandContextType = {
  state: DatabaseCommandState,
  dispatch: React.Dispatch<DatabaseCommandActions>,
}

export function databaseCommandReducer(state: DatabaseCommandState, action: DatabaseCommandActions): DatabaseCommandState {
  switch(action.type) {
    case DatabaseCommandActionTypes.Executing:
      return {
        ...state,
        isExecuting: true
      };
    case DatabaseCommandActionTypes.Queried:
      return {
        ...state,
        databaseCommandQueries: [...state.databaseCommandQueries?.filter(q => q.id !== action.payload.id) ?? [],
          action.payload]
      };
    case DatabaseCommandActionTypes.ResultReceived:
      return {
        ...state,
        isExecuting: false,
        databaseCommandResults: [...state.databaseCommandResults?.filter(q => q.id !== action.payload.id) ?? [],
        action.payload]
      };
    case DatabaseCommandActionTypes.Error:
      return {
        ...state,
        isExecuting: false,
        error: action.payload
      };
    default:
      console.log("Unsupported Action type");
      return state;
  }
}