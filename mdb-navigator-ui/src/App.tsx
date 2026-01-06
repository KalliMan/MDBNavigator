import { ToastContainer } from "react-toastify";
import useDatabaseConnectContext from "./contexts/databaseConnect/useDatabaseConnect";
import ConnectToServer from "./features/connect/ConnectToServer";
import Mainbar from "./layout/MainBar";
import NavBar from "./layout/NavBar";
import Loader from "./ui/loader/Loader";
import ModalWindow from "./ui/modalWindow/ModalWindow";
import VerticalSidebar from "./ui/sidebar/VerticalSidebar";
import useDatabaseCommandContext from "./contexts/databaseCommand/useDatabaseCommand";
import useCommandBatchResultNotifications from "./common/sharedHooks/useCommandBatchResultNotifications";

function App() {

  const {isConnecting, connectNewDatabaseServer, databaseConnections, connect} = useDatabaseConnectContext();
  const { onBatchCommandResult } = useDatabaseCommandContext();

  useCommandBatchResultNotifications({onBatchCommandResult});
  const showConnectModal =  connectNewDatabaseServer || (!databaseConnections!.length && !isConnecting);

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