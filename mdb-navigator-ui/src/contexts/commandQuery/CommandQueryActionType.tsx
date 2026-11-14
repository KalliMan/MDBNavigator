import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import { TreeDatabase } from "../../features/databaseCommand/queryTargets";

export enum CommandQueryActionTypes {
  Queried = 'command/queried',
  TreeDatabasePicked = 'command/treeDatabasePicked',
}

export type CommandQueriedAction = {
  type: CommandQueryActionTypes.Queried;
  payload: DatabaseSQLCommandQuery;
}

export type CommandTreeDatabasePickedAction = {
  type: CommandQueryActionTypes.TreeDatabasePicked;
  payload: TreeDatabase;
}

export type CommandQueryActions = CommandQueriedAction | CommandTreeDatabasePickedAction;
