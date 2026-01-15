// import { Link } from 'react-router-dom';
import { ButtonType } from './ButtonType.enum';

interface Props {
  disabled?: boolean;
  to?: string;
  type: ButtonType;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

function Button({ children, disabled, /*to,*/ type, onClick }: React.PropsWithChildren<Props>) {

  const base = 'm-1 bg-stone-400 text-sm font-semibold text-stone-800 inline-block tracking-wide rounded hover:bg-stone-300 transition-colors duration-300 focus:ring focus:ring-stone-300 focus:bg-stone-300 focus:ring-offset-1 disabled:cursor-not-allowed cursor-pointer';
  const styles = {
    primary: base + ' px-2 py-2 submit',
    small: base + ' px-2 py-2 text-xs',
    round: base + ' px-1.5 py-1 text-sm',
    secondary:
      'text-sm border-2 border-stone-300 font-semibold text-stone-400 inline-block tracking-wide rounded hover:bg-stone-300 hover:text-stone-800  transition-colors duration-300 focus:ring focus:ring-stone-200 focus:bg-stone-300 focus:ring-offset-2 disabled:cursor-not-allowed cursor-pointer px-2 py-2',
  };

  if (onClick) {
    return (
      <button className={styles[type]} onClick={onClick} disabled={disabled}>
        {children}
      </button>
    );
  }

  return (
    <button className={styles[type]} disabled={disabled}>
      {children}
    </button>
  );
}

export default Button;
