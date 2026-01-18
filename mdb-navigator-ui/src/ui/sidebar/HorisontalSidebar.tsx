import { useEffect, useRef, useState } from "react";

interface Props {
  initialHeight?: number;
}

function HorisontalSidebar({children, initialHeight = 580}: React.PropsWithChildren<Props>) {
  const [height, setHeight] = useState(initialHeight);
  const isResized = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResized.current) {
        return;
      }

      setHeight((previousHeight) => previousHeight + e.movementY);
    };

    const handleMouseUp = () => {
      isResized.current = false;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <>
      <div style={{ height: `${height / 16}rem` }} className="">
        {children}
      </div>

      <div
        className="h-1 cursor-row-resize bg-neutral-700 hover:bg-slate-400"
        onMouseDown={() => {
          isResized.current = true;
        }}
      />
    </>
  );
}

export default HorisontalSidebar
