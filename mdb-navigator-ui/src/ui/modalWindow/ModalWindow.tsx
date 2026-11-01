import { SyntheticEvent, cloneElement, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiXMark } from 'react-icons/hi2';

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
    <div className="fixed inset-0 flex overflow-y-auto p-4 backdrop-blur-sm z-50 transition-all duration-200">
      <div ref={ref} className="m-auto bg-stone-100 rounded-lg shadow-lg transition-all duration-200">
        <div className="flex mb-5 pl-5 bg-stone-300 rounded-lg">
          <div className="mt-1 text-stone-800 text-lg">
            {title}
          </div>
          {canClose && (
            <CloseButton onClick={close}>
              <HiXMark />
            </CloseButton>
          )}
        </div>
        <div className="pt-6">
          {cloneElement(children as React.ReactElement<any>, { onCloseModal: close }) }
        </div>
      </div>
    </div>,
    document.body
  )
}
