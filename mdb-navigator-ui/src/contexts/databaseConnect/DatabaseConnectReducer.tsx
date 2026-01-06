import { ConnectedResult } from "../../models/connect/connectedResult";
import { ConnectionSettings } from "../../models/connect/connectionSettings";
import { DatabaseConnectActions, DatabaseConnectActionTypes } from "./DatabaseConnectActionTypes";

export type DatabaseConnection = {
  isConnectedToDB: boolean;
  isConnecting: boolean;

  connectionSettings: ConnectionSettings | null;
  connectedResult: ConnectedResult | null;
  error: string | null;
}

export type DatabaseConnectState = {
  isConnecting: boolean;
  connectNewDatabaseServer: boolean;
  error: string | null;

  databaseConnections: DatabaseConnection[];  
}

export const initialDatabaseConnectState: DatabaseConnectState = {
  isConnecting: false,
  connectNewDatabaseServer: false,
  error: null,
  databaseConnections: []
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
        connectNewDatabaseServer: false,
        databaseConnections: [...state.databaseConnections, {
          isConnectedToDB: true,
          isConnecting: false,
          connectionSettings: null,
          error: null,
          connectedResult: action.payload,
        }]
      };
    case DatabaseConnectActionTypes.ConnectNewDatabaseServer:
      return {
        ...state,
        connectNewDatabaseServer: true,        
      };
    case DatabaseConnectActionTypes.Disconnected:
      return {
        ...state,
        isConnecting: false,
        connectNewDatabaseServer: false,        
        databaseConnections: state.databaseConnections.filter(conn => conn.connectedResult?.connectionId === action.payload)
      };
    case DatabaseConnectActionTypes.Error:
      return {
        ...state,
        isConnecting: false,
        connectNewDatabaseServer: false,        
        error: action.payload
      };
      default:
        console.log("Unsupported Action type");
        return state;
  }
}
