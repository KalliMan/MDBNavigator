import { useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { formatCell } from "./formatCell";
import { CellValue } from "../../models/databaseCommand/result/cellValue";

export interface DataGridColumn {
  name: string;
  type: string;
}

interface Props {
  columns: DataGridColumn[];
  rows: CellValue[][];
}

const ROW_HEIGHT = 32;
const OVERSCAN = 20;
// px-3 on both sides + both borders + a little slack for rounding
const CELL_PADDING = 30;
const MIN_COLUMN_WIDTH = 60;
// Only extremely long values (long text, big JSON) are cut; the cell viewer will show them in full.
const MAX_COLUMN_WIDTH = 1000;
const WIDTH_SAMPLE_ROWS = 1000;
// Must match the grid's Tailwind classes: text-sm (14px), header font-semibold + tracking-wider (0.05em).
const FONT_SIZE = 14;
const HEADER_FONT_WEIGHT = 600;
const HEADER_LETTER_SPACING = FONT_SIZE * 0.05;

let measureContext: CanvasRenderingContext2D | null = null;

// Returns a function measuring the real rendered text width with the page font at the given weight.
function createTextMeasurer(fontWeight: number): (text: string) => number {
  measureContext ??= document.createElement('canvas').getContext('2d');
  const context = measureContext;
  if (!context) {
    return text => text.length * FONT_SIZE * 0.6;
  }
  const font = `${fontWeight} ${FONT_SIZE}px ${getComputedStyle(document.body).fontFamily}`;
  return text => {
    context.font = font;
    return context.measureText(text).width;
  };
}

function clampWidth(width: number): number {
  return Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, Math.ceil(width) + CELL_PADDING));
}

function headerWidths(columns: DataGridColumn[]): number[] {
  const measure = createTextMeasurer(HEADER_FONT_WEIGHT);
  return columns.map(c => clampWidth(measure(c.name) + c.name.length * HEADER_LETTER_SPACING));
}

// Widths fit the header and the first rows, then stay fixed so columns don't jump while scrolling.
function computeColumnWidths(columns: DataGridColumn[], rows: CellValue[][]): number[] {
  const measure = createTextMeasurer(400);
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

  const rowNumberWidth = Math.max(48, String(rows.length).length * 9 + CELL_PADDING);
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
    <div ref={scrollRef} className="isolate rounded-scrollbar h-full overflow-auto text-sm bg-white dark:bg-neutral-700">
      <div className="min-w-full" style={{ width: totalWidth }}>
        <div
          className="grid sticky top-0 z-10 bg-neutral-400 border-b-2 dark:border-neutral-600 font-semibold tracking-wider"
          style={{ gridTemplateColumns }}
        >
          <div className="sticky left-0 bg-neutral-400 border-x dark:border-neutral-600"></div>
          {columns.map((column, index) => (
            <div
              key={index}
              className="px-3 py-2 border-x dark:border-neutral-600 truncate"
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
                className="grid absolute left-0 w-full border-b dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-600"
                style={{ gridTemplateColumns, height: ROW_HEIGHT, transform: `translateY(${item.start}px)` }}
              >
                <div className="sticky left-0 px-3 bg-neutral-400 border-x dark:border-neutral-600 font-medium leading-8 truncate">
                  {item.index + 1}
                </div>
                {columns.map((_, columnIndex) => {
                  const cell = formatCell(row[columnIndex]);
                  return (
                    <div
                      key={columnIndex}
                      className={`px-3 border-x dark:border-neutral-600 leading-8 truncate ${cell.isNull ? 'italic text-neutral-400' : ''}`}
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
