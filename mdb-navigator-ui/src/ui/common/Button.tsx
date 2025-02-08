// import { Link } from 'react-router-dom';
import { ButtonType } from './ButtonType.enum';

interface Props {
  disabled?: boolean;
  to?: string;
  type: ButtonType;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

function Button({ children, disabled, /*to,*/ type, onClick }: React.PropsWithChildren<Props>) {
  //  const className = 'bg-yellow-400 uppercase font-semibold text-stone-800 py-3 px-4 inline-block tracking-wide rounded-full hover:bg-yellow-300 transition-colors duration-300 focus:ring focus:ring-yellow-300 focus:bg-yellow-300 focus:ring-offset-2 disabled:cursor-not-allowed cursor-pointer md:px-6 sm:py-4';

  const base = 'm-1 bg-stone-400 text-sm font-semibold text-stone-800 inline-block tracking-wide rounded hover:bg-stone-300 transition-colors duration-300 focus:ring focus:ring-stone-300 focus:bg-stone-300 focus:ring-offset-1 disabled:cursor-not-allowed cursor-pointer';
  const styles = {
    primary: base + ' px-2 py-2 submit',
    small: base + ' px-2 py-2 text-xs',
    round: base + ' px-1.5 py-1 text-sm',
    secondary:
      'text-sm border-2 border-stone-300 font-semibold text-stone-400 inline-block tracking-wide rounded hover:bg-stone-300 hover:text-stone-800  transition-colors duration-300 focus:ring focus:ring-stone-200 focus:bg-stone-300 focus:ring-offset-2 disabled:cursor-not-allowed cursor-pointer px-2 py-2',
  };

  // if (to) {
  //   return (
  //     <Link className={styles[type]} to={to}>
  //       {children}
  //     </Link>
  //   );
  // }

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

/*
function Button({ children, onClick }: React.PropsWithChildren<Props>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2.5
      py-2.5
      bg-stone-400
      text-white
      font-medium
      text-xs
      leading-tight
      uppercase
      rounded
      shadow-md
      hover:bg-stone-600 hover:shadow-lg
      focus:bg-stone-600 focus:shadow-lg focus:outline-none focus:ring-0
      active:bg-stone-700 active:shadow-lg
      transition
      duration-150
      ease-in-out"
      data-bs-toggle="modal"
      data-bs-target="#exampleModal"
    >
      {children}
    </button>
  );
}
*/
