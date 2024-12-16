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
      onClick={onClick}
      className="bg-transparent rounded border-none p-2 border-r-8 transition-all duration-200 absolute right-0 hover:bg-stone-400"
    >
      {children}
    </button>
  );
}
