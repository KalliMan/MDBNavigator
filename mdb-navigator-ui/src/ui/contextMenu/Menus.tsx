import { createPortal } from 'react-dom';
import MenuItem from './MenuItem';
import useOutsideClick from '../../common/sharedHooks/useOutsideClick';
import { CoordPosition, EmptyPosition } from '../../types/coordPosition';

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
    <div ref={ref} id="contextMenu" className="absolute" style={styleCss}>
      <ul className="menu flex flex-col rounded-md shadow-xl overflow-hidden">
        {children}
      </ul>
    </div>,
    document.body);
}

Menus.MenuItem = MenuItem;

export default Menus;
