import { createPortal } from 'react-dom';
import MenuItem from './MenuItem';
import useOutsideClick from '../../common/sharedHooks/useOutsideClick';
import { CoordPosition, EmptyPosition } from '../../types/coordPosition';
import { MenuItemSeparator } from './MenuItemSeparator';

export interface Props {
  id: string;
  targetPosition: CoordPosition;
  clickedOutside: () => void;
}

function Menus({ children, clickedOutside, targetPosition }: React.PropsWithChildren<Props>) {

  const ref = useOutsideClick(() => {
    clickedOutside()
  });

  if (!targetPosition || targetPosition === EmptyPosition) {
    return null;
  }

  const styleCss = {
    left: targetPosition.x,
    top: targetPosition.y,
  };

  return createPortal(
    <div ref={ref} id="contextMenu" className="absolute z-40" style={styleCss}>
      <ul className="menu flex flex-col overflow-hidden rounded border border-line bg-canvas py-1 shadow-lg">
        {children}
      </ul>
    </div>,
    document.body);
}

Menus.MenuItem = MenuItem;
Menus.MenuItemSeparator = MenuItemSeparator;

export default Menus;
