import { ConnectedResult } from "../../models/connect/connectedResult";
import { ConnectionSettings } from "../../models/connect/connectionSettings";

export enum DatabaseServerConnectActionTypes {
  Connecting = 'database/connecting',
  Connected = 'database/connected',
  ConnectNewDatabaseServer = 'database/connectNewDatabaseServer',
  Disconnected = 'database/disconnected',
  Error = 'database/error'
}

export type DatabaseConnectingAction = {
  type: DatabaseServerConnectActionTypes.Connecting;
  payload: ConnectionSettings;
};

export type DatabaseConnectedAction = {
  type: DatabaseServerConnectActionTypes.Connected;
  payload: ConnectedResult;
};

export type DatabaseConnectNewDatabaseServerAction = {
  type: DatabaseServerConnectActionTypes.ConnectNewDatabaseServer;
};

export type DatabaseDisconnectedAction = {
  type: DatabaseServerConnectActionTypes.Disconnected;
  payload: string; // connectionId
};

export type DatabaseErrorAction = {
  type: DatabaseServerConnectActionTypes.Error;
  payload: string;
};


export type DatabaseConnectActions = DatabaseConnectingAction
| DatabaseConnectedAction
| DatabaseDisconnectedAction
| DatabaseConnectNewDatabaseServerAction
| DatabaseErrorAction;