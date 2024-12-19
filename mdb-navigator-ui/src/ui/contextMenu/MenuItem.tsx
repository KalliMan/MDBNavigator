interface Props {
  icon?: JSX.Element;
  onClick?(): void;
}

export default function MenuItem({ children, icon, onClick }: React.PropsWithChildren<Props>) {
  const liCSS = '@apply flex cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-200 transition-all ease-linear dark:hover:bg-gray-800/50 p-4 w-full h-full text-gray-800 dark:text-gray-200 relative;';

  function handleClick() {
    onClick?.();
  }

  return (
    <li className={liCSS} onClick={handleClick}>
      {icon && <i className="mr-2 mt-1.5">{icon}</i>}
      {children}
    </li>
  );
}
