import { useEffect, useRef, useState } from "react";
import { endDrag, startDrag } from "./dragSelection";

interface Props {
  initialHeight?: number;
}

const MIN_HEIGHT = 80;
// Space kept for the area below the splitter (e.g. the query results).
const MIN_REMAINING_HEIGHT = 120;

function HorisontalSidebar({children, initialHeight = 580}: React.PropsWithChildren<Props>) {
  const [height, setHeight] = useState(initialHeight);
  const isResized = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Safety net: never leave the page in drag mode if unmounted mid-drag.
  useEffect(() => () => {
    if (isResized.current) {
      endDrag();
    }
  }, []);

  // Pointer capture: see VerticalSidebar.
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isResized.current = true;
    startDrag('row');
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isResized.current) {
      return;
    }
    const containerHeight = panelRef.current?.parentElement?.clientHeight ?? window.innerHeight;
    const maxHeight = Math.max(MIN_HEIGHT, containerHeight - MIN_REMAINING_HEIGHT);
    setHeight((previousHeight) => Math.min(Math.max(previousHeight + e.movementY, MIN_HEIGHT), maxHeight));
  }

  function stopResize() {
    if (isResized.current) {
      isResized.current = false;
      endDrag();
    }
  }

  return (
    <>
      {/* max-height also limits the initial height on small windows */}
      <div
        ref={panelRef}
        style={{ height: `${height / 16}rem`, minHeight: MIN_HEIGHT, maxHeight: `calc(100% - ${MIN_REMAINING_HEIGHT}px)` }}
        className="flex-none"
      >
        {children}
      </div>

      <div
        className="h-1 cursor-row-resize bg-neutral-700 hover:bg-slate-400 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopResize}
        onLostPointerCapture={stopResize}
      />
    </>
  );
}

export default HorisontalSidebar
