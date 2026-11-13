import { CellValue } from "../../models/databaseCommand/result/cellValue";
import { cellToText } from "./formatCell";
import { SelectionRange } from "./selection";

// Excel and Sheets read a field as quoted when it contains a tab or a line break (or starts with a quote), so only
// those fields are quoted; everything else, JSON text included, stays as it is.
function tsvField(text: string): string {
  return /[\t\n\r]/.test(text) || text.startsWith('"') ? `"${text.replace(/"/g, '""')}"` : text;
}

// The selected cells as text for the clipboard. getRow returns the displayed row at an index.
export function selectionToText(
  range: SelectionRange,
  columnNames: string[],
  getRow: (index: number) => CellValue[],
  withHeaders: boolean,
): string {
  // A single cell is copied exactly, without quoting.
  if (range.top === range.bottom && range.left === range.right && !withHeaders) {
    return cellToText(getRow(range.top)[range.left]);
  }

  const lines: string[] = [];
  if (withHeaders) {
    lines.push(columnNames.slice(range.left, range.right + 1).map(tsvField).join('\t'));
  }
  for (let rowIndex = range.top; rowIndex <= range.bottom; rowIndex++) {
    const row = getRow(rowIndex);
    const fields: string[] = [];
    for (let column = range.left; column <= range.right; column++) {
      // A row shorter than the range gives empty fields (cellToText turns undefined into '').
      fields.push(tsvField(cellToText(row[column])));
    }
    lines.push(fields.join('\t'));
  }
  return lines.join('\n');
}
