import { createContext, useContext } from "react";
import { DatabaseServerConnectContextType } from "./DatabaseServerConnectReducer";
import { ConnectionSettings } from "../../models/connect/connectionSettings";
import { DatabaseServerConnectActionTypes } from "./DatabaseServerConnectActionTypes";
import agent from "../../services/apiAgent";

export const DatabaseServerConnectContext = createContext<DatabaseServerConnectContextType | null>(null);

export default function useDatabaseServerConnectContext() {
  const context = useContext(DatabaseServerConnectContext);
  if (!context) {
    throw new Error('useDatabaseConnect must be used within a DatabaseServerConnectProvider');
  }

  async function connect(connectionSettings: ConnectionSettings) {
    context!.dispatch( {
      type: DatabaseServerConnectActionTypes.Connecting,
      payload: connectionSettings
    });

    try{
      const result = await agent.databaseConnectionApi.connect(connectionSettings);
      if (result){
        context!.dispatch({
          type: DatabaseServerConnectActionTypes.Connected,
          payload: result
        });
      } else {
        context!.dispatch({
          type: DatabaseServerConnectActionTypes.Error,
          payload: `Cannot connect to ${connectionSettings.serverName}`
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      context!.dispatch({
        type: DatabaseServerConnectActionTypes.Error,
        payload: errorMessage
      });
    }
  }

  async function promptReconnectWithSettings(connectionId: string) {
    try {
      context!.dispatch({
        type: DatabaseServerConnectActionTypes.PromptReconnectWithSettings,
        payload: connectionId
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      context!.dispatch({
        type: DatabaseServerConnectActionTypes.Error,
        payload: errorMessage
      });
    }
  }

  async function reconnect(connectionId: string, connectionSettings: ConnectionSettings) {
    try {
      context!.dispatch({
        type: DatabaseServerConnectActionTypes.Connecting,
        payload: connectionSettings
      });

      const result = await agent.databaseConnectionApi.reconnect(connectionId, connectionSettings);
      if (result) {
        context!.dispatch({
          type: DatabaseServerConnectActionTypes.Reconnected,
          payload: result
        });
      } else {
        context!.dispatch({
          type: DatabaseServerConnectActionTypes.Error,
          payload: `Cannot reconnect to ${connectionSettings.serverName}`
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      context!.dispatch({
        type: DatabaseServerConnectActionTypes.Error,
        payload: errorMessage
      });
    }
  }

  function connectNewDatabase() {
    context!.dispatch({
      type: DatabaseServerConnectActionTypes.ConnectNewDatabaseServer,
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      context!.dispatch({
        type: DatabaseServerConnectActionTypes.Error,
        payload: errorMessage
      });
    }
  }

  const {isConnecting, error, connectNewDatabaseServer, databaseServerConnections, reconnectDatabaseServer, reconnectDatabaseServerId } = context.state;

  return {
    isConnecting,
    error,
    connectNewDatabaseServer,
    databaseServerConnections,
    reconnectDatabaseServer,
    reconnectDatabaseServerId,
    connect,
    connectNewDatabase,
    disconnect,
    promptReconnectWithSettings,
    reconnect,
  };
};