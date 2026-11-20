import { useEffect, useRef, useState } from "react";
import { ToastContainer } from "react-toastify";
import useAuth from "./contexts/auth/useAuth";
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
    connectDemo,
    reconnect,
    cancelConnectDialog
  } = useDatabaseServerConnectContext();
  const { onBatchCommandResult, onStatementStarted, onCommandFinished, onHubStatusChanged } = useDatabaseCommandContext();
  const { user, settings } = useAuth();

  useCommandBatchResultNotifications({ onBatchCommandResult, onStatementStarted, onCommandFinished, onHubStatusChanged });
  const hasConnections = databaseServerConnections.length > 0;

  // A demo guest starts connected to the sample database, opened by the server. Only if that fails does the connect
  // dialog show (with the error). The workspace is mounted once per page load, and a guest's session is a page load.
  const isGuest = !!user?.guest;
  const [demoConnect, setDemoConnect] = useState<'none' | 'pending' | 'done'>(isGuest ? 'pending' : 'none');
  const demoConnectStarted = useRef(false);
  const demoConnectionName = settings?.demo?.connectionName ?? 'Sample database';
  useEffect(() => {
    // Once, even when React runs effects twice in development.
    if (!isGuest || demoConnectStarted.current) {
      return;
    }
    demoConnectStarted.current = true;
    void connectDemo(demoConnectionName).then(() => setDemoConnect('done'));
  }, [isGuest, connectDemo, demoConnectionName]);

  // Without any connection the connect dialog is mandatory; otherwise it can be cancelled.
  const showConnectModal = active && (connectNewDatabaseServer || (!hasConnections && demoConnect !== 'pending'));
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
        <ModalWindow name="Connect to a server" title="Connect to a server"
          canClose={hasConnections && !isConnecting} onClose={cancelConnectDialog}>
          <ConnectToServer
            allowSaved
            error={error}
            isConnecting={isConnecting}
            captchaRequired={captchaRequired}
            onCancel={hasConnections ? cancelConnectDialog : undefined}
            onOk={(settings, captchaToken, display) => connect(settings, captchaToken, display)}
          />
        </ModalWindow>
      }

      {showReconnectModal && reconnectedSettings?.connectionId &&
        <ModalWindow name="Reconnect to the server" title="Reconnect to the server"
          canClose={!isConnecting} onClose={cancelConnectDialog}>
          <ConnectToServer
            initialConnection={
              ServerType.PostgreSQL === reconnectedSettings?.serverType ? reconnectedSettings : null
            }
            error={error}
            isConnecting={isConnecting}
            captchaRequired={captchaRequired}
            onCancel={cancelConnectDialog}
            // The display is ignored: a reconnect keeps the connection's name and color.
            onOk={(settings, captchaToken) => reconnect(reconnectedSettings.connectionId, settings, captchaToken)}
          />
        </ModalWindow>
      }

      <div className="flex h-screen w-screen flex-col overflow-hidden bg-canvas text-fg">
        <TopBar />
        {/* The row is pinned to the available height (minmax(0, 1fr)). An implicit auto row grows to fit a long tree,
            so the sidebar was clipped here instead of scrolling inside NavBar. */}
        <div className="grid min-h-0 flex-1 grid-cols-[max-content_auto] grid-rows-[minmax(0,1fr)] overflow-hidden">
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