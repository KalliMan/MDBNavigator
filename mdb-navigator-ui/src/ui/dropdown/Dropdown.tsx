import { KeyboardEvent, ReactNode, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuCheck, LuChevronDown, LuSearch } from 'react-icons/lu';

export interface DropdownOption {
  key: string;
  // The row's content; the check mark for the selected option is added after it.
  content: ReactNode;
  // What the filter box matches (case-insensitive substring).
  filterText?: string;
  selected?: boolean;
  disabled?: boolean;
}

interface Props {
  // The button's content (a color square or icon plus the current value). A chevron is added after it.
  label: ReactNode;
  // Names the button and the list for screen readers, e.g. "Server".
  ariaLabel: string;
  // The button's tooltip; shown on a wrapper, because a disabled button shows none in some browsers.
  title?: string;
  disabled?: boolean;
  // The small uppercase heading at the top of the menu.
  heading: string;
  options: DropdownOption[];
  onSelect: (key: string) => void;
  // Set: a filter box above the options, with this placeholder.
  filterPlaceholder?: string;
  // Set: shown instead of the filter box and the options (loading, an error with Retry).
  status?: ReactNode;
  // Below the options, after a separator, such as "Connect to another server…". It gets a function that closes the menu.
  footer?: (close: () => void) => ReactNode;
  onOpenChange?: (open: boolean) => void;
  // The menu's minimum width in px.
  minWidth?: number;
}

// A button that opens a listbox menu, following the WAI-ARIA "select-only listbox" pattern (arrows, Home/End,
// Enter or Space to pick, Esc to close). It renders in a portal, so the editor and the splitter can't clip it.
// It knows nothing about what the options mean. Our own component: 1.2 decided against a UI library such as Radix.
export default function Dropdown({
  label, ariaLabel, title, disabled, heading, options, onSelect, filterPlaceholder, status, footer, onOpenChange, minWidth,
}: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  // close() is bound in document listeners, so it reads the latest callback through a ref instead of changing identity.
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    onOpenChangeRef.current?.(false);
    if (returnFocus) {
      triggerRef.current?.focus();
    }
  }, []);

  const hasStatus = !!status;
  const hasFilter = !!filterPlaceholder && !hasStatus;

  // Computed during render, so typing in the filter can never leave the highlight on a hidden row.
  const needle = filter.trim().toLowerCase();
  const visible = hasFilter && needle
    ? options.filter(o => (o.filterText ?? '').toLowerCase().includes(needle))
    : options;
  const enabled = visible.filter(o => !o.disabled);
  const highlighted = enabled.find(o => o.key === activeKey) ?? enabled.find(o => o.selected) ?? enabled[0];
  const highlightedIndex = highlighted ? visible.indexOf(highlighted) : -1;
  const highlightedId = highlightedIndex >= 0 ? `${listId}-${highlightedIndex}` : undefined;

  function openMenu() {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const firstEnabled = options.filter(o => !o.disabled);
    setPosition({ left: rect.left + window.scrollX, top: rect.bottom + window.scrollY + 4 });
    setFilter('');
    setActiveKey((firstEnabled.find(o => o.selected) ?? firstEnabled[0])?.key ?? null);
    setOpen(true);
    onOpenChange?.(true);
  }

  function pick(key: string) {
    close(true);
    onSelect(key);
  }

  // Focus moves into the menu when it opens, and again when its content changes between "status" and "list"
  // (Retry shows "Loading…" and then the list).
  useEffect(() => {
    if (open) {
      (filterRef.current ?? listRef.current ?? menuRef.current)?.focus();
    }
  }, [open, hasFilter, hasStatus]);

  // Outside clicks and a resized window close the menu (the stored position would be stale).
  useEffect(() => {
    if (!open) {
      return;
    }
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      // Clicks on the button are left to its own click handler, which toggles.
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        close(false);
      }
    }
    function handleResize() {
      close(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [open, close]);

  useEffect(() => {
    if (open && highlightedId) {
      document.getElementById(highlightedId)?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, highlightedId]);

  // Keeps the menu inside the window. It writes the DOM directly, not state.
  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!open || !menu) {
      return;
    }
    const overflow = menu.getBoundingClientRect().right - (window.innerWidth - 8);
    if (overflow > 0) {
      menu.style.left = `${Math.max(8, position.left - overflow)}px`;
    }
  }, [open, position]);

  function move(direction: 1 | -1) {
    if (enabled.length === 0) {
      return;
    }
    const index = highlighted ? enabled.indexOf(highlighted) : -1;
    const next = index === -1
      ? (direction === 1 ? 0 : enabled.length - 1)
      : (index + direction + enabled.length) % enabled.length;
    setActiveKey(enabled[next].key);
  }

  function handleMenuKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const fromInput = e.target === filterRef.current;
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close(true);
        break;
      case 'ArrowDown':
        e.preventDefault();
        move(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        move(-1);
        break;
      case 'Home':
      case 'End':
        if (!fromInput && enabled.length > 0) {
          e.preventDefault();
          setActiveKey(enabled[e.key === 'Home' ? 0 : enabled.length - 1].key);
        }
        break;
      case 'Enter': {
        // A footer or Retry button handles its own Enter.
        if ((e.target as HTMLElement).closest('button')) {
          break;
        }
        const choice = highlighted ?? (enabled.length === 1 ? enabled[0] : undefined);
        if (choice) {
          e.preventDefault();
          pick(choice.key);
        }
        break;
      }
      case ' ':
        if (e.target === listRef.current && highlighted) {
          e.preventDefault();
          pick(highlighted.key);
        }
        break;
    }
  }

  return (
    <>
      <span className="flex" title={title}>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => (open ? close(true) : openMenu())}
          onKeyDown={e => {
            if (e.key === 'ArrowDown' && !open) {
              e.preventDefault();
              openMenu();
            }
          }}
          className={`flex h-7 items-center gap-1.5 rounded-[3px] border px-2 cursor-pointer hover:bg-hover disabled:cursor-not-allowed disabled:border-line-subtle disabled:text-fg-faint disabled:hover:bg-transparent ${
            open ? 'border-accent bg-selected text-on-selected' : 'border-line text-fg'
          }`}
        >
          <span className="sr-only">{ariaLabel}: </span>
          {label}
          <LuChevronDown size={12} className="opacity-70" aria-hidden="true" />
        </button>
      </span>
      {open && createPortal(
        <div
          ref={menuRef}
          tabIndex={-1}
          className="absolute z-40 rounded border border-line bg-canvas py-1 shadow-lg outline-none"
          style={{ left: position.left, top: position.top, minWidth }}
          onKeyDown={handleMenuKeyDown}
          // Clicking inside keeps the focus where it is. Otherwise a click on an option would blur the list and
          // close the menu before the click arrives. The filter box needs the click to place its caret.
          onMouseDown={e => {
            if (e.target !== filterRef.current) {
              e.preventDefault();
            }
          }}
          onBlur={e => {
            // A null relatedTarget is a click, which the document mousedown listener already handles.
            const next = e.relatedTarget as Node | null;
            if (next && !menuRef.current?.contains(next) && !triggerRef.current?.contains(next)) {
              close(false);
            }
          }}
        >
          <div className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-fg-muted">{heading}</div>
          {hasStatus ? (
            <div className="px-3 py-1.5">{status}</div>
          ) : (
            <>
              {hasFilter && (
                <label className="mx-2 mb-1.5 mt-1 flex h-7 items-center gap-1.5 rounded-[3px] border border-line bg-surface px-2 focus-within:border-accent">
                  <LuSearch size={13} className="text-fg-faint" aria-hidden="true" />
                  <span className="sr-only">Filter</span>
                  <input
                    ref={filterRef}
                    type="text"
                    role="combobox"
                    aria-expanded="true"
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={highlightedId}
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    placeholder={filterPlaceholder}
                    className="min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-fg-faint"
                  />
                </label>
              )}
              <ul
                ref={listRef}
                id={listId}
                role="listbox"
                aria-label={ariaLabel}
                aria-activedescendant={hasFilter ? undefined : highlightedId}
                tabIndex={hasFilter ? -1 : 0}
                className="max-h-72 overflow-y-auto outline-none"
              >
                {visible.map((o, index) => {
                  const isHighlighted = o === highlighted;
                  const stateClass = o.disabled
                    ? 'cursor-default text-fg-muted'
                    : o.selected
                      ? `cursor-pointer bg-selected text-on-selected${isHighlighted ? ' ring-1 ring-inset ring-accent' : ''}`
                      : `cursor-pointer${isHighlighted ? ' bg-hover' : ''}`;
                  return (
                    <li
                      key={o.key}
                      id={`${listId}-${index}`}
                      role="option"
                      aria-selected={!!o.selected}
                      aria-disabled={o.disabled || undefined}
                      className={`flex items-center gap-2 px-3 py-1.5 ${stateClass}`}
                      onMouseEnter={() => { if (!o.disabled) setActiveKey(o.key); }}
                      onClick={() => { if (!o.disabled) pick(o.key); }}
                    >
                      <span className="min-w-0 flex-1">{o.content}</span>
                      {o.selected && <LuCheck size={14} aria-hidden="true" />}
                    </li>
                  );
                })}
                {visible.length === 0 && filter.trim() && (
                  <li role="presentation" className="px-3 py-1.5 text-xs text-fg-muted">No match for "{filter}".</li>
                )}
              </ul>
            </>
          )}
          {footer && (
            <>
              <div className="my-1 h-px bg-line-subtle" />
              {footer(() => close(true))}
            </>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}
