import { useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { formatCell } from "./formatCell";
import { CellValue } from "../../models/databaseCommand/result/cellValue";
import { MONO_FONT, SANS_FONT } from "../../utils/fonts";

export interface DataGridColumn {
  name: string;
  type: string;
}

interface Props {
  columns: DataGridColumn[];
  rows: CellValue[][];
}

const ROW_HEIGHT = 24;
const OVERSCAN = 20;
// px-2 on both sides + both borders + a little slack for rounding
const CELL_PADDING = 20;
const MIN_COLUMN_WIDTH = 60;
// Only extremely long values (long text, big JSON) are cut; the cell viewer will show them in full.
const MAX_COLUMN_WIDTH = 1000;
const WIDTH_SAMPLE_ROWS = 1000;
// Must match the grid's classes: text-[13px]; cells in the mono font, the header in the sans font, semibold.
const FONT_SIZE = 13;
const HEADER_FONT_WEIGHT = 600;

let measureContext: CanvasRenderingContext2D | null = null;

// Returns a function measuring the real rendered text width in the given font.
function createTextMeasurer(fontWeight: number, fontFamily: string): (text: string) => number {
  measureContext ??= document.createElement('canvas').getContext('2d');
  const context = measureContext;
  if (!context) {
    return text => text.length * FONT_SIZE * 0.6;
  }
  const font = `${fontWeight} ${FONT_SIZE}px ${fontFamily}`;
  return text => {
    context.font = font;
    return context.measureText(text).width;
  };
}

function clampWidth(width: number): number {
  return Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, Math.ceil(width) + CELL_PADDING));
}

function headerWidths(columns: DataGridColumn[]): number[] {
  const measure = createTextMeasurer(HEADER_FONT_WEIGHT, SANS_FONT);
  return columns.map(c => clampWidth(measure(c.name)));
}

// Widths fit the header and the first rows, then stay fixed so columns don't jump while scrolling.
function computeColumnWidths(columns: DataGridColumn[], rows: CellValue[][]): number[] {
  const measure = createTextMeasurer(400, MONO_FONT);
  const sample = rows.slice(0, WIDTH_SAMPLE_ROWS);
  return headerWidths(columns).map((width, columnIndex) =>
    sample.reduce((max, row) => Math.max(max, clampWidth(measure(formatCell(row[columnIndex]).text))), width)
  );
}

// Virtualized, read-only result grid: only the visible rows (plus overscan) are rendered.
export default function DataGrid({ columns, rows }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [columnWidths, setColumnWidths] = useState<number[] | null>(null);

  // Computed once, when the first rows arrive (the grid is keyed per result set by its parent).
  if (columnWidths === null && rows.length > 0) {
    setColumnWidths(computeColumnWidths(columns, rows));
  }
  const widths = columnWidths ?? headerWidths(columns);

  const rowNumberWidth = Math.max(44, String(rows.length).length * 8 + CELL_PADDING);
  const gridTemplateColumns = [rowNumberWidth, ...widths].map(w => `${w}px`).join(' ');
  const totalWidth = rowNumberWidth + widths.reduce((sum, w) => sum + w, 0);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  return (
    // isolate: the sticky header/row-number z-indexes stay inside the grid and never cover menus or popups
    <div ref={scrollRef} className="isolate rounded-scrollbar h-full overflow-auto bg-canvas font-mono text-[13px]">
      <div className="min-w-full" style={{ width: totalWidth }}>
        <div
          className="grid sticky top-0 z-10 border-b border-line bg-chrome font-sans font-semibold"
          style={{ gridTemplateColumns }}
        >
          <div className="sticky left-0 border-r border-line bg-chrome"></div>
          {columns.map((column, index) => (
            <div
              key={index}
              className="h-7 truncate border-r border-line px-2 leading-7"
              title={`${column.name} (${column.type})`}
            >
              {column.name}
            </div>
          ))}
        </div>

        <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map(item => {
            const row = rows[item.index];
            return (
              <div
                key={item.key}
                className="grid absolute left-0 w-full border-b border-line-subtle hover:bg-hover"
                style={{ gridTemplateColumns, height: ROW_HEIGHT, transform: `translateY(${item.start}px)` }}
              >
                <div className="sticky left-0 truncate border-r border-line bg-surface px-2 text-right leading-6 text-fg-muted">
                  {item.index + 1}
                </div>
                {columns.map((_, columnIndex) => {
                  const cell = formatCell(row[columnIndex]);
                  return (
                    <div
                      key={columnIndex}
                      className={`truncate border-r border-line-subtle px-2 leading-6 ${cell.isNull ? 'italic text-fg-faint' : ''}`}
                      title={cell.isNull ? undefined : cell.text}
                    >
                      {cell.text}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
