import { JSX } from "react";

interface Props {
  icon?: JSX.Element;
  disabled?: boolean;
  onClick?(): void;
}

export default function MenuItem({ children, icon, disabled, onClick }: React.PropsWithChildren<Props>) {
  // Cursor and hover styles come from enabledCss/disabledCss, so a disabled item doesn't show a pointer.
  const baseCss = 'min-w-[160px] flex bg-white dark:bg-gray-800 transition-all ease-linear p-2 w-full h-full text-gray-800 dark:text-gray-200 relative';
  const enabledCss = " cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800/50";
  const disabledCss = " cursor-not-allowed opacity-60";

  const liCSS = `${baseCss}${disabled ? disabledCss : enabledCss}`;

  function handleClick() {
    if (!disabled) {
      onClick?.();
    }
  }

  return (
    <li className={liCSS} onClick={handleClick}>
      {icon && <i className="mr-2 mt-1.5">{icon}</i>}
      {children}
    </li>
  );
}
