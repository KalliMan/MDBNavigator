// The grid's selection: one rectangle of cells, like a spreadsheet. Pure functions, so they are unit tested.
// All indexes are positions in the grid as displayed: row 0 is the first displayed row, column 0 the first data
// column (the row-number column is not a column here).

export interface CellPosition {
  row: number;
  column: number;
}

// A rectangle of cells between two corners, both included. anchor is the active cell (where the selection began);
// focus is the corner that Shift+click, dragging and Shift+arrows move.
export interface GridSelection {
  anchor: CellPosition;
  focus: CellPosition;
}

export interface SelectionRange {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface SelectionSize {
  rows: number;
  columns: number;
}

export type MoveKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End' | 'PageUp' | 'PageDown';

const MOVE_KEYS: readonly string[] = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'];

export function rangeOf(selection: GridSelection): SelectionRange {
  const { anchor, focus } = selection;
  return {
    top: Math.min(anchor.row, focus.row),
    bottom: Math.max(anchor.row, focus.row),
    left: Math.min(anchor.column, focus.column),
    right: Math.max(anchor.column, focus.column),
  };
}

export function sizeOf(selection: GridSelection): SelectionSize {
  const range = rangeOf(selection);
  return { rows: range.bottom - range.top + 1, columns: range.right - range.left + 1 };
}

export function isInRange(range: SelectionRange, row: number, column: number): boolean {
  return row >= range.top && row <= range.bottom && column >= range.left && column <= range.right;
}

export function selectCell(position: CellPosition): GridSelection {
  return { anchor: position, focus: position };
}

// Shift+click and dragging: the anchor stays, the far corner moves.
export function extendTo(selection: GridSelection, position: CellPosition): GridSelection {
  return { anchor: selection.anchor, focus: position };
}

export function selectRows(fromRow: number, toRow: number, columnCount: number): GridSelection {
  return { anchor: { row: fromRow, column: 0 }, focus: { row: toRow, column: columnCount - 1 } };
}

export function selectColumns(fromColumn: number, toColumn: number, rowCount: number): GridSelection {
  return { anchor: { row: 0, column: fromColumn }, focus: { row: rowCount - 1, column: toColumn } };
}

export function selectAll(rowCount: number, columnCount: number): GridSelection {
  return { anchor: { row: 0, column: 0 }, focus: { row: rowCount - 1, column: columnCount - 1 } };
}

export function isMoveKey(key: string): key is MoveKey {
  return MOVE_KEYS.includes(key);
}

function clamp(value: number, max: number): number {
  return Math.min(Math.max(value, 0), max);
}

// Callers guarantee rowCount > 0 and columnCount > 0.
// The cell that moves is the focus when extending, else the anchor; without extend the selection collapses to it.
export function moveSelection(
  selection: GridSelection,
  key: MoveKey,
  modifiers: { extend: boolean; jump: boolean },
  rowCount: number,
  columnCount: number,
  pageRows: number,
): GridSelection {
  const lastRow = rowCount - 1;
  const lastColumn = columnCount - 1;
  const from = modifiers.extend ? selection.focus : selection.anchor;
  let { row, column } = from;

  switch (key) {
    case 'ArrowUp':
      row = modifiers.jump ? 0 : row - 1;
      break;
    case 'ArrowDown':
      row = modifiers.jump ? lastRow : row + 1;
      break;
    case 'ArrowLeft':
      column = modifiers.jump ? 0 : column - 1;
      break;
    case 'ArrowRight':
      column = modifiers.jump ? lastColumn : column + 1;
      break;
    case 'Home':
      column = 0;
      if (modifiers.jump) row = 0;
      break;
    case 'End':
      column = lastColumn;
      if (modifiers.jump) row = lastRow;
      break;
    case 'PageUp':
      row -= pageRows;
      break;
    case 'PageDown':
      row += pageRows;
      break;
  }

  const target = { row: clamp(row, lastRow), column: clamp(column, lastColumn) };
  return modifiers.extend ? { anchor: selection.anchor, focus: target } : selectCell(target);
}
