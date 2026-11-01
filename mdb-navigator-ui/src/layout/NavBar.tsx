import { LuPlus } from "react-icons/lu";
import useDatabaseServerConnectContext from "../contexts/databaseServerConnect/useDatabaseServerConnect";
import DatabaseTreeView from "../features/databaseTreeView/DatabaseTreeView"

// The sidebar: the connections header and the tree. The tree hides its "Servers" root, so "+" replaces the root's
// "New Connection" menu item.
function NavBar() {
  const { connectNewDatabase } = useDatabaseServerConnectContext();

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-[30px] flex-none items-center pl-3 pr-1 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
        Connections
        <button
          type="button"
          aria-label="New connection"
          title="New connection"
          onClick={connectNewDatabase}
          className="ml-auto flex size-6 items-center justify-center rounded-[3px] hover:bg-hover hover:text-fg cursor-pointer"
        >
          <LuPlus size={15} aria-hidden="true" />
        </button>
      </div>
      <div className="rounded-scrollbar min-h-0 flex-1 overflow-auto">
        <DatabaseTreeView />
      </div>
    </div>
  )
}

export default NavBar
