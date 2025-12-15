import { DatabaseCommandResult } from "../../models/databaseCommand/result/databaseCommandResult";
import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import { DatabaseCommandActions, DatabaseCommandActionTypes } from "./DatabaseCommandActionType";
import { DatabaseCommandBatchResult } from "../../models/databaseCommand/result/databaseCommandBatchResult";

export type DatabaseCommandState = {
  isExecuting: boolean;
  executingCommandId: string | null;
  error: string | null;

  databaseCommandQueries: DatabaseSQLCommandQuery[];
  databaseCommandResults: DatabaseCommandResult[];
  databaseCommandBatchResults: DatabaseCommandBatchResult[];

}

export const initialDatabaseCommandState: DatabaseCommandState = {
  isExecuting: false,
  executingCommandId: null,
  error: null,

  databaseCommandQueries: [],
  databaseCommandResults: [],
  databaseCommandBatchResults: [],
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
        isExecuting: true,
        executingCommandId: action.payload,
        databaseCommandResults: state.databaseCommandResults?.filter(q => q.id !== action.payload),
        databaseCommandBatchResults: state.databaseCommandBatchResults?.filter(q => q.id !== action.payload),
      };
    case DatabaseCommandActionTypes.Queried:
      return {
        ...state,
        databaseCommandQueries: [...state.databaseCommandQueries?.filter(q => q.id !== action.payload.id) ?? [],
          action.payload],
        databaseCommandResults: state.databaseCommandResults?.filter(q => q.id !== action.payload.id),
        databaseCommandBatchResults: state.databaseCommandBatchResults?.filter(q => q.id !== action.payload.id),
      };
    case DatabaseCommandActionTypes.ResultReceived:
      return {
        ...state,
        isExecuting: false,
        executingCommandId: null,
        databaseCommandResults: [...state.databaseCommandResults?.filter(q => q.id !== action.payload.id) ?? [],
          action.payload],
      };
    case DatabaseCommandActionTypes.BatchResultReceived:

      return {
        ...state,
        isExecuting: false,
        executingCommandId: null,
        databaseCommandBatchResults: [...state.databaseCommandBatchResults, action.payload]
      };    
    case DatabaseCommandActionTypes.Error:
      return {
        ...state,
        isExecuting: false,
        executingCommandId: null,
        error: action.payload
      };
    default:
      console.log("Unsupported Action type");
      return state;
  }
}