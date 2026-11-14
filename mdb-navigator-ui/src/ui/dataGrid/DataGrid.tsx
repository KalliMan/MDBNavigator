import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { LuArrowDown, LuArrowUp, LuArrowUpDown } from "react-icons/lu";
import CellViewer from "./CellViewer";
import { CELL_PADDING, computeColumnWidths, fitColumnWidth, headerWidths, MAX_RESIZE_WIDTH, MIN_RESIZE_WIDTH } from "./columnWidths";
import { formatCell } from "./formatCell";
import { selectionToText } from "./clipboardText";
import GridContextMenu from "./GridContextMenu";
import { clampMenuPosition, columnOffsets, GRID_MENU_SIZE, HEADER_HEIGHT, ROW_HEIGHT, scrollToReveal } from "./gridGeometry";
import { matchParts, nextSort, SortState } from "./rowView";
import {
  CellPosition,
  extendTo,
  GridSelection,
  isInRange,
  isMoveKey,
  moveSelection,
  rangeOf,
  selectAll,
  selectCell,
  selectColumns,
  selectRows,
  SelectionSize,
  sizeOf,
} from "./selection";
import { CellValue } from "../../models/databaseCommand/result/cellValue";
import { DbTypeCategory } from "../../models/databaseCommand/result/dbTypeCategory";
import { CoordPosition } from "../../types/coordPosition";
import { endDrag, startDrag } from "../sidebar/dragSelection";

export interface DataGridColumn {
  name: string;
  // The database's own type name; shown in the header tooltip.
  typeName: string;
  category: DbTypeCategory;
}

interface Props {
  columns: DataGridColumn[];
  rows: CellValue[][];
  // The rows to display, as indexes into rows; null shows all rows in their original order.
  view: Int32Array | null;
  sort: SortState | null;
  onSortChange: (sort: SortState | null) => void;
  // False while rows are still arriving: the sort buttons are hidden.
  canSort: boolean;
  // Text to mark in the cells (the filter). Empty: nothing is marked.
  highlight: string;
  // The grid produces the text; the caller owns the clipboard and its error message.
  onCopyText: (text: string) => void;
  // The size of the selection, or null when nothing is selected.
  onSelectionChange?: (size: SelectionSize | null) => void;
}

const OVERSCAN = 20;

// What a pointer event is over: a row-number cell (column null) or a data cell, or neither.
function cellFromTarget(target: EventTarget): { row: number; column: number | null } | null {
  const element = target instanceof Element ? target.closest<HTMLElement>('[data-row]') : null;
  if (!element) {
    return null;
  }
  return {
    row: Number(element.dataset.row),
    column: element.dataset.col === undefined ? null : Number(element.dataset.col),
  };
}

// Virtualized result grid: only the visible rows (plus overscan) are rendered. Cells can be selected (one rectangle)
// and copied; the selection logic lives in selection.ts, the clipboard text in clipboardText.ts.
export default function DataGrid({ columns, rows, view, sort, onSortChange, canSort, highlight, onCopyText, onSelectionChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [columnWidths, setColumnWidths] = useState<number[] | null>(null);
  const [selection, setSelection] = useState<GridSelection | null>(null);
  const [menu, setMenu] = useState<CoordPosition | null>(null);
  // What a pressed pointer is dragging: cells (a rectangle) or whole rows (started on a row number).
  const drag = useRef<'cells' | 'rows' | null>(null);
  // The column whose edge is being dragged, and where that drag started.
  const [resizing, setResizing] = useState<number | null>(null);
  const resizeStart = useRef<{ column: number; startX: number; startWidth: number } | null>(null);
  // The cell shown in the cell viewer dialog.
  const [viewer, setViewer] = useState<CellPosition | null>(null);
  // The view the selection belongs to. Sorting or filtering moves the rows under a selection, so it is dropped
  // (during render, like columnWidths below; the parent clears its own copy in the handlers that change the view).
  const [shownView, setShownView] = useState(view);
  if (shownView !== view) {
    setShownView(view);
    setSelection(null);
    setViewer(null);
    setMenu(null);
  }
  // The text to mark in the cells.
  const needle = highlight.trim();

  // Measured once, when the first rows arrive (the grid is keyed per result set by its parent); after that only
  // the user's resizing changes the widths.
  if (columnWidths === null && rows.length > 0) {
    setColumnWidths(computeColumnWidths(columns, rows));
  }
  const widths = columnWidths ?? headerWidths(columns);

  const rowNumberWidth = Math.max(44, String(rows.length).length * 8 + CELL_PADDING);
  const totalWidth = rowNumberWidth + widths.reduce((sum, w) => sum + w, 0);

  // Everything below reads rows through these two, so a view (sorting, filtering) changes only them.
  const rowCount = view ? view.length : rows.length;
  const getRow = (index: number) => rows[view ? view[index] : index];
  const offsets = columnOffsets(widths, rowNumberWidth);
  const range = selection ? rangeOf(selection) : null;

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  // Only the visible columns are rendered, so a very wide result stays responsive.
  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: index => widths[index],
    // The row-number column comes first, so the data columns start after it.
    paddingStart: rowNumberWidth,
    overscan: 3,
  });
  // Only the range of visible indexes comes from the virtualizer. Where a column sits comes from offsets and widths,
  // which are right in the same render in which a width changes; the virtualizer catches up one render later.
  const visibleColumns = columnVirtualizer.getVirtualItems().map(item => item.index);

  // The virtualizer caches sizes; without this it would keep computing the visible columns from the old widths.
  useLayoutEffect(() => {
    columnVirtualizer.measure();
  }, [columnVirtualizer, columnWidths, rowNumberWidth]);

  // The pointer can be released anywhere, also outside the grid, so the end of a drag is listened for on the window.
  useEffect(() => {
    const stopDrag = () => {
      drag.current = null;
    };
    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);
    return () => {
      window.removeEventListener('pointerup', stopDrag);
      window.removeEventListener('pointercancel', stopDrag);
    };
  }, []);

  // Safety net: never leave the page in drag mode if unmounted mid-drag.
  useEffect(() => () => {
    if (resizeStart.current) {
      endDrag();
    }
  }, []);

  // Every selection change goes through here, from event handlers, so the caller hears about it without an effect.
  function select(next: GridSelection | null) {
    setSelection(next);
    onSelectionChange?.(next ? sizeOf(next) : null);
  }

  function copySelection(withHeaders: boolean) {
    if (!range) {
      return;
    }
    onCopyText(selectionToText(range, columns.map(c => c.name), getRow, withHeaders));
  }

  function closeMenu() {
    setMenu(null);
    scrollRef.current?.focus({ preventScroll: true });
  }

  // Rows have a fixed height, so where a cell is follows from arithmetic; the virtualizer isn't needed for this.
  function revealCell(position: CellPosition) {
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    const next = scrollToReveal(
      {
        scrollTop: container.scrollTop,
        scrollLeft: container.scrollLeft,
        clientWidth: container.clientWidth,
        clientHeight: container.clientHeight,
      },
      {
        top: HEADER_HEIGHT + position.row * ROW_HEIGHT,
        left: offsets[position.column],
        width: widths[position.column],
        height: ROW_HEIGHT,
      },
      { top: HEADER_HEIGHT, left: rowNumberWidth },
    );
    if (next.scrollTop !== container.scrollTop) {
      container.scrollTop = next.scrollTop;
    }
    if (next.scrollLeft !== container.scrollLeft) {
      container.scrollLeft = next.scrollLeft;
    }
  }

  function closeViewer() {
    setViewer(null);
    scrollRef.current?.focus({ preventScroll: true });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    // The dialog owns the keyboard while it is open. (React sends the dialog's key events up through its portal
    // to this handler too.)
    if (viewer || rowCount === 0 || columns.length === 0) {
      return;
    }
    const mod = e.ctrlKey || e.metaKey;

    if (e.key === 'Enter' && selection) {
      e.preventDefault();
      setViewer(selection.anchor);
    } else if (mod && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      select(selectAll(rowCount, columns.length));
    } else if (mod && e.key.toLowerCase() === 'c') {
      // preventDefault also stops Ctrl+Shift+C from opening the browser's developer tools.
      e.preventDefault();
      copySelection(e.shiftKey);
    } else if (e.key === 'Escape') {
      if (menu) {
        e.preventDefault();
        closeMenu();
      } else if (selection) {
        e.preventDefault();
        select(null);
      }
    } else if (isMoveKey(e.key)) {
      e.preventDefault();
      if (!selection) {
        // range is the visible rows; getVirtualItems() would start at the overscan rows above them.
        const first = selectCell({ row: virtualizer.range?.startIndex ?? 0, column: 0 });
        select(first);
        revealCell(first.anchor);
        return;
      }
      const pageRows = Math.max(1, Math.floor((e.currentTarget.clientHeight - HEADER_HEIGHT) / ROW_HEIGHT) - 1);
      const next = moveSelection(selection, e.key, { extend: e.shiftKey, jump: mod }, rowCount, columns.length, pageRows);
      select(next);
      revealCell(e.shiftKey ? next.focus : next.anchor);
    }
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) {
      return;
    }
    const cell = cellFromTarget(e.target);
    if (!cell) {
      return;
    }

    if (cell.column === null) {
      drag.current = 'rows';
      const from = e.shiftKey && selection ? selection.anchor.row : cell.row;
      select(selectRows(from, cell.row, columns.length));
    } else {
      drag.current = 'cells';
      const position = { row: cell.row, column: cell.column };
      select(e.shiftKey && selection ? extendTo(selection, position) : selectCell(position));
    }
    scrollRef.current?.focus({ preventScroll: true });
  }

  function handlePointerOver(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current || !selection) {
      return;
    }
    const cell = cellFromTarget(e.target);
    if (!cell) {
      return;
    }

    if (drag.current === 'rows') {
      if (cell.row !== selection.focus.row) {
        select(selectRows(selection.anchor.row, cell.row, columns.length));
      }
    } else if (cell.column !== null && (cell.row !== selection.focus.row || cell.column !== selection.focus.column)) {
      select(extendTo(selection, { row: cell.row, column: cell.column }));
    }
  }

  function handleContextMenu(e: MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    const cell = cellFromTarget(e.target);
    let current = selection;
    // Right-click inside the selection keeps it; outside, the cell (or the row of a row number) under the pointer
    // is selected first.
    if (cell && cell.column !== null && !(range && isInRange(range, cell.row, cell.column))) {
      current = selectCell({ row: cell.row, column: cell.column });
      select(current);
    } else if (cell && cell.column === null && !(range && cell.row >= range.top && cell.row <= range.bottom)) {
      current = selectRows(cell.row, cell.row, columns.length);
      select(current);
    }
    if (!current) {
      return;
    }
    setMenu(clampMenuPosition(e.pageX, e.pageY, GRID_MENU_SIZE, {
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    }));
  }

  // A double-click on a data cell opens its value. The first click already selected the cell; the check covers
  // a double-click that arrives before the selection has been drawn.
  function handleDoubleClick(e: MouseEvent<HTMLDivElement>) {
    const cell = cellFromTarget(e.target);
    if (!cell || cell.column === null) {
      return;
    }
    const position = { row: cell.row, column: cell.column };
    if (selection?.anchor.row !== position.row || selection.anchor.column !== position.column) {
      select(selectCell(position));
    }
    setViewer(position);
  }

  function handleResizePointerDown(e: PointerEvent<HTMLDivElement>, column: number) {
    if (e.button !== 0) {
      return;
    }
    // Don't let the press select the column or start a text selection.
    e.preventDefault();
    e.stopPropagation();
    // Pointer capture: the drag keeps working when the pointer leaves the narrow handle.
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeStart.current = { column, startX: e.clientX, startWidth: widths[column] };
    setResizing(column);
    startDrag('col');
  }

  function handleResizePointerMove(e: PointerEvent<HTMLDivElement>) {
    const start = resizeStart.current;
    if (!start) {
      return;
    }
    const width = Math.round(Math.min(MAX_RESIZE_WIDTH, Math.max(MIN_RESIZE_WIDTH, start.startWidth + (e.clientX - start.startX))));
    // A full copy of the widths with one replaced, so the array is never partial (also before any row arrived).
    setColumnWidths(widths.map((w, index) => (index === start.column ? width : w)));
  }

  function stopResize() {
    if (resizeStart.current) {
      resizeStart.current = null;
      setResizing(null);
      endDrag();
    }
  }

  // Fit the column to its header and its first rows again.
  function handleResizeDoubleClick(e: MouseEvent<HTMLDivElement>, column: number) {
    e.stopPropagation();
    const fitted = fitColumnWidth(columns[column], column, getRow, rowCount);
    setColumnWidths(widths.map((w, index) => (index === column ? fitted : w)));
  }

  function handleHeaderPointerDown(e: PointerEvent<HTMLDivElement>, index: number) {
    if (e.button !== 0 || rowCount === 0) {
      return;
    }
    const from = e.shiftKey && selection ? selection.anchor.column : index;
    select(selectColumns(from, index, rowCount));
  }

  function handleSelectAll() {
    if (rowCount > 0 && columns.length > 0) {
      select(selectAll(rowCount, columns.length));
    }
  }

  return (
    // isolate: the sticky header/row-number z-indexes stay inside the grid and never cover menus or popups
    // select-none: the browser's own text selection would fight ours; copying goes through Ctrl+C.
    <div
      ref={scrollRef}
      tabIndex={0}
      role="grid"
      aria-label="Query result"
      aria-rowcount={rowCount}
      aria-colcount={columns.length}
      aria-multiselectable="true"
      className="isolate rounded-scrollbar h-full select-none overflow-auto bg-canvas font-mono text-[13px] outline-none"
      onKeyDown={handleKeyDown}
      onScroll={() => {
        if (menu) {
          setMenu(null);
        }
      }}
    >
      <div className="relative min-w-full" style={{ width: totalWidth }}>
        {/* Cells are placed with absolute lefts and widths, not a CSS grid: a grid needs every column in the DOM. */}
        <div
          role="row"
          // min-w-full: with few columns the header band still spans the grid.
          className="sticky top-0 z-10 h-7 min-w-full border-b border-line bg-chrome font-sans font-semibold"
          style={{ width: totalWidth }}
        >
          <div
            role="columnheader"
            aria-label="Select all"
            // z-[3]: above the resize handles (z-[2]), so a handle scrolled under the corner can't be grabbed.
            className="sticky left-0 z-[3] h-full cursor-pointer border-r border-line bg-chrome"
            style={{ width: rowNumberWidth }}
            onClick={handleSelectAll}
          ></div>
          {visibleColumns.map(c => {
            const sorted = sort?.column === c ? sort.direction : null;
            const numeric = columns[c].category === 'Number';
            return (
              <div
                key={c}
                role="columnheader"
                aria-colindex={c + 1}
                aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}
                // The name is cut inside its own span, so the sort button next to it is never cut off.
                // In a numeric column the sort button goes to the left (flex-row-reverse), so the name ends where the
                // numbers end.
                className={`group absolute top-0 flex h-full cursor-pointer items-center gap-1 border-r border-line px-2 ${numeric ? 'flex-row-reverse' : ''} ${range && c >= range.left && c <= range.right ? 'bg-selected text-on-selected' : ''}`}
                style={{ left: offsets[c], width: widths[c] }}
                title={`${columns[c].name} (${columns[c].typeName})`}
                onPointerDown={e => handleHeaderPointerDown(e, c)}
              >
                <span className={`min-w-0 flex-1 truncate ${numeric ? 'text-right' : ''}`}>{columns[c].name}</span>
                {canSort && (
                  <button
                    type="button"
                    aria-label={`Sort by ${columns[c].name}`}
                    title={sorted ? (sorted === 'asc' ? 'Sorted ascending. Click for descending.' : 'Sorted descending. Click to clear.') : 'Sort ascending'}
                    // The header selects its column on pointer down; the button only sorts.
                    onPointerDown={e => e.stopPropagation()}
                    onClick={() => onSortChange(nextSort(sort, c))}
                    className={`flex size-5 flex-none items-center justify-center rounded-[3px] cursor-pointer hover:bg-hover focus-visible:opacity-100 ${
                      sorted ? 'text-accent-strong' : 'text-fg-muted opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {sorted === 'asc' ? <LuArrowUp size={13} aria-hidden="true" />
                      : sorted === 'desc' ? <LuArrowDown size={13} aria-hidden="true" />
                      : <LuArrowUpDown size={13} aria-hidden="true" />}
                  </button>
                )}
              </div>
            );
          })}
          {/* After all the header cells, so each handle sits on top of the cell edge it belongs to. */}
          {visibleColumns.map(c => (
            <div
              key={c}
              role="separator"
              aria-orientation="vertical"
              aria-label={`Resize ${columns[c].name}`}
              className={`absolute top-0 z-[2] h-full w-[7px] cursor-col-resize touch-none ${resizing === c ? 'bg-accent' : ''}`}
              style={{ left: offsets[c] + widths[c] - 4 }}
              onPointerDown={e => handleResizePointerDown(e, c)}
              onPointerMove={handleResizePointerMove}
              onPointerUp={stopResize}
              onLostPointerCapture={stopResize}
              onDoubleClick={e => handleResizeDoubleClick(e, c)}
            />
          ))}
        </div>

        {/* One handler set for all cells: thousands are on screen, so none has its own. */}
        <div
          className="relative"
          style={{ height: virtualizer.getTotalSize() }}
          onPointerDown={handlePointerDown}
          onPointerOver={handlePointerOver}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
        >
          {virtualizer.getVirtualItems().map(item => {
            const row = getRow(item.index);
            const rowSelected = range !== null && item.index >= range.top && item.index <= range.bottom;
            return (
              <div
                key={item.key}
                role="row"
                // min-w-full: with few columns the row line and hover still span the grid.
                className="absolute left-0 min-w-full border-b border-line-subtle hover:bg-hover"
                // top, not transform: a transform would make each row its own stacking context, and the sticky
                // row number's z-index could then no longer lift it above the selection outline.
                // The width is the content width, so the sticky row number has room to stick while scrolling.
                style={{ width: totalWidth, height: ROW_HEIGHT, top: item.start }}
              >
                <div
                  data-row={item.index}
                  className={`sticky left-0 z-[1] h-full truncate border-r border-line px-2 text-right leading-6 ${rowSelected ? 'bg-selected text-on-selected' : 'bg-surface text-fg-muted'}`}
                  style={{ width: rowNumberWidth }}
                >
                  {/* The number in the original result, so it stays the same after sorting or filtering. */}
                  {(view ? view[item.index] : item.index) + 1}
                </div>
                {visibleColumns.map(c => {
                  const cell = formatCell(row[c]);
                  const numeric = columns[c].category === 'Number';
                  const selected = range !== null && isInRange(range, item.index, c);
                  // The anchor (the active cell) stays on the canvas color, as in a spreadsheet.
                  const isAnchor = selection?.anchor.row === item.index && selection.anchor.column === c;
                  return (
                    <div
                      key={c}
                      role="gridcell"
                      aria-colindex={c + 1}
                      data-row={item.index}
                      data-col={c}
                      aria-selected={selected}
                      className={`absolute top-0 h-full truncate border-r border-line-subtle px-2 leading-6 ${numeric ? 'text-right' : ''} ${selected && !isAnchor ? 'bg-selected' : ''} ${cell.isNull ? 'italic text-fg-faint' : ''}`}
                      style={{ left: offsets[c], width: widths[c] }}
                      title={cell.isNull ? undefined : cell.text}
                    >
                      {needle && !cell.isNull
                        ? matchParts(cell.text, needle).map((part, i) => part.match
                          ? <mark key={i} className="rounded-[2px] bg-match text-inherit">{part.text}</mark>
                          : part.text)
                        : cell.text}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {range && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute border-2 border-accent"
              style={{
                top: range.top * ROW_HEIGHT,
                left: offsets[range.left],
                width: offsets[range.right] + widths[range.right] - offsets[range.left],
                height: (range.bottom - range.top + 1) * ROW_HEIGHT,
              }}
            />
          )}
        </div>

        {resizing !== null && (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 z-20 h-full w-px bg-accent"
              style={{ left: offsets[resizing] + widths[resizing] - 1 }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute z-20 whitespace-nowrap rounded bg-fg px-1.5 py-0.5 font-sans text-[11px] text-canvas"
              style={{ left: offsets[resizing] + widths[resizing] + 6, top: HEADER_HEIGHT + 4 }}
            >
              {columns[resizing].name}: {widths[resizing]} px
            </div>
          </>
        )}
      </div>

      {menu && (
        <GridContextMenu
          position={menu}
          onClose={closeMenu}
          onCopy={() => copySelection(false)}
          onCopyWithHeaders={() => copySelection(true)}
          onViewCell={() => {
            if (selection) {
              setViewer(selection.anchor);
            }
          }}
          onSelectAll={handleSelectAll}
        />
      )}

      {viewer && (
        <CellViewer
          columnName={columns[viewer.column].name}
          typeName={columns[viewer.column].typeName}
          category={columns[viewer.column].category}
          rowNumber={(view ? view[viewer.row] : viewer.row) + 1}
          value={getRow(viewer.row)?.[viewer.column]}
          onCopyText={onCopyText}
          onClose={closeViewer}
        />
      )}
    </div>
  );
}
