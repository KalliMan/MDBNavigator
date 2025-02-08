import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";

export enum CommandQueryActionTypes {
  Queried = 'command/queried',
  Error = 'command/error'
}

export type CommandQueriedAction = {
  type: CommandQueryActionTypes.Queried;
  payload: DatabaseSQLCommandQuery;
}

export type CommandQueriedErrorAction = {
  type: CommandQueryActionTypes.Error;
  payload: string;
};

export type CommandQueryActions =
| CommandQueriedAction
| CommandQueriedErrorAction;