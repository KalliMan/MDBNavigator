import { ConnectedResult } from "../../models/connect/connectedResult";
import { ConnectionSettings } from "../../models/connect/connectionSettings";

export enum DatabaseServerConnectActionTypes {
  Connecting = 'database/connecting',
  Connected = 'database/connected',
  ConnectNewDatabaseServer = 'database/connectNewDatabaseServer',
  PromptReconnectWithSettings = 'database/promptReconnectWithSettings',
  Reconnected = 'database/reconnected',
  Disconnected = 'database/disconnected',
  ConnectDialogCancelled = 'database/connectDialogCancelled',
  Error = 'database/error'
}

export type DatabaseConnectDialogCancelledAction = {
  type: DatabaseServerConnectActionTypes.ConnectDialogCancelled;
};

export type DatabaseConnectingAction = {
  type: DatabaseServerConnectActionTypes.Connecting;
  // Null for a demo guest's connection, whose settings only the server knows.
  payload: ConnectionSettings | null;
};

// Chosen in the connect dialog: the name shown for the connection (null: the server name) and its color
// (null: picked from the server's address).
export type ConnectionDisplay = { name: string | null; color: string | null };

export type DatabaseConnectedAction = {
  type: DatabaseServerConnectActionTypes.Connected;
  payload: ConnectedResult;
  display: ConnectionDisplay;
};

export type DatabaseConnectNewDatabaseServerAction = {
  type: DatabaseServerConnectActionTypes.ConnectNewDatabaseServer;
};

export type DatabaseDisconnectedAction = {
  type: DatabaseServerConnectActionTypes.Disconnected;
  payload: string; // connectionId
};

export type DatabasePromptReconnectWithSettingsAction = {
  type: DatabaseServerConnectActionTypes.PromptReconnectWithSettings;
  payload: string; // connectionId
};

export type DatabaseReconnectedAction = {
  type: DatabaseServerConnectActionTypes.Reconnected;
  payload: ConnectedResult;
};

export type DatabaseErrorAction = {
  type: DatabaseServerConnectActionTypes.Error;
  payload: string;
  // The server answered 428: connecting needs a CAPTCHA from now on.
  captchaRequired?: boolean;
};

export type DatabaseConnectActions = DatabaseConnectingAction
| DatabaseConnectedAction
| DatabaseDisconnectedAction
| DatabaseConnectNewDatabaseServerAction
| DatabaseErrorAction
| DatabasePromptReconnectWithSettingsAction
| DatabaseReconnectedAction
| DatabaseConnectDialogCancelledAction;