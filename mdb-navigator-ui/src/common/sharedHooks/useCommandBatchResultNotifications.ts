import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";
import { useEffect, useState } from "react";
import LocalSessionStorage from "../../utils/localSessionStorage";
import { DatabaseCommandBatchResult } from "../../models/databaseCommand/result/databaseCommandBatchResult";

interface Props {
  onBatchCommandResult: (result: DatabaseCommandBatchResult) => void;
}

export default function useCommandBatchResultNotifications({
  onBatchCommandResult,
}: Props) {
  const [connectionRef, setConnection] = useState<HubConnection>();

  function createHubConnection() {
    const appId = LocalSessionStorage.getApplicationId();

    const con = new HubConnectionBuilder()
      .withUrl(
        `${import.meta.env.VITE_SIGNALR_URL}/batchCommandResult?applicationId=${appId}`,
        {withCredentials: false}
      )
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    setConnection(con);
  }

  useEffect(() => {
    createHubConnection();
  }, []);

  useEffect(() => {
    if (connectionRef) {
      try {
        connectionRef
          .start()
          .then(() => {
            connectionRef.on("BatchCommandResult", (message) => {
              onBatchCommandResult(message);
            });
          })
          .catch((err) => {
            console.error(`Error: ${err}`);
          });
      } catch (error) {
        console.error(error as Error);
      }
    }

    return () => {
      connectionRef?.stop();
    };
  }, [connectionRef]);
}
