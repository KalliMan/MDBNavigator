import { ToastContainer } from "react-toastify";
import useDatabaseServerConnectContext from "./contexts/databaseServerConnect/useDatabaseServerConnect";
import ConnectToServer from "./features/connect/ConnectToServer";
import Mainbar from "./layout/MainBar";
import NavBar from "./layout/NavBar";
import TopBar from "./layout/TopBar";
import Loader from "./ui/loader/Loader";
import ModalWindow from "./ui/modalWindow/ModalWindow";
import VerticalSidebar from "./ui/sidebar/VerticalSidebar";
import useDatabaseCommandContext from "./contexts/databaseCommand/useDatabaseCommandContext";
import useCommandBatchResultNotifications from "./common/sharedHooks/useCommandBatchResultNotifications";
import { ServerType } from "./types/serverTypeOptions";

interface Props {
  // False while another page (sign-in, account) is shown. The workspace then stays mounted but hidden, and its
  // dialogs, which render into document.body, must not show either.
  active: boolean;
}

function App({ active }: Props) {

  const {
    isConnecting,
    error,
    captchaRequired,
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
  const showConnectModal = active && (connectNewDatabaseServer || !hasConnections);
  const showReconnectModal = active && reconnectDatabaseServer && reconnectDatabaseServerId;
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
            captchaRequired={captchaRequired}
            onCancel={hasConnections ? cancelConnectDialog : undefined}
            onOk={(connectionSettings, captchaToken) => connect(connectionSettings, captchaToken)}
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
            captchaRequired={captchaRequired}
            onCancel={cancelConnectDialog}
            onOk={(connectionSettings, captchaToken) => reconnect(reconnectedSettings.connectionId, connectionSettings, captchaToken)}
          />
        </ModalWindow>
      }

      <div className="flex h-screen w-screen flex-col overflow-hidden bg-canvas text-fg">
        <TopBar />
        <div className="grid min-h-0 flex-1 grid-cols-[max-content_auto] overflow-hidden">
          <VerticalSidebar>
            <NavBar />
          </VerticalSidebar>
          <div className="h-full min-h-0 overflow-hidden">
            <Mainbar />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;