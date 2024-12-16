import { useDatabaseContext } from "./contexts/DatabaseContextProvider";
import ConnectToServer from "./features/connect/ConnectToServer";
import NavBar from "./layout/NavBar";
import { AppGlobalState } from "./types/AppGlobalState";
import Loader from "./ui/loader/Loader";
import ModalWindow from "./ui/modalWindow/ModalWindow";
import HorisontalSidebar from "./ui/sidebar/HorisontalSidebar";
import VerticalSidebar from "./ui/sidebar/VerticalSidebar";

function App() {
  const {appState, connect} = useDatabaseContext();
  const isLoading = [AppGlobalState.Connecting].includes(appState);

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
        <div className="h-full w-fill grid grid-rows-[max-content_auto]">
          <HorisontalSidebar>
            <div className="h-full w-fill bg-gray-600 ">Main Content</div>
          </HorisontalSidebar>
          <div className="bg-slate-400">Player</div>
        </div>
      </div>
    </div>
  );
}

export default App;