import { CellValue } from "../../models/databaseCommand/result/cellValue";

// Cells are single-line; very long values are cut for display (the full value comes with the cell viewer).
const MAX_DISPLAY_LENGTH = 1000;

export interface FormattedCell {
  text: string;
  isNull: boolean;
}

// undefined: the row has fewer values than there are columns (shown like NULL).
export function formatCell(value: CellValue | undefined): FormattedCell {
  if (value === null || value === undefined) {
    return { text: 'NULL', isNull: true };
  }

  let text: string;
  if (typeof value === 'boolean') {
    text = value ? 'true' : 'false';
  } else if (typeof value === 'string') {
    text = value;
  } else if (typeof value === 'number') {
    text = value.toString();
  } else {
    // PostgreSQL arrays arrive as arrays, hstore as an object
    text = JSON.stringify(value);
  }

  return {
    text: text.length > MAX_DISPLAY_LENGTH ? text.slice(0, MAX_DISPLAY_LENGTH) + '…' : text,
    isNull: false
  };
}
