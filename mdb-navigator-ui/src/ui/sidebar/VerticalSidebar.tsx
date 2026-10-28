import { useEffect, useRef, useState } from "react";
import { endDrag, startDrag } from "./dragSelection";

interface Props {
  initialWidth?: number;
}

const MIN_WIDTH = 200;
const MAX_WIDTH_RATIO = 0.6;

const clampWidth = (width: number) => Math.min(Math.max(width, MIN_WIDTH), window.innerWidth * MAX_WIDTH_RATIO);

function VerticalSidebar({children, initialWidth = 350}: React.PropsWithChildren<Props>) {
  const [width, setWidth] = useState(initialWidth);
  const isResized = useRef(false);

  // Safety net: never leave the page in drag mode if unmounted mid-drag.
  useEffect(() => () => {
    if (isResized.current) {
      endDrag();
    }
  }, []);

  // Pointer capture: while the button is held, the bar receives all pointer events (even outside the
  // window or over the editor), and lostpointercapture always ends the drag, so it can't get stuck.
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Without this the browser starts a text selection and highlights everything the pointer passes.
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isResized.current = true;
    startDrag('col');
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (isResized.current) {
      setWidth((previousWidth) => clampWidth(previousWidth + e.movementX));
    }
  }

  function stopResize() {
    if (isResized.current) {
      isResized.current = false;
      endDrag();
    }
  }

  return (
    <div className="flex h-full">
      <div style={{ width: `${width / 16}rem`, minWidth: MIN_WIDTH, maxWidth: `${MAX_WIDTH_RATIO * 100}vw` }} className="">
        {children}
      </div>

      <div
        className="w-1 cursor-col-resize bg-neutral-700 hover:bg-slate-400 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopResize}
        onLostPointerCapture={stopResize}
      />
    </div>
  );
}

export default VerticalSidebar
