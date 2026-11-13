import { CellValue } from "../../models/databaseCommand/result/cellValue";
import { DbTypeCategory } from "../../models/databaseCommand/result/dbTypeCategory";
import { cellToText } from "../../ui/dataGrid/formatCell";

export type ExportFormat = 'csv' | 'json';

export interface ExportColumn {
  name: string;
  category: DbTypeCategory;
}

// The rows to write, in order: a list of row indexes as in the grid (sort and filter), or null for all rows.
function rowsInView(rows: CellValue[][], view: Int32Array | null): CellValue[][] {
  if (!view) {
    return rows;
  }
  return Array.from(view, index => rows[index]);
}

// One CSV field (RFC 4180). NULL is an empty field and an empty string is "", so the two can be told apart
// (PostgreSQL's own convention).
function csvField(value: CellValue | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  return csvText(cellToText(value), true);
}

function csvText(text: string, quoteEmpty: boolean): string {
  if (text === '') {
    return quoteEmpty ? '""' : '';
  }
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// The rows as CSV text: a header line, then one line per row, lines joined by CRLF with none after the last.
// No byte order mark here: only the downloaded file gets one (the CSV view and the clipboard must not show it).
export function toCsv(columnNames: string[], rows: CellValue[][], view: Int32Array | null): string {
  const lines = [columnNames.map(name => csvText(name, true)).join(',')];
  for (const row of rowsInView(rows, view)) {
    // Built column by column, so a row shorter than the header still gives every field.
    const fields: string[] = [];
    for (let column = 0; column < columnNames.length; column++) {
      fields.push(csvField(row[column]));
    }
    lines.push(fields.join(','));
  }
  return lines.join('\r\n');
}

// One JSON key per column: the first use of a name keeps it, a later one becomes name_2, name_3, ... (skipping
// any key already taken), so no value is lost to a repeated column name.
export function jsonKeys(columnNames: string[]): string[] {
  const taken = new Set<string>();
  const uses = new Map<string, number>();
  return columnNames.map(name => {
    let key = name;
    let n = uses.get(name) ?? 1;
    while (taken.has(key)) {
      n++;
      key = `${name}_${n}`;
    }
    uses.set(name, n);
    taken.add(key);
    return key;
  });
}

// A JSON value as the server sent it. A Json column holds text that is already JSON; it is embedded as that text
// and never parsed and written again, because a number like 12345678901234567890 would lose digits that way.
function jsonValue(value: CellValue | undefined, category: DbTypeCategory): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (category === 'Json' && typeof value === 'string') {
    try {
      JSON.parse(value);
      return value.trim();
    } catch {
      // Not valid JSON after all: it is written as a plain string below.
    }
  }
  return JSON.stringify(value);
}

// The rows as a JSON array with one object per row, keyed by column name, one row per line.
// bigint and numeric stay strings, exactly as the server sent them.
export function toJson(columns: ExportColumn[], rows: CellValue[][], view: Int32Array | null): string {
  const keys = jsonKeys(columns.map(c => c.name)).map(key => JSON.stringify(key));
  const lines = rowsInView(rows, view).map(row => {
    const members = columns.map((column, i) => `${keys[i]}: ${jsonValue(row[i], column.category)}`);
    return `  {${members.join(', ')}}`;
  });
  return lines.length === 0 ? '[]' : `[\n${lines.join(',\n')}\n]`;
}

const pad = (n: number) => n.toString().padStart(2, '0');

// {database}_result{N}_{yyyyMMdd}_{HHmmss}.{format}, in local time. Anything but letters, digits, _ and - in the
// database name becomes _, so the name is safe on every file system.
export function exportFileName(databaseName: string, resultNumber: number, at: Date, format: ExportFormat): string {
  const safe = databaseName.replace(/[^A-Za-z0-9_-]+/g, '_') || 'query';
  const date = `${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}`;
  const time = `${pad(at.getHours())}${pad(at.getMinutes())}${pad(at.getSeconds())}`;
  return `${safe}_result${resultNumber}_${date}_${time}.${format}`;
}
