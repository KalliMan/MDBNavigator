import { ConnectionSettings } from "../../models/connect/connectionSettings";

export enum DatabaseConnectActionTypes {
  Connecting = 'database/connecting',
  Connected = 'database/connected',
  Disconnected = 'database/disconnected',
  Error = 'database/error'
}

export type DatabaseConnectingAction = {
  type: DatabaseConnectActionTypes.Connecting;
  payload: ConnectionSettings;
};

export type DatabaseConnectedAction = {
  type: DatabaseConnectActionTypes.Connected;
  payload: ConnectionSettings;
};

export type DatabaseDisconnectedAction = {
  type: DatabaseConnectActionTypes.Disconnected;
};

export type DatabaseErrorAction = {
  type: DatabaseConnectActionTypes.Error;
  payload: string;
};


export type DatabaseConnectActions = DatabaseConnectingAction
| DatabaseConnectedAction
| DatabaseDisconnectedAction
| DatabaseErrorAction;