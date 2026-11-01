interface Props {
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export default function CloseButton({
  children,
  onClick,
}: React.PropsWithChildren<Props>) {
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClick}
      className="ml-auto flex size-7 items-center justify-center rounded-[3px] text-fg-muted hover:bg-hover hover:text-fg cursor-pointer"
    >
      {children}
    </button>
  );
}
