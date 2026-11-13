import type { DataGridColumn } from "./DataGrid";
import { formatCell } from "./formatCell";
import { CellValue } from "../../models/databaseCommand/result/cellValue";
import { MONO_FONT, SANS_FONT } from "../../utils/fonts";

// px-2 on both sides + both borders + a little slack for rounding. Exported: the grid sizes its row-number column with it.
export const CELL_PADDING = 20;
const MIN_COLUMN_WIDTH = 60;
// Only extremely long values (long text, big JSON) are cut; the cell viewer shows them in full.
const MAX_COLUMN_WIDTH = 1000;
const WIDTH_SAMPLE_ROWS = 1000;
// Must match the grid's classes: text-[13px]; cells in the mono font, the header in the sans font, semibold.
const FONT_SIZE = 13;
const HEADER_FONT_WEIGHT = 600;
// The header also holds the sort button (size-5) and the gap before it (gap-1). The room is kept even while the
// button is hidden, so a column name is never cut where there is space for it and widths don't jump when it appears.
const HEADER_SORT_SPACE = 24;

// A dragged column may be narrower and wider than the automatic widths allow: that is the user's choice.
export const MIN_RESIZE_WIDTH = 40;
export const MAX_RESIZE_WIDTH = 2000;

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

export function headerWidths(columns: DataGridColumn[]): number[] {
  const measure = createTextMeasurer(HEADER_FONT_WEIGHT, SANS_FONT);
  return columns.map(c => clampWidth(measure(c.name) + HEADER_SORT_SPACE));
}

// Widths fit the header and the first rows, then stay fixed so columns don't jump while scrolling.
export function computeColumnWidths(columns: DataGridColumn[], rows: CellValue[][]): number[] {
  const measure = createTextMeasurer(400, MONO_FONT);
  const sample = rows.slice(0, WIDTH_SAMPLE_ROWS);
  return headerWidths(columns).map((width, columnIndex) =>
    sample.reduce((max, row) => Math.max(max, clampWidth(measure(formatCell(row[columnIndex]).text))), width)
  );
}

// The width that fits one column's header and its first displayed rows (a double-click on the header edge).
export function fitColumnWidth(
  column: DataGridColumn,
  columnIndex: number,
  getRow: (index: number) => CellValue[],
  rowCount: number,
): number {
  const measureHeader = createTextMeasurer(HEADER_FONT_WEIGHT, SANS_FONT);
  const measureCell = createTextMeasurer(400, MONO_FONT);
  let width = clampWidth(measureHeader(column.name) + HEADER_SORT_SPACE);
  const sampleCount = Math.min(rowCount, WIDTH_SAMPLE_ROWS);
  for (let index = 0; index < sampleCount; index++) {
    width = Math.max(width, clampWidth(measureCell(formatCell(getRow(index)[columnIndex]).text)));
  }
  return width;
}
