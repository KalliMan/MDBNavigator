import { useEffect, useRef } from 'react';

export default function useOutsideClick(handler: () => void, listenCapturing = true) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(function() {
    function handleClick(e: MouseEvent) {
      if (ref.current && e.target && e.target instanceof Node && !ref.current.contains(e.target)) {
        handler();
      }
    }

    document.addEventListener('click', handleClick, listenCapturing )
    return () => document.removeEventListener('click', handleClick, listenCapturing )
  }, [handler, listenCapturing]);

  return ref;
}
