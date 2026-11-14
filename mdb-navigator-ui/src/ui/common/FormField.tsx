import { ControlSize } from './controlStyles';

interface Props {
  label: string;
  // The control's id: a click on the label focuses it. Without one (a group of buttons) the label is plain text.
  htmlFor?: string;
  // 'side': the label left of the control, for dialogs. 'stacked': the label above it, for pages.
  layout: 'side' | 'stacked';
  // In 'side' the label is as high as the control.
  size?: ControlSize;
  error?: string;
  // Shown under the control while there is no error.
  hint?: string;
  // The id of the error or hint paragraph; the control points at it with aria-describedby.
  messageId?: string;
  // 'stacked' only: on the label's line, right-aligned (e.g. a "Forgot password?" link).
  labelAside?: React.ReactNode;
}

function LabelElement({ htmlFor, className, children }: React.PropsWithChildren<{ htmlFor?: string; className: string }>) {
  return htmlFor
    ? <label htmlFor={htmlFor} className={className}>{children}</label>
    : <span className={className}>{children}</span>;
}

// A label, the control (children) and the message under it. The control itself is TextInput, Select, or anything
// with the id given as htmlFor.
export default function FormField({
  label, htmlFor, layout, size = 'md', error, hint, messageId, labelAside, children
}: React.PropsWithChildren<Props>) {
  const message = error
    ? <p id={messageId} className="text-sm text-danger">{error}</p>
    : hint
      ? <p id={messageId} className="text-xs text-fg-muted">{hint}</p>
      : null;

  if (layout === 'side') {
    // Two grid cells, so every row's label lands in the same column: the parent must be a two-column grid
    // (grid-cols-[max-content_minmax(0,1fr)]).
    return (
      <>
        <LabelElement htmlFor={htmlFor} className={`flex items-center text-fg ${size === 'lg' ? 'h-9' : 'h-7'}`}>{label}</LabelElement>
        <div className="grid min-w-0 gap-1">{children}{message}</div>
      </>
    );
  }

  return (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <LabelElement htmlFor={htmlFor} className="font-medium text-fg">{label}</LabelElement>
        {labelAside}
      </div>
      {children}
      {message}
    </div>
  );
}
