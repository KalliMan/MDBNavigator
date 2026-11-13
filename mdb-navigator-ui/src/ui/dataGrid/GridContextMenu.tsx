import Menus from "../contextMenu/Menus";
import { CoordPosition } from "../../types/coordPosition";

interface Props {
  // Page coordinates, already clamped.
  position: CoordPosition;
  onClose: () => void;
  onCopy: () => void;
  onCopyWithHeaders: () => void;
  onViewCell: () => void;
  onSelectAll: () => void;
}

function Shortcut({ keys }: { keys: string }) {
  return <span className="ml-auto pl-8 text-xs opacity-70">{keys}</span>;
}

export default function GridContextMenu({ position, onClose, onCopy, onCopyWithHeaders, onViewCell, onSelectAll }: Props) {
  // Every item does its job and then closes the menu.
  const run = (action: () => void) => () => {
    action();
    onClose();
  };

  return (
    <Menus id="gridContextMenu" targetPosition={position} clickedOutside={onClose}>
      <Menus.MenuItem onClick={run(onCopy)}>
        Copy<Shortcut keys="Ctrl+C" />
      </Menus.MenuItem>
      <Menus.MenuItem onClick={run(onCopyWithHeaders)}>
        Copy with headers<Shortcut keys="Ctrl+Shift+C" />
      </Menus.MenuItem>
      <Menus.MenuItemSeparator />
      <Menus.MenuItem onClick={run(onViewCell)}>
        View cell value<Shortcut keys="Enter" />
      </Menus.MenuItem>
      <Menus.MenuItemSeparator />
      <Menus.MenuItem onClick={run(onSelectAll)}>
        Select all<Shortcut keys="Ctrl+A" />
      </Menus.MenuItem>
    </Menus>
  );
}
