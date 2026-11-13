import { CellValue } from "../../models/databaseCommand/result/cellValue";

// Cells are single-line; very long values are cut for display (the full value comes with the cell viewer).
const MAX_DISPLAY_LENGTH = 1000;

export interface FormattedCell {
  text: string;
  isNull: boolean;
}

// The full text of a value, as copied, exported and filtered. NULL (and a missing cell) is the empty string.
// Never cut: only formatCell shortens text, and only for display.
export function cellToText(value: CellValue | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  // PostgreSQL arrays arrive as arrays, hstore as an object
  return JSON.stringify(value);
}

// undefined: the row has fewer values than there are columns (shown like NULL).
export function formatCell(value: CellValue | undefined): FormattedCell {
  if (value === null || value === undefined) {
    return { text: 'NULL', isNull: true };
  }

  const text = cellToText(value);
  return {
    text: text.length > MAX_DISPLAY_LENGTH ? text.slice(0, MAX_DISPLAY_LENGTH) + '…' : text,
    isNull: false
  };
}
