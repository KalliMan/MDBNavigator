import { useEffect, useRef } from "react";
import { DatabaseCommandBatchResult } from "../../models/databaseCommand/result/databaseCommandBatchResult";
import { CommandFinishedResult } from "../../models/databaseCommand/result/commandFinishedResult";
import { getHubConnection, HubStatus, startHub, subscribeHubStatus } from "../../services/commandResultHub";

interface Props {
  onBatchCommandResult: (result: DatabaseCommandBatchResult) => void;
  onCommandFinished: (result: CommandFinishedResult) => void;
  onHubStatusChanged: (status: HubStatus) => void;
}

export default function useCommandBatchResultNotifications(props: Props) {
  // Handlers are read through a ref so the subscription is set up once and never goes stale.
  const handlersRef = useRef(props);
  useEffect(() => {
    handlersRef.current = props;
  });

  useEffect(() => {
    const connection = getHubConnection();
    const onBatch = (message: DatabaseCommandBatchResult) => handlersRef.current.onBatchCommandResult(message);
    const onFinished = (message: CommandFinishedResult) => handlersRef.current.onCommandFinished(message);

    // Handlers are registered before start() so no message can arrive unhandled.
    connection.on("BatchCommandResult", onBatch);
    connection.on("CommandFinished", onFinished);
    const unsubscribe = subscribeHubStatus(status => handlersRef.current.onHubStatusChanged(status));

    startHub().catch(err => console.error(`Result stream connection failed: ${err}`));

    // The connection itself is app-wide and is not stopped here (safe under StrictMode double effects).
    return () => {
      connection.off("BatchCommandResult", onBatch);
      connection.off("CommandFinished", onFinished);
      unsubscribe();
    };
  }, []);
}
