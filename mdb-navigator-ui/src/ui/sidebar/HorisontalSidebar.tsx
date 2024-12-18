import { useEffect, useRef, useState } from "react";

interface Props {
  initialHeight?: number;
}

function HorisontalSidebar({children, initialHeight = 820}: React.PropsWithChildren<Props>) {
  const [height, setHeight] = useState(initialHeight);
  const isResized = useRef(false);

  useEffect(() => {
    document.addEventListener("mousemove", (e) => {
      if (!isResized.current) {
        return;
      }

      setHeight((previousHeight) => previousHeight + e.movementY / 2);
    });

    document.addEventListener("mouseup", () => {
      isResized.current = false;
    });
  }, []);

  return (
    <div className="">
      <div style={{ height: `${height / 16}rem` }} className="">
        {children}
      </div>

      <div
        className="h-1 cursor-row-resize bg-neutral-700 hover:bg-slate-400"
        onMouseDown={() => {
          isResized.current = true;
        }}
      />
    </div>
  );
}

export default HorisontalSidebar
