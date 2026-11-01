import { ConnectedResult } from "../../models/connect/connectedResult";
import { ConnectionSettings } from "../../models/connect/connectionSettings";
import { DatabaseConnectActions, DatabaseServerConnectActionTypes } from "./DatabaseServerConnectActionTypes";

export type DatabaseServerConnection = {
  isConnectedToDB: boolean;
  isConnecting: boolean;

  connectionSettings: ConnectionSettings | null;
  connectedResult: ConnectedResult | null;
  error: string | null;
}

export type DatabaseConnectState = {
  isConnecting: boolean;
  connectNewDatabaseServer: boolean;
  reconnectDatabaseServer: boolean;
  reconnectDatabaseServerId: string | null;
  error: string | null;
  // After repeated failed connects the server asks for a CAPTCHA (428). The open dialog then shows one for every
  // further attempt, since each needs a new token while the server's wait lasts.
  captchaRequired: boolean;

  databaseServerConnections: DatabaseServerConnection[];
}

export const initialDatabaseConnectState: DatabaseConnectState = {
  isConnecting: false,
  connectNewDatabaseServer: false,
  reconnectDatabaseServer: false,
  reconnectDatabaseServerId: null,
  error: null,
  captchaRequired: false,
  databaseServerConnections: []
};

export type DatabaseServerConnectContextType = {
  state: DatabaseConnectState,
  dispatch: React.Dispatch<DatabaseConnectActions>,
}

export function databaseConnectReducer(state: DatabaseConnectState, action: DatabaseConnectActions): DatabaseConnectState {
  switch(action.type) {
    case DatabaseServerConnectActionTypes.Connecting:
      // The dialog flags stay set: the dialog remains open while connecting and shows the error if it fails.
      return {
        ...state,
        error: null,
        isConnecting: true
      };
    case DatabaseServerConnectActionTypes.Connected:
      return {
        ...state,
        isConnecting: false,
        connectNewDatabaseServer: false,
        reconnectDatabaseServer: false,
        reconnectDatabaseServerId: null,
        captchaRequired: false,
        databaseServerConnections: [...state.databaseServerConnections, {
          isConnectedToDB: true,
          isConnecting: false,
          connectionSettings: null,
          error: null,
          connectedResult: action.payload,
        }]
      };
    case DatabaseServerConnectActionTypes.Reconnected: {
      const updatedConnections = state.databaseServerConnections.map(conn =>
        conn.connectedResult?.connectionId === action.payload.connectionId
          ? {
              isConnectedToDB: true,
              isConnecting: false,
              connectionSettings: null,
              error: null,
              connectedResult: action.payload,
            }
          : conn
      );

      return {
        ...state,
        isConnecting: false,
        connectNewDatabaseServer: false,
        reconnectDatabaseServer: false,
        reconnectDatabaseServerId: null,
        captchaRequired: false,
        databaseServerConnections: updatedConnections,
      };
    }
    case DatabaseServerConnectActionTypes.ConnectNewDatabaseServer:
      return {
        ...state,
        error: null,
        connectNewDatabaseServer: true,
        reconnectDatabaseServer: false,
        reconnectDatabaseServerId: null,
        captchaRequired: false,
      };
    case DatabaseServerConnectActionTypes.Disconnected:
      return {
        ...state,
        isConnecting: false,
        connectNewDatabaseServer: false,
        reconnectDatabaseServer: false,
        reconnectDatabaseServerId: null,
        databaseServerConnections: state.databaseServerConnections.filter(conn => conn.connectedResult?.connectionId !== action.payload)
      };
    case DatabaseServerConnectActionTypes.PromptReconnectWithSettings:
      return {
        ...state,
        error: null,
        connectNewDatabaseServer: false,
        reconnectDatabaseServer: true,
        reconnectDatabaseServerId: action.payload,
        captchaRequired: false,
      };
    case DatabaseServerConnectActionTypes.ConnectDialogCancelled:
      return {
        ...state,
        error: null,
        connectNewDatabaseServer: false,
        reconnectDatabaseServer: false,
        reconnectDatabaseServerId: null,
        captchaRequired: false,
      };
    case DatabaseServerConnectActionTypes.Error:
      // An open connect/reconnect dialog stays open and shows the error.
      return {
        ...state,
        isConnecting: false,
        error: action.payload,
        captchaRequired: state.captchaRequired || !!action.captchaRequired,
      };
      default:
        return state;
  }
}
