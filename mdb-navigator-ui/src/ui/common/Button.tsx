import { ButtonType } from './ButtonType.enum';
import { buttonClass, ControlSize } from './controlStyles';

interface Props {
  type: ButtonType;
  size?: ControlSize;
  // As wide as its container (the sign-in pages' submit button).
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

function Button({ children, type, size = 'md', fullWidth = false, disabled, onClick }: React.PropsWithChildren<Props>) {
  // A button with a handler never submits a form; without one it is the form's submit button.
  return (
    <button type={onClick ? 'button' : 'submit'} className={buttonClass(type, size, fullWidth)} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export default Button;
