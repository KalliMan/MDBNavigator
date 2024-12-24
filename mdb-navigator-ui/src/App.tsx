import { useDatabaseContext } from "./contexts/DatabaseContextProvider";
import ConnectToServer from "./features/connect/ConnectToServer";
import Mainbar from "./layout/MainBar";
import NavBar from "./layout/NavBar";
import Loader from "./ui/loader/Loader";
import ModalWindow from "./ui/modalWindow/ModalWindow";
import HorisontalSidebar from "./ui/sidebar/HorisontalSidebar";
import VerticalSidebar from "./ui/sidebar/VerticalSidebar";

function App() {
  const {isLoading, connect} = useDatabaseContext();
  return (
    <div>
      {isLoading && <Loader />}
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
          {/* <HorisontalSidebar>
            <Mainbar />
          </HorisontalSidebar> */}
        </div>
      </div>
    </div>
  );
}

export default App;