// While a splitter is dragged: no text selection anywhere on the page, and the resize cursor everywhere
// (also over elements with their own cursor, like the Monaco editor). See .is-resizing-* in index.css.
export function startDrag(direction: 'col' | 'row') {
  document.body.classList.add(`is-resizing-${direction}`);
}

export function endDrag() {
  document.body.classList.remove('is-resizing-col', 'is-resizing-row');
}
