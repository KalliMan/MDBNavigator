import { ToastContainer } from "react-toastify";
import useDatabaseServerConnectContext from "./contexts/databaseServerConnect/useDatabaseServerConnect";
import ConnectToServer from "./features/connect/ConnectToServer";
import Mainbar from "./layout/MainBar";
import NavBar from "./layout/NavBar";
import Loader from "./ui/loader/Loader";
import ModalWindow from "./ui/modalWindow/ModalWindow";
import VerticalSidebar from "./ui/sidebar/VerticalSidebar";
import useDatabaseCommandContext from "./contexts/databaseCommand/useDatabaseCommand";
import useCommandBatchResultNotifications from "./common/sharedHooks/useCommandBatchResultNotifications";
import { ServerType } from "./types/serverTypeOptions";

function App() {

  const {
    isConnecting,
    connectNewDatabaseServer,
    databaseServerConnections,
    reconnectDatabaseServer,
    reconnectDatabaseServerId,
    connect,
    reconnect
  } = useDatabaseServerConnectContext();
  const { onBatchCommandResult } = useDatabaseCommandContext();

  useCommandBatchResultNotifications({onBatchCommandResult});
  const showConnectModal =  connectNewDatabaseServer || (!databaseServerConnections!.length && !isConnecting);
  const showReconnectModal = reconnectDatabaseServer && reconnectDatabaseServerId;
  const reconnectedSettings = showReconnectModal
    ? databaseServerConnections.find(conn => conn.connectedResult?.connectionId === reconnectDatabaseServerId)?.connectedResult
    : null;

  return (
    <div>
      <ToastContainer position='bottom-right' hideProgressBar theme='colored' />
      {isConnecting && <Loader />}
      {showConnectModal &&
        <ModalWindow name="Connect To DB Server" title="Connect To DB Server" canClose={false}>
          <ConnectToServer
            onOk={(connectionSettings) => connect(connectionSettings)}
          />
        </ModalWindow>
      }

      {showReconnectModal && reconnectedSettings?.connectionId &&
        <ModalWindow name="Reconnect To DB Server" title="Reconnect To DB Server" canClose={false}>
          <ConnectToServer
            initialConnectionSettings = {
              ServerType.PostgreSQL === reconnectedSettings?.serverType ? reconnectedSettings : null
            }
            onOk={(connectionSettings) => reconnect(reconnectedSettings.connectionId, connectionSettings!)}
          />
        </ModalWindow>
      }

      <div className="w-screen h-screen grid grid-cols-[max-content_auto] gap-y-1 border-2 border-stone-400">
        <VerticalSidebar>
          <NavBar />
        </VerticalSidebar>
        <div className=" overflow-hidden">
          <Mainbar />
        </div>
      </div>
    </div>
  );
}

export default App;