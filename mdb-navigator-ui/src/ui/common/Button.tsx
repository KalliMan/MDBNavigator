// import { Link } from 'react-router-dom';
import { ButtonType } from './ButtonType.enum';

interface Props {
  disabled?: boolean;
  to?: string;
  type: ButtonType;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

function Button({ children, disabled, /*to,*/ type, onClick }: React.PropsWithChildren<Props>) {

  const base = 'inline-flex h-7 items-center justify-center gap-1.5 rounded-[3px] px-3 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
  const styles: Record<ButtonType, string> = {
    primary: base + ' bg-accent text-on-accent hover:bg-accent-hover disabled:hover:bg-accent',
    secondary: base + ' border border-line bg-canvas text-fg hover:bg-hover disabled:hover:bg-canvas',
  };

  // A button with a handler never submits a form; without one it is the form's submit button.
  return (
    <button type={onClick ? 'button' : 'submit'} className={styles[type]} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export default Button;
