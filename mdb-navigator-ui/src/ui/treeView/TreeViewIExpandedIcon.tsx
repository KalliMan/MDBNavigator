import { LuChevronDown, LuChevronRight } from "react-icons/lu";

export interface Props {
  isExpanded?: boolean;
  onExpand: () => void;
}

export default function TreeViewIExpandedIcon({isExpanded, onExpand}: Props) {
  function onClickHandler(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault();
    onExpand();
  }

  // tabIndex -1: a big tree would otherwise be hundreds of Tab stops.
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={isExpanded ? 'Collapse' : 'Expand'}
      onClick={onClickHandler}
      className="flex size-4 flex-none items-center justify-center text-fg-muted hover:text-fg cursor-pointer"
    >
      {isExpanded ? <LuChevronDown size={14} /> : <LuChevronRight size={14} />}
    </button>
  );
}
