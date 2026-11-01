import { SyntheticEvent, cloneElement, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuX } from 'react-icons/lu';

import useOutsideClick from '../../common/sharedHooks/useOutsideClick';

import CloseButton from '../common/CloseButton';

interface Props {
  name: string;
  title: string;
  canClose?: boolean;
  // When set, closing (X / outside click) is reported to the parent, which decides whether to unmount the modal.
  onClose?: () => void;
}
 /* eslint-disable @typescript-eslint/no-explicit-any */
export default function ModalWindow({ children, name, title, canClose = true, onClose }: React.PropsWithChildren<Props>) {
  const [openName, setOpenName] = useState(name);
  const ref = useOutsideClick(canClose ? () => close(null) : () => {});

  if (!openName) {
    return null;
  }

  function close(e: SyntheticEvent | null) {
    if (!canClose) return;
    e?.preventDefault();
    if (onClose) {
      onClose();
    } else {
      setOpenName('');
    }
  }

  return createPortal (
    // The backdrop scrolls and the dialog is centred with auto margins: a dialog taller than the window (an error
    // message, a CAPTCHA) still has its buttons within reach, which a fixed top offset would push off the screen.
    <div className="fixed inset-0 z-50 flex overflow-y-auto bg-black/40 p-4">
      <div ref={ref} className="m-auto rounded border border-line bg-canvas text-fg shadow-xl">
        <div className="flex h-9 items-center gap-2 rounded-t border-b border-line bg-chrome pl-4 pr-1.5">
          <div className="font-semibold">
            {title}
          </div>
          {canClose && (
            <CloseButton onClick={close}>
              <LuX size={15} aria-hidden="true" />
            </CloseButton>
          )}
        </div>
        <div className="pt-5">
          {cloneElement(children as React.ReactElement<any>, { onCloseModal: close }) }
        </div>
      </div>
    </div>,
    document.body
  )
}
