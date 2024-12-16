import { SyntheticEvent, cloneElement, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiXMark } from 'react-icons/hi2';

import useOutsideClick from '../../common/sharedHooks/useOutsideClick';

import CloseButton from '../common/CloseButton';

interface Props {
  name: string;
  title: string;
}

export default function ModalWindow({ children, name, title }: React.PropsWithChildren<Props>) {
  const [openName, setOpenName] = useState(name);
  const ref = useOutsideClick(close);

  if (!openName) {
    return null;
  }

  function close(e: SyntheticEvent | null) {
    e?.preventDefault();
    setOpenName('');
  }

  return createPortal (
    <div className="fixed top-0 left-0 w-[100%] h-screen backdrop-blur-sm z-50 transition-all duration-200]">
      <div ref={ref} className="fixed top-[30%] left-[40%] bg-stone-100 rounded-lg shadow-lg transition-all duration-200">
        <div className="flex mb-5 pl-5 bg-stone-300 rounded-lg">
          <div className="mt-1 text-stone-800 text-lg">
            {title}
          </div>
          <CloseButton onClick={close}>
            <HiXMark />
          </CloseButton>
        </div>
        <div className="pt-6">
          { cloneElement(children as React.ReactElement, { onCloseModal: close }) }
        </div>
      </div>
    </div>,
    document.body
  )
}
