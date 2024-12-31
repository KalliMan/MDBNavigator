import { useEffect } from "react";
import useDatabaseConnectContext from "./contexts/databaseConnect/useDatabaseConnect";
import ConnectToServer from "./features/connect/ConnectToServer";
import Mainbar from "./layout/MainBar";
import NavBar from "./layout/NavBar";
import Loader from "./ui/loader/Loader";
import ModalWindow from "./ui/modalWindow/ModalWindow";
import VerticalSidebar from "./ui/sidebar/VerticalSidebar";
import batchCommandResultSignalR from "./services/batchCommandResultSignalR";

function App() {
  useEffect(() => {
    batchCommandResultSignalR.connect();

    return () => {
      batchCommandResultSignalR.disconnect();
    };
  });

  const {isConnecting, connect} = useDatabaseConnectContext();

  return (
    <div>
      {isConnecting && <Loader />}
      <ModalWindow name="Connect To DB Server" title="Connect To DB Server">
        <ConnectToServer
          onOk={(connectionSettings) => connect(connectionSettings)}
        />
      </ModalWindow>

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