import { JSX } from "react";

interface Props {
  icon?: JSX.Element;
  disabled?: boolean;
  onClick?: () => void;
}

export default function MenuItem({ children, icon, disabled, onClick }: React.PropsWithChildren<Props>) {
  // Cursor and hover styles come from enabledCss/disabledCss, so a disabled item doesn't show a pointer.
  const baseCss = 'relative flex h-7 w-full min-w-[180px] items-center gap-2 px-3';
  const enabledCss = ' text-fg cursor-pointer hover:bg-selected hover:text-on-selected';
  const disabledCss = ' text-fg-faint cursor-not-allowed';

  const liCSS = `${baseCss}${disabled ? disabledCss : enabledCss}`;

  function handleClick() {
    if (!disabled) {
      onClick?.();
    }
  }

  return (
    <li className={liCSS} onClick={handleClick}>
      {icon && <span className="flex flex-none items-center">{icon}</span>}
      {children}
    </li>
  );
}
