export interface Props {
  isExpanded?: boolean;
  onExpand(): void;
}

export default function TreeViewIExpandedIcon({isExpanded, onExpand}: Props) {
  const icon = isExpanded
    ? 'm19.5 8.25-7.5 7.5-7.5-7.5'
    : 'm8.25 4.5 7.5 7.5-7.5 7.5';

  return (
    <div onClick={onExpand}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
    </svg>
  </div>
  )
}

