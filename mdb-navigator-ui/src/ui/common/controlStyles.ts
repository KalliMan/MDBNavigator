import { ButtonType } from './ButtonType.enum';

// One look for every form control, in two sizes: 'md' (28 px) inside the workspace (dialogs, the account page),
// 'lg' (36 px) on the sign-in pages, which stand alone and are the first thing a visitor sees.
export type ControlSize = 'md' | 'lg';

const fieldBase = 'block w-full min-w-0 rounded-[3px] border bg-canvas text-fg outline-none placeholder:text-fg-faint '
  + 'focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50';
const fieldSizes: Record<ControlSize, string> = { md: 'h-7 px-2', lg: 'h-9 px-3' };

// Text boxes and selects. A field always fills its container; the container sets the width.
export function fieldClass(size: ControlSize, invalid: boolean): string {
  return `${fieldBase} ${fieldSizes[size]} ${invalid ? 'border-danger' : 'border-line'}`;
}

const buttonBase = 'inline-flex flex-none items-center justify-center gap-1.5 rounded-[3px] font-medium whitespace-nowrap '
  + 'transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 '
  + 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const buttonSizes: Record<ControlSize, string> = { md: 'h-7 px-3', lg: 'h-9 px-4' };
const buttonTypes: Record<ButtonType, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover disabled:hover:bg-accent',
  secondary: 'border border-line bg-canvas text-fg hover:bg-hover disabled:hover:bg-canvas',
  danger: 'bg-danger-solid text-on-accent hover:opacity-90 disabled:hover:opacity-50',
};

// Also for a link that must look like a button (a provider's sign-in link leaves the page, so it is an <a>).
export function buttonClass(type: ButtonType, size: ControlSize = 'md', fullWidth = false): string {
  return `${buttonBase} ${buttonSizes[size]} ${buttonTypes[type]}${fullWidth ? ' w-full' : ''}`;
}
