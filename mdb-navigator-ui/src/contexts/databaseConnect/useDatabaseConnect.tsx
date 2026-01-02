import { createContext, useContext } from "react";
import { DatabaseConnectContextType } from "./DatabaseConnectReducer";
import { ConnectionSettings } from "../../models/connect/connectionSettings";
import { DatabaseConnectActionTypes } from "./DatabaseConnectActionTypes";
import agent from "../../services/apiAgent";

export const DatabaseConnectContext = createContext<DatabaseConnectContextType | null>(null);

export default function useDatabaseConnectContext() {
  const context = useContext(DatabaseConnectContext);
  if (!context) {
    throw new Error('useDatabaseConnect must be used within a DatabaseConnectProvider');
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
          type:DatabaseConnectActionTypes.Connected,
          payload: connectionSettings
        });
      } else {
        context!.dispatch({
          type:DatabaseConnectActionTypes.Error,
          payload: `Cannot connect to ${connectionSettings.serverName}`
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      console.log('Error during database connection:', errorMessage);
      context!.dispatch({
        type:DatabaseConnectActionTypes.Error,
        payload: errorMessage
      });
    }
  }

  const {isConnecting, isConnectedToDB, error, connectionSettings } = context.state;

  return {isConnecting, isConnectedToDB, error, connectionSettings, connect};
};