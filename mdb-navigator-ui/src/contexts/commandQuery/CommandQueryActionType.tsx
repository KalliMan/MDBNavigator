import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";

export enum CommandQueryActionTypes {
  Queried = 'command/queried',
}

export type CommandQueriedAction = {
  type: CommandQueryActionTypes.Queried;
  payload: DatabaseSQLCommandQuery;
}

export type CommandQueryActions = CommandQueriedAction;
