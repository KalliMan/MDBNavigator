import { CellValue } from "../../models/databaseCommand/result/cellValue";
import { DbTypeCategory } from "../../models/databaseCommand/result/dbTypeCategory";
import { cellToText } from "./formatCell";

export interface ViewerText {
  text: string;
  // True when the text was laid out for reading and differs from the stored value.
  formatted: boolean;
}

// What the cell viewer shows for a value. JSON is indented; everything else is the value's full text.
// Only the column's category decides what is JSON, never the look of the text or the database's type name.
export function viewerText(value: CellValue | undefined, category: DbTypeCategory): ViewerText {
  if (value === null || value === undefined) {
    // The viewer shows NULL itself, in italics.
    return { text: '', formatted: false };
  }
  if (category === 'Json' && typeof value === 'string') {
    // Parsing only tests that the text is valid JSON. The result is thrown away: re-serializing it would round
    // big numbers and drop trailing zeros.
    try {
      JSON.parse(value);
    } catch {
      return { text: value, formatted: false };
    }
    return { text: prettyJsonText(value), formatted: true };
  }
  if (typeof value === 'object') {
    // PostgreSQL arrays and hstore arrive already parsed (the server wrote their numbers as JSON numbers).
    return { text: JSON.stringify(value, null, 2), formatted: true };
  }
  return { text: cellToText(value), formatted: false };
}

const INDENT = '  ';

// Re-indents JSON text by two spaces without parsing its values, so numbers keep every digit.
// The caller makes sure the text is valid JSON.
export function prettyJsonText(json: string): string {
  let out = '';
  let depth = 0;
  let inString = false;
  // The previous character was a backslash inside a string, so the next one (maybe a quote) is part of the string.
  let escaped = false;
  const newLine = () => '\n' + INDENT.repeat(depth);

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];

    if (inString) {
      out += ch;
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      out += ch;
    } else if (ch === '{' || ch === '[') {
      let next = i + 1;
      while (next < json.length && /\s/.test(json[next])) {
        next++;
      }
      if (json[next] === '}' || json[next] === ']') {
        // An empty object or array stays on one line.
        out += ch + json[next];
        i = next;
      } else {
        depth++;
        out += ch + newLine();
      }
    } else if (ch === '}' || ch === ']') {
      depth--;
      out += newLine() + ch;
    } else if (ch === ',') {
      out += ch + newLine();
    } else if (ch === ':') {
      out += ': ';
    } else if (!/\s/.test(ch)) {
      out += ch;
    }
  }
  return out;
}
