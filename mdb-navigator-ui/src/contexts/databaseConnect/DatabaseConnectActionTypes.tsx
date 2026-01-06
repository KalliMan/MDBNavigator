import { ConnectedResult } from "../../models/connect/connectedResult";
import { ConnectionSettings } from "../../models/connect/connectionSettings";

export enum DatabaseConnectActionTypes {
  Connecting = 'database/connecting',
  Connected = 'database/connected',
  ConnectNewDatabaseServer = 'database/connectNewDatabaseServer',
  Disconnected = 'database/disconnected',
  Error = 'database/error'
}

export type DatabaseConnectingAction = {
  type: DatabaseConnectActionTypes.Connecting;
  payload: ConnectionSettings;
};

export type DatabaseConnectedAction = {
  type: DatabaseConnectActionTypes.Connected;
  payload: ConnectedResult;
};

export type DatabaseConnectNewDatabaseServerAction = {
  type: DatabaseConnectActionTypes.ConnectNewDatabaseServer;
};

export type DatabaseDisconnectedAction = {
  type: DatabaseConnectActionTypes.Disconnected;
  payload: string; // connectionId
};

export type DatabaseErrorAction = {
  type: DatabaseConnectActionTypes.Error;
  payload: string;
};


export type DatabaseConnectActions = DatabaseConnectingAction
| DatabaseConnectedAction
| DatabaseDisconnectedAction
| DatabaseConnectNewDatabaseServerAction
| DatabaseErrorAction;