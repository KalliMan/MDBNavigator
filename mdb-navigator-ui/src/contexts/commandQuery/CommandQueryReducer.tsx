import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import { CommandQueryActions, CommandQueryActionTypes } from "./CommandQueryActionType";
import { TreeDatabase } from "../../features/databaseCommand/queryTargets";

// Queries opened from the tree (scripts, definitions); each new entry opens a tab (see MainBar).
export type CommandQueryState = {
  databaseCommandQueries: DatabaseSQLCommandQuery[];
  // The database of the tree node clicked last; the empty workspace's "New query" opens on it.
  lastTreeDatabase: TreeDatabase | null;
}

export const initialCommandQueryState: CommandQueryState = {
  databaseCommandQueries: [],
  lastTreeDatabase: null,
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
    case CommandQueryActionTypes.TreeDatabasePicked:
      // Every tree click dispatches this; an unchanged state must not re-render the workspace.
      if (
        state.lastTreeDatabase?.connectionId === action.payload.connectionId &&
        state.lastTreeDatabase.databaseName === action.payload.databaseName
      ) {
        return state;
      }
      return { ...state, lastTreeDatabase: action.payload };
    default:
      return state;
  }
}
