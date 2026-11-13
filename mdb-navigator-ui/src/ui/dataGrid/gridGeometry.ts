// Sizes and positions of the result grid, as pure functions so they can be unit tested.

export const ROW_HEIGHT = 24;
export const HEADER_HEIGHT = 28;

// Left edge of each data column in the grid's content, after the row-number column.
export function columnOffsets(widths: number[], rowNumberWidth: number): number[] {
  const offsets: number[] = [];
  let left = rowNumberWidth;
  for (const width of widths) {
    offsets.push(left);
    left += width;
  }
  return offsets;
}

export interface Viewport {
  scrollTop: number;
  scrollLeft: number;
  clientWidth: number;
  clientHeight: number;
}

// One axis of scrollToReveal. sticky is the size of what stays on top of the content at the start edge.
function revealAxis(scroll: number, start: number, size: number, client: number, sticky: number): number {
  if (start < scroll + sticky) {
    return Math.max(0, start - sticky);
  }
  if (start + size > scroll + client) {
    // A cell larger than the visible area can't fit: show its start edge instead of its end.
    return Math.max(0, size > client - sticky ? start - sticky : start + size - client);
  }
  return scroll;
}

// The scroll position that brings a cell fully into view, moving as little as possible. The header stays on top
// and the row-number column on the left, so the cell must clear both.
export function scrollToReveal(
  viewport: Viewport,
  cell: { top: number; left: number; width: number; height: number },
  sticky: { top: number; left: number },
): { scrollTop: number; scrollLeft: number } {
  return {
    scrollTop: revealAxis(viewport.scrollTop, cell.top, cell.height, viewport.clientHeight, sticky.top),
    scrollLeft: revealAxis(viewport.scrollLeft, cell.left, cell.width, viewport.clientWidth, sticky.left),
  };
}

const MENU_MARGIN = 8;

// The grid's context menu is rendered in a portal and nothing keeps it inside the window, so the grid clamps its
// position with this size before opening it. Raise the height when an item is added to GridContextMenu.
// (It lives here, not in GridContextMenu.tsx: the lint rule for fast refresh wants component files to export components only.)
export const GRID_MENU_SIZE = { width: 250, height: 150 };

// Keeps a menu of the given size inside the window, 8px from its edges.
export function clampMenuPosition(
  x: number,
  y: number,
  menu: { width: number; height: number },
  page: { scrollX: number; scrollY: number; innerWidth: number; innerHeight: number },
): { x: number; y: number } {
  return {
    x: Math.max(page.scrollX + MENU_MARGIN, Math.min(x, page.scrollX + page.innerWidth - menu.width - MENU_MARGIN)),
    y: Math.max(page.scrollY + MENU_MARGIN, Math.min(y, page.scrollY + page.innerHeight - menu.height - MENU_MARGIN)),
  };
}
