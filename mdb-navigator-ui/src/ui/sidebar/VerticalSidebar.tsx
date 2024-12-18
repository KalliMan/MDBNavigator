import { useEffect, useRef, useState } from "react";

interface Props {
  initialWidth?: number;
}

function VerticalSidebar({children, initialWidth = 350}: React.PropsWithChildren<Props>) {
  const [width, setWidth] = useState(initialWidth);
  const isResized = useRef(false);

  useEffect(() => {
    document.addEventListener("mousemove", (e) => {
      if (!isResized.current) {
        return;
      }

      setWidth((previousWidth) => previousWidth + e.movementX / 2);
    });

    document.addEventListener("mouseup", () => {
      isResized.current = false;
    });
  }, []);

  return (
    <div className="flex h-full">
      <div style={{ width: `${width / 16}rem` }} className="">
        {children}
      </div>

      <div
        className="w-1 cursor-col-resize bg-neutral-700 hover:bg-slate-400"
        onMouseDown={() => {
          isResized.current = true;
        }}
      />
    </div>
  );
}

export default VerticalSidebar
