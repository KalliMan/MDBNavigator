import { DatabaseConnectionInfo } from "../models/connect/databaseConnectInfo";
import { AppGlobalState } from "../types/AppGlobalState";

export enum DatabaseActionTypes {
  Loading = 'loading',
  DatabaseConnected = 'database/connected',
  Connect = 'database/connect',
  Execute = 'database/execute',
  // ADD_NODE = 'ADD',
  // REMOVE_NODE = 'REMOVE',
  // UPDATE_NODE = 'UPDATE'
}

export type LoadingAction = {
  type: DatabaseActionTypes.Loading;
  payload: AppGlobalState;
};

export type DatabaseConnected = {
  type: DatabaseActionTypes.DatabaseConnected;
  payload: DatabaseConnectionInfo;
};

export type ExecuiteAction = {
  type: DatabaseActionTypes.Execute;
  payload: string;
};


export type DatabaseActions =
  LoadingAction
  | DatabaseConnected
  | ExecuiteAction;

