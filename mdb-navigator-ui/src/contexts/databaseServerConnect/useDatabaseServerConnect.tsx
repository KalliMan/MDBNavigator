import { createContext, useContext } from "react";
import { DatabaseServerConnectContextType } from "./DatabaseServerConnectReducer";
import { ConnectionSettings } from "../../models/connect/connectionSettings";
import { ConnectionDisplay, DatabaseServerConnectActionTypes } from "./DatabaseServerConnectActionTypes";
import agent, { isCaptchaRequired } from "../../services/apiAgent";
import { getErrorMessage } from "../../utils/errorMessage";

export const DatabaseServerConnectContext = createContext<DatabaseServerConnectContextType | null>(null);

export default function useDatabaseServerConnectContext() {
  const context = useContext(DatabaseServerConnectContext);
  if (!context) {
    throw new Error('useDatabaseConnect must be used within a DatabaseServerConnectProvider');
  }

  // captchaToken: set once the server asked for a CAPTCHA (state.captchaRequired).
  // Resolves true once connected, false on every error (the dialog shows it). The connect dialog uses that to
  // save the connection only after it worked.
  async function connect(connectionSettings: ConnectionSettings, captchaToken: string | null | undefined, display: ConnectionDisplay): Promise<boolean> {
    context!.dispatch( {
      type: DatabaseServerConnectActionTypes.Connecting,
      payload: connectionSettings
    });

    try{
      const result = await agent.databaseConnectionApi.connect(connectionSettings, captchaToken);
      if (result){
        context!.dispatch({
          type: DatabaseServerConnectActionTypes.Connected,
          payload: result,
          display
        });
        return true;
      }
      context!.dispatch({
        type: DatabaseServerConnectActionTypes.Error,
        payload: `Cannot connect to ${connectionSettings.serverName}`
      });
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      context!.dispatch({
        type: DatabaseServerConnectActionTypes.Error,
        payload: errorMessage,
        captchaRequired: isCaptchaRequired(error)
      });
    }
    return false;
  }

  // Only opens the reconnect dialog; the request happens in reconnect().
  function promptReconnectWithSettings(connectionId: string) {
    context!.dispatch({
      type: DatabaseServerConnectActionTypes.PromptReconnectWithSettings,
      payload: connectionId
    });
  }

  async function reconnect(connectionId: string, connectionSettings: ConnectionSettings, captchaToken?: string | null): Promise<boolean> {
    try {
      context!.dispatch({
        type: DatabaseServerConnectActionTypes.Connecting,
        payload: connectionSettings
      });

      const result = await agent.databaseConnectionApi.reconnect(connectionId, connectionSettings, captchaToken);
      if (result) {
        context!.dispatch({
          type: DatabaseServerConnectActionTypes.Reconnected,
          payload: result
        });
        return true;
      }
      context!.dispatch({
        type: DatabaseServerConnectActionTypes.Error,
        payload: `Cannot reconnect to ${connectionSettings.serverName}`
      });
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      context!.dispatch({
        type: DatabaseServerConnectActionTypes.Error,
        payload: errorMessage,
        captchaRequired: isCaptchaRequired(error)
      });
    }
    return false;
  }

  function connectNewDatabase() {
    context!.dispatch({
      type: DatabaseServerConnectActionTypes.ConnectNewDatabaseServer,
    });
  }

  function cancelConnectDialog() {
    context!.dispatch({
      type: DatabaseServerConnectActionTypes.ConnectDialogCancelled,
    });
  }

  async function disconnect(connectionId: string) {
    try {
      await agent.databaseConnectionApi.disconnect(connectionId);
      context!.dispatch({
        type: DatabaseServerConnectActionTypes.Disconnected,
        payload: connectionId
      });
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      context!.dispatch({
        type: DatabaseServerConnectActionTypes.Error,
        payload: errorMessage
      });
    }
  }

  const {isConnecting, error, captchaRequired, connectNewDatabaseServer, databaseServerConnections, reconnectDatabaseServer, reconnectDatabaseServerId } = context.state;

  return {
    isConnecting,
    error,
    captchaRequired,
    connectNewDatabaseServer,
    databaseServerConnections,
    reconnectDatabaseServer,
    reconnectDatabaseServerId,
    connect,
    connectNewDatabase,
    cancelConnectDialog,
    disconnect,
    promptReconnectWithSettings,
    reconnect,
  };
};