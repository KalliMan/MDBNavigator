import { createContext, useContext } from "react";
import { DatabaseServerConnectContextType } from "./DatabaseServerConnectReducer";
import { ConnectionSettings } from "../../models/connect/connectionSettings";
import { DatabaseConnectActionTypes } from "./DatabaseServerConnectActionTypes";
import agent from "../../services/apiAgent";

export const DatabaseServerConnectContext = createContext<DatabaseServerConnectContextType | null>(null);

export default function useDatabaseServerConnectContext() {
  const context = useContext(DatabaseServerConnectContext);
  if (!context) {
    throw new Error('useDatabaseConnect must be used within a DatabaseServerConnectProvider');
  }

  async function connect(connectionSettings: ConnectionSettings) {
    context!.dispatch( {
      type: DatabaseConnectActionTypes.Connecting,
      payload: connectionSettings
    });

    try{
      const result = await agent.databaseConnectionApi.connect(connectionSettings);
      if (result){
        context!.dispatch({
          type: DatabaseConnectActionTypes.Connected,
          payload: result
        });
      } else {
        context!.dispatch({
          type: DatabaseConnectActionTypes.Error,
          payload: `Cannot connect to ${connectionSettings.serverName}`
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      context!.dispatch({
        type: DatabaseConnectActionTypes.Error,
        payload: errorMessage
      });
    }
  }

  function connectNewDatabase() {
    context!.dispatch({
      type: DatabaseConnectActionTypes.ConnectNewDatabaseServer,
    });    
  }

  async function disconnect(connectionId: string) {
    try {
      await agent.databaseConnectionApi.disconnect(connectionId);
      context!.dispatch({
        type: DatabaseConnectActionTypes.Disconnected,
        payload: connectionId
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      context!.dispatch({
        type: DatabaseConnectActionTypes.Error,
        payload: errorMessage
      });
    }
  }

  const {isConnecting, error, connectNewDatabaseServer, databaseServerConnections } = context.state;

  return {
    isConnecting,
    error,
    connectNewDatabaseServer,
    databaseServerConnections,
    connect,
    connectNewDatabase,
    disconnect
  };
};