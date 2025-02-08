import { ConnectionSettings } from "../../models/connect/connectionSettings";
import { DatabaseConnectActions, DatabaseConnectActionTypes } from "./DatabaseConnectActionTypes";

export type DatabaseConnectState = {
  isConnectedToDB: boolean;
  isConnecting: boolean;

  connectionSettings: ConnectionSettings | null;
  error: string | null;
}

export const initialDatabaseConnectState: DatabaseConnectState = {
  isConnectedToDB: false,
  isConnecting: false,

  connectionSettings: null,
  error: null,
};

export type DatabaseConnectContextType = {
  state: DatabaseConnectState,
  dispatch: React.Dispatch<DatabaseConnectActions>,
}

export function databaseConnectReducer(state: DatabaseConnectState, action: DatabaseConnectActions): DatabaseConnectState {
  switch(action.type) {
    case DatabaseConnectActionTypes.Connecting:
      return {
        ...state,
        isConnecting: true
      };
    case DatabaseConnectActionTypes.Connected:
      return {
        ...state,
        isConnecting: false,
        isConnectedToDB: true,
        connectionSettings: action.payload
      };
    case DatabaseConnectActionTypes.Disconnected:
      return {
        ...state,
        isConnecting: false,
        isConnectedToDB: false,
        connectionSettings: null
      };
    case DatabaseConnectActionTypes.Error:
      return {
        ...state,
        isConnecting: false,
        isConnectedToDB: false,
        error: action.payload
      };
      default:
        console.log("Unsupported Action type");
        return state;
  }
}
