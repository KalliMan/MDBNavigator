import { useEffect, useRef, useState } from "react";
import ModalWindow from "../modalWindow/ModalWindow";
import Button from "../common/Button";
import { ButtonType } from "../common/ButtonType.enum";
import Checkbox from "../common/Checkbox";
import { viewerText } from "./cellViewerText";
import { cellToText } from "./formatCell";
import { CellValue } from "../../models/databaseCommand/result/cellValue";
import { DbTypeCategory } from "../../models/databaseCommand/result/dbTypeCategory";

interface Props {
  columnName: string;
  typeName: string;
  category: DbTypeCategory;
  // The row's number in the result, starting at 1.
  rowNumber: number;
  value: CellValue | undefined;
  onCopyText: (text: string) => void;
  onClose: () => void;
}

// ModalWindow hands onCloseModal to its child, which must therefore be a component; the viewer closes through
// its own onClose and doesn't need it.
interface BodyProps {
  value: CellValue | undefined;
  category: DbTypeCategory;
  onCopyText: (text: string) => void;
  onClose: () => void;
  onCloseModal?: () => void;
}

function CellViewerBody({ value, category, onCopyText, onClose }: BodyProps) {
  const shown = viewerText(value, category);
  const isNull = value === null || value === undefined;
  const [wrap, setWrap] = useState(false);
  const valueRef = useRef<HTMLPreElement>(null);

  // Focus goes to the value, so the keyboard scrolls it and the grid behind the dialog stops receiving keys.
  useEffect(() => {
    valueRef.current?.focus();
  }, []);

  // Esc closes the dialog from wherever the focus is. The listener is bound once and reads the current onClose
  // through a ref, so it never calls an old one.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex w-[min(720px,calc(100vw-4rem))] flex-col">
      <pre
        ref={valueRef}
        tabIndex={0}
        className={`max-h-[60vh] min-h-24 overflow-auto border-b border-line bg-surface px-4 py-3 font-mono text-[13px] leading-5 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}`}
      >
        {isNull ? <span className="italic text-fg-muted">NULL</span> : shown.text}
      </pre>

      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Checkbox checked={wrap} onChange={setWrap}>
            <span className="text-xs text-fg-muted">Wrap long lines</span>
          </Checkbox>
          {shown.formatted && (
            <span className="text-xs text-fg-muted">Formatted for reading. Copy gives the original value.</span>
          )}
        </div>
        <div className="flex flex-none gap-2">
          {/* The original text, not the formatted one: pasting the value elsewhere gives back what is stored. */}
          <Button type={ButtonType.secondary} disabled={isNull} onClick={() => onCopyText(cellToText(value))}>
            Copy value
          </Button>
          <Button type={ButtonType.primary} onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// Shows one cell's full value in a dialog; JSON is indented for reading. The caller owns the clipboard.
export default function CellViewer({ columnName, typeName, category, rowNumber, value, onCopyText, onClose }: Props) {
  return (
    <ModalWindow name="cellViewer" title={`${columnName} · ${typeName} · row ${rowNumber}`} onClose={onClose}>
      <CellViewerBody value={value} category={category} onCopyText={onCopyText} onClose={onClose} />
    </ModalWindow>
  );
}
