import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import { CommandQueryActions, CommandQueryActionTypes } from "./CommandQueryActionType";

// Queries opened from the tree (scripts, definitions); each new entry opens a tab (see MainBar).
export type CommandQueryState = {
  databaseCommandQueries: DatabaseSQLCommandQuery[];
}

export const initialCommandQueryState: CommandQueryState = {
  databaseCommandQueries: [],
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
        databaseCommandQueries: [...state.databaseCommandQueries, action.payload],
      };
    default:
      return state;
  }
}
