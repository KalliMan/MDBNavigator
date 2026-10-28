import { ToastContainer } from "react-toastify";
import useDatabaseServerConnectContext from "./contexts/databaseServerConnect/useDatabaseServerConnect";
import ConnectToServer from "./features/connect/ConnectToServer";
import Mainbar from "./layout/MainBar";
import NavBar from "./layout/NavBar";
import Loader from "./ui/loader/Loader";
import ModalWindow from "./ui/modalWindow/ModalWindow";
import VerticalSidebar from "./ui/sidebar/VerticalSidebar";
import useDatabaseCommandContext from "./contexts/databaseCommand/useDatabaseCommandContext";
import useCommandBatchResultNotifications from "./common/sharedHooks/useCommandBatchResultNotifications";
import { ServerType } from "./types/serverTypeOptions";

function App() {

  const {
    isConnecting,
    error,
    connectNewDatabaseServer,
    databaseServerConnections,
    reconnectDatabaseServer,
    reconnectDatabaseServerId,
    connect,
    reconnect,
    cancelConnectDialog
  } = useDatabaseServerConnectContext();
  const { onBatchCommandResult, onCommandFinished, onHubStatusChanged } = useDatabaseCommandContext();

  useCommandBatchResultNotifications({ onBatchCommandResult, onCommandFinished, onHubStatusChanged });
  const hasConnections = databaseServerConnections.length > 0;
  // Without any connection the connect dialog is mandatory; otherwise it can be cancelled.
  const showConnectModal = connectNewDatabaseServer || !hasConnections;
  const showReconnectModal = reconnectDatabaseServer && reconnectDatabaseServerId;
  const reconnectedSettings = showReconnectModal
    ? databaseServerConnections.find(conn => conn.connectedResult?.connectionId === reconnectDatabaseServerId)?.connectedResult
    : null;

  return (
    <div>
      <ToastContainer position='bottom-right' hideProgressBar theme='colored' />
      {/* An open dialog shows its own "Connecting…" state */}
      {isConnecting && !showConnectModal && !showReconnectModal && <Loader />}
      {showConnectModal &&
        <ModalWindow name="Connect To DB Server" title="Connect To DB Server"
          canClose={hasConnections && !isConnecting} onClose={cancelConnectDialog}>
          <ConnectToServer
            error={error}
            isConnecting={isConnecting}
            onCancel={hasConnections ? cancelConnectDialog : undefined}
            onOk={(connectionSettings) => connect(connectionSettings)}
          />
        </ModalWindow>
      }

      {showReconnectModal && reconnectedSettings?.connectionId &&
        <ModalWindow name="Reconnect To DB Server" title="Reconnect To DB Server"
          canClose={!isConnecting} onClose={cancelConnectDialog}>
          <ConnectToServer
            initialConnectionSettings = {
              ServerType.PostgreSQL === reconnectedSettings?.serverType ? reconnectedSettings : null
            }
            error={error}
            isConnecting={isConnecting}
            onCancel={cancelConnectDialog}
            onOk={(connectionSettings) => reconnect(reconnectedSettings.connectionId, connectionSettings!)}
          />
        </ModalWindow>
      }

      <div className="w-screen h-screen grid grid-cols-[max-content_auto] gap-y-1 border-2 border-stone-400 overflow-hidden">
        <VerticalSidebar>
          <NavBar />
        </VerticalSidebar>
        <div className="h-full min-h-0 overflow-hidden">
          <Mainbar />
        </div>
      </div>
    </div>
  );
}

export default App;