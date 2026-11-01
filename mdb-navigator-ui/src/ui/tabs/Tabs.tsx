import { Children, isValidElement, ReactElement, useEffect, useRef } from 'react';
import Tab, { TabProps } from './Tab';
import { LuChevronLeft, LuChevronRight, LuX } from 'react-icons/lu';

type TabElement = ReactElement<React.PropsWithChildren<TabProps>>;

interface Props {
  // Controlled: the parent owns which tab is active.
  activeId: string | null;
  onClose?: (id: string) => void;
  onSetActiveTab?: (id: string) => void;
}

export default function Tabs({ activeId, onClose, onSetActiveTab, children }: React.PropsWithChildren<Props>) {

  // Children are <Tabs.Tab> elements; their props (id, label, content) describe the tabs.
  const childrenProps = Children.toArray(children).filter(isValidElement) as TabElement[];
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeId || !scrollContainerRef.current) return;

    const activeElement = scrollContainerRef.current.querySelector(
      `[data-tab-id="${activeId}"]`
    );

    activeElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activeId]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, newActiveTab: string) => {
    e.preventDefault();
    onSetActiveTab?.(newActiveTab);
  };

  if (!children) {
    return null;
  }

  const scrollTabs = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 150;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    // Fills exactly the parent's height (no h-screen: that overflowed the app frame and caused a second scrollbar).
    <div className="h-full flex flex-col">
      <div className="flex h-10 w-full flex-none items-stretch border-b border-line bg-chrome">
        <button
          type="button"
          aria-label="Scroll tabs left"
          className="flex w-6 flex-none items-center justify-center text-fg-muted hover:text-fg cursor-pointer"
          onClick={() => scrollTabs('left')}
        >
          <LuChevronLeft size={14} aria-hidden="true" />
        </button>
        <div
          ref={scrollContainerRef}
          role="tablist"
          className="flex flex-1 overflow-x-auto scrollbar-thin"
        >
          {childrenProps.map(child => {
            const isActive = activeId === child.props.id;
            return (
              <div
                key={child.props.id}
                data-tab-id={child.props.id}
                className={`flex flex-none items-stretch border-r border-line ${isActive ? 'bg-canvas' : 'hover:bg-hover'}`}
                style={child.props.color ? { boxShadow: `inset 0 3px 0 ${child.props.color}` } : undefined}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  title={child.props.title}
                  className="flex flex-col justify-center gap-px pl-3 pr-1 text-left cursor-pointer"
                  onClick={e => handleClick(e, child.props.id)}
                >
                  <span className={`leading-4 ${isActive ? 'font-medium text-fg' : 'text-fg-muted'}`}>{child.props.label}</span>
                  {child.props.sublabel && (
                    <span className="text-xs leading-4 text-fg-muted">{child.props.sublabel}</span>
                  )}
                </button>
                <button
                  type="button"
                  aria-label={`Close ${child.props.label}`}
                  className="mr-1 flex size-5 self-center items-center justify-center rounded-[3px] text-fg-muted hover:bg-hover hover:text-fg cursor-pointer"
                  onClick={() => onClose?.(child.props.id)}
                >
                  <LuX size={12} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          aria-label="Scroll tabs right"
          className="flex w-6 flex-none items-center justify-center text-fg-muted hover:text-fg cursor-pointer"
          onClick={() => scrollTabs('right')}
        >
          <LuChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="flex-1 min-h-0">
        {/* All tabs stay mounted (inactive ones hidden), so editor text, results and scroll survive tab switches. */}
        {childrenProps.map((child) => (
          <div className={child.props.id === activeId ? 'h-full' : 'hidden'} key={child.props.id}>
            {child.props.children}
          </div>
        ))}
      </div>
    </div>
  );
}

Tabs.Tab = Tab;
