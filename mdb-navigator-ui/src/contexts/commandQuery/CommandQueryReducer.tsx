import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import { CommandQueryActions, CommandQueryActionTypes } from "./CommandQueryActionType";

export type CommandQueryState = {
  isExecuting: boolean;
  executingCommandId: string | null;
  error: string | null;

  databaseCommandQueries: DatabaseSQLCommandQuery | null;
}

export const initialCommandQueryState: CommandQueryState = {
  isExecuting: false,
  executingCommandId: null,
  error: null,

  databaseCommandQueries: null,
};

export type CommandQueryContextType = {
  state: CommandQueryState,
  dispatch: React.Dispatch<CommandQueryActions>,
}

export function commandQueryReducer(state: CommandQueryState, action: CommandQueryActions): CommandQueryState {
  switch(action.type) {

    case CommandQueryActionTypes.Queried:
      return {
        ...state,
        databaseCommandQueries: {...action.payload},
      };
    case CommandQueryActionTypes.Error:
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