import { DatabaseConnectionInfo } from "../models/connect/databaseConnectInfo";
import { AppGlobalState } from "../types/AppGlobalState";
import { DatabaseActions, DatabaseActionTypes } from "./DatabaseActionType";

export type DatabaseState = {
  appState: AppGlobalState;
  databaseConnectionInfo?: DatabaseConnectionInfo | null;
  isLoading: boolean;
}

export const databaseInitialState: DatabaseState = {
  appState: AppGlobalState.Initial,
  databaseConnectionInfo: null,
  isLoading: false,
};

export type DatabaseContextType = {
  state: DatabaseState,
  dispatch: React.Dispatch<DatabaseActions>,
}

export function databaseReducer(state: DatabaseState, action: DatabaseActions): DatabaseState {
  switch(action.type) {
    case DatabaseActionTypes.Loading:
      return {
        ...state,
        appState: action.payload
      }
    case DatabaseActionTypes.DatabaseConnected:
      return {
        ...state,
        appState: AppGlobalState.Connected,
        databaseConnectionInfo: action.payload
      }
    default:
      throw new Error('Unsupported Action type');
  }
}