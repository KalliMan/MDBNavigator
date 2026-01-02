import { DatabaseCommandResult } from "../../models/databaseCommand/result/databaseCommandResult";
import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import { DatabaseCommandActions, DatabaseCommandActionTypes } from "./DatabaseCommandActionType";
import { DatabaseCommandBatchResult } from "../../models/databaseCommand/result/databaseCommandBatchResult";

export type DatabaseCommand = {
  id: string;
  isExecuting: boolean;
  error: string | null;
  
  query: DatabaseSQLCommandQuery | null;
  result: DatabaseCommandResult | null;
  batchResults: DatabaseCommandBatchResult[];
}

export type DatabaseCommandState = {
  commands: DatabaseCommand[];
}

export const initialDatabaseCommandState: DatabaseCommandState = {
  commands: [],
};

export type DatabaseCommandContextType = {
  state: DatabaseCommandState,
  dispatch: React.Dispatch<DatabaseCommandActions>,
}

export function databaseCommandReducer(state: DatabaseCommandState, action: DatabaseCommandActions): DatabaseCommandState {
  switch(action.type) {
    case DatabaseCommandActionTypes.Executing: {
      const commandId = action.payload;
      const existingCommand = state.commands.find(c => c.id === commandId);
      
      if (existingCommand) {
        return {
          commands: state.commands.map(c => 
            c.id === commandId 
              ? { ...c, isExecuting: true, result: null, batchResults: [], error: null }
              : c
          )
        };
      } else {
        return {
          commands: [...state.commands, {
            id: commandId,
            isExecuting: true,
            error: null,
            query: null,
            result: null,
            batchResults: []
          }]
        };
      }
    }
    
    case DatabaseCommandActionTypes.Queried: {
      const query = action.payload;
      const existingCommand = state.commands.find(c => c.id === query.id);
      
      if (existingCommand) {
        return {
          commands: state.commands.map(c => 
            c.id === query.id 
              ? { ...c, query, result: null, batchResults: [], error: null }
              : c
          )
        };
      } else {
        return {
          commands: [...state.commands, {
            id: query.id,
            isExecuting: false,
            error: null,
            query,
            result: null,
            batchResults: []
          }]
        };
      }
    }
    
    case DatabaseCommandActionTypes.ResultReceived: {
      const result = action.payload;
      return {
        commands: state.commands.map(c => 
          c.id === result.id 
            ? { ...c, isExecuting: false, result, error: null }
            : c
        )
      };
    }
    
    case DatabaseCommandActionTypes.BatchResultReceived: {
      const batchResult = action.payload;
      return {
        commands: state.commands.map(c => 
          c.id === batchResult.id 
            ? { ...c, batchResults: [...c.batchResults, batchResult] }
            : c
        )
      };
    }
    
    case DatabaseCommandActionTypes.Error: {
      const errorMessage = action.payload;
      return {
        commands: state.commands.map(c => 
          c.isExecuting 
            ? { ...c, isExecuting: false, error: errorMessage }
            : c
        )
      };
    }
    
    default:
      console.log("Unsupported Action type");
      return state;
  }
}