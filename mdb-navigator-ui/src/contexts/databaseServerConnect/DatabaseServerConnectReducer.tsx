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

  databaseServerConnections: DatabaseServerConnection[];
}

export const initialDatabaseConnectState: DatabaseConnectState = {
  isConnecting: false,
  connectNewDatabaseServer: false,
  reconnectDatabaseServer: false,
  reconnectDatabaseServerId: null,
  error: null,
  databaseServerConnections: []
};

export type DatabaseServerConnectContextType = {
  state: DatabaseConnectState,
  dispatch: React.Dispatch<DatabaseConnectActions>,
}

export function databaseConnectReducer(state: DatabaseConnectState, action: DatabaseConnectActions): DatabaseConnectState {
  switch(action.type) {
    case DatabaseServerConnectActionTypes.Connecting:
      return {
        ...state,
        connectNewDatabaseServer: false,
        reconnectDatabaseServer: false,
        reconnectDatabaseServerId: null,
        isConnecting: true
      };
    case DatabaseServerConnectActionTypes.Connected:
      return {
        ...state,
        isConnecting: false,
        connectNewDatabaseServer: false,
        reconnectDatabaseServer: false,
        reconnectDatabaseServerId: null,
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
        databaseServerConnections: updatedConnections,
      };
    }
    case DatabaseServerConnectActionTypes.ConnectNewDatabaseServer:
      return {
        ...state,
        connectNewDatabaseServer: true,
        reconnectDatabaseServer: false,
        reconnectDatabaseServerId: null,
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
        connectNewDatabaseServer: false,
        reconnectDatabaseServer: true,
        reconnectDatabaseServerId: action.payload,
      };
    case DatabaseServerConnectActionTypes.Error:
      return {
        ...state,
        isConnecting: false,
        connectNewDatabaseServer: false,
        reconnectDatabaseServer: false,
        reconnectDatabaseServerId: null,
        error: action.payload
      };
      default:
        console.log("Unsupported Action type");
        return state;
  }
}
