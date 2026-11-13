import { cellToText } from './formatCell';
import { CellValue } from '../../models/databaseCommand/result/cellValue';
import { DbTypeCategory } from '../../models/databaseCommand/result/dbTypeCategory';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  column: number;
  direction: SortDirection;
}

// The next step of a header's sort button: off → ascending → descending → off. Another column starts ascending.
export function nextSort(current: SortState | null, column: number): SortState | null {
  if (current === null || current.column !== column) {
    return { column, direction: 'asc' };
  }
  return current.direction === 'asc' ? { column, direction: 'desc' } : null;
}

// One lower-cased line of text per row, built once per result so that every keystroke in the filter box only
// searches strings. Cells are joined with a character that can't be typed, so a match never spans two cells.
export function buildSearchText(rows: CellValue[][]): string[] {
  return rows.map(row => row.map(value => cellToText(value).toLowerCase()).join('\u0000'));
}

// One instance: creating a collator is slow, and comparing with it is far faster than localeCompare per call.
const collator = new Intl.Collator(undefined);

// A decimal written out as text: an optional sign, digits, and an optional fraction. (PostgreSQL writes numeric and
// bigint like this; it never uses an exponent.)
const DECIMAL = /^([+-]?)(\d*)(?:\.(\d*))?$/;

// Exact comparison of two decimal strings, for the case where their doubles are equal (more than 15 significant
// digits). Anything that isn't a plain decimal compares as equal, so the caller's stable order decides.
function compareDecimalText(a: string, b: string): number {
  const left = DECIMAL.exec(a);
  const right = DECIMAL.exec(b);
  if (!left || !right) {
    return 0;
  }
  const parse = (match: RegExpExecArray) => {
    const integer = match[2].replace(/^0+/, '');
    const fraction = (match[3] ?? '').replace(/0+$/, '');
    // Zero has no sign, so '-0' and '0.00' are equal.
    const sign = integer === '' && fraction === '' ? 0 : match[1] === '-' ? -1 : 1;
    return { sign, integer, fraction };
  };
  const x = parse(left);
  const y = parse(right);
  if (x.sign !== y.sign) {
    return x.sign < y.sign ? -1 : 1;
  }
  let magnitude = 0;
  if (x.integer.length !== y.integer.length) {
    magnitude = x.integer.length < y.integer.length ? -1 : 1;
  } else if (x.integer !== y.integer) {
    magnitude = x.integer < y.integer ? -1 : 1;
  } else if (x.fraction !== y.fraction) {
    // Trailing zeros are gone, so comparing the digits as text is comparing the fractions ('5' < '51').
    magnitude = x.fraction < y.fraction ? -1 : 1;
  }
  return x.sign < 0 ? -magnitude : magnitude;
}

function compareNumbers(a: CellValue, b: CellValue): number {
  const x = Number(a);
  const y = Number(b);
  // PostgreSQL puts NaN after everything else, including Infinity.
  if (Number.isNaN(x) || Number.isNaN(y)) {
    return Number.isNaN(x) ? (Number.isNaN(y) ? 0 : 1) : -1;
  }
  if (x !== y) {
    return x < y ? -1 : 1;
  }
  // bigint and numeric arrive as text, and doubles can't tell 9007199254740992 from 9007199254740993.
  return typeof a === 'string' && typeof b === 'string' ? compareDecimalText(a, b) : 0;
}

// Order of two non-null values of a column; negative when a comes first.
export function compareValues(a: CellValue, b: CellValue, category: DbTypeCategory): number {
  switch (category) {
    case 'Number':
      return compareNumbers(a, b);
    case 'Boolean': {
      const x = cellToText(a) === 'true';
      const y = cellToText(b) === 'true';
      return x === y ? 0 : x ? 1 : -1;
    }
    case 'Text':
      return collator.compare(cellToText(a), cellToText(b));
    default: {
      // ISO dates and times sort correctly by their text code units.
      const x = cellToText(a);
      const y = cellToText(b);
      return x < y ? -1 : x > y ? 1 : 0;
    }
  }
}

// The rows to display, as indexes into rows, or null for "all rows in their original order".
// filter is matched case-insensitively against every cell; an empty or blank filter matches everything.
export function buildView(
  rows: CellValue[][],
  categories: DbTypeCategory[],
  searchText: string[] | null,
  filter: string,
  sort: SortState | null,
): Int32Array | null {
  const needle = filter.trim().toLowerCase();
  if (!needle && !sort) {
    return null;
  }

  let kept: number[] = [];
  if (needle) {
    const lines = searchText ?? buildSearchText(rows);
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(needle)) {
        kept.push(i);
      }
    }
  } else {
    kept = Array.from({ length: rows.length }, (_, i) => i);
  }

  const view = Int32Array.from(kept);
  if (sort) {
    const { column, direction } = sort;
    const category: DbTypeCategory = categories[column] ?? 'Other';
    const sign = direction === 'desc' ? -1 : 1;
    view.sort((i, j) => {
      const a = rows[i][column];
      const b = rows[j][column];
      const aNull = a === null || a === undefined;
      const bNull = b === null || b === undefined;
      // NULLs go last in both directions, so they are handled before the direction is applied.
      if (aNull || bNull) {
        return aNull && bNull ? i - j : aNull ? 1 : -1;
      }
      // Equal values keep their original order, in both directions.
      return sign * compareValues(a, b, category) || i - j;
    });
  }
  return view;
}

export interface TextPart {
  text: string;
  match: boolean;
}

// Splits text at every case-insensitive occurrence of needle, for marking matches. An empty needle gives one part.
export function matchParts(text: string, needle: string): TextPart[] {
  if (!needle) {
    return [{ text, match: false }];
  }
  const haystack = text.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  // A few characters change length when lower-cased (for example 'İ'); the positions found would then not fit
  // the original text, so such a text is left unmarked rather than cut in the wrong place.
  if (haystack.length !== text.length) {
    return [{ text, match: false }];
  }
  const parts: TextPart[] = [];
  let position = 0;
  for (;;) {
    const found = haystack.indexOf(lowerNeedle, position);
    if (found < 0) {
      break;
    }
    if (found > position) {
      parts.push({ text: text.slice(position, found), match: false });
    }
    parts.push({ text: text.slice(found, found + lowerNeedle.length), match: true });
    position = found + lowerNeedle.length;
  }
  if (position < text.length) {
    parts.push({ text: text.slice(position), match: false });
  }
  // text can be empty: still one part.
  return parts.length > 0 ? parts : [{ text, match: false }];
}
