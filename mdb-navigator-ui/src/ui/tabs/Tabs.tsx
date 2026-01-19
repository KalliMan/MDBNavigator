import { useEffect, useRef, useState } from 'react';
import Tab from './Tab';
import { HiXMark } from 'react-icons/hi2';

interface Props {
  activeId: string | null;
  onClose?: (id: string) => void;
  onSetActiveTab?: (id: string) => void;
}

export default function Tabs({ activeId, onClose, onSetActiveTab, children }: React.PropsWithChildren<Props>) {

  const childrenProps = Array.isArray(children) ? children : [children];
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState(() => {
    if (!children) {
      return '';
    }
    if (!childrenProps?.length) {
      return;
    }

    if (activeId) {
      return activeId;
    }

    return childrenProps[0].props.id;
  });

  useEffect(() => {
    if (activeId) {
      setActiveTab(activeId);
    }
  }, [activeId]);

  useEffect(() => {
    if (!activeTab || !scrollContainerRef.current) return;

    const activeElement = scrollContainerRef.current.querySelector(
      `[data-tab-id="${activeTab}"]`
    ) as HTMLElement | null;

    activeElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activeTab]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, newActiveTab: string) => {
    e.preventDefault();
    setActiveTab(newActiveTab);
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
    <div className="h-screen">
      <div className="flex h-[5%] w-full border-b border-gray-300 items-center">
        <button
          type="button"
          className="px-2 text-gray-500 hover:text-gray-800 disabled:opacity-40"
          onClick={() => scrollTabs('left')}
        >
          &#8249;
        </button>
        <div
          ref={scrollContainerRef}
          className="flex flex-1 overflow-x-auto scrollbar-thin"
        >
          {childrenProps.map(child => (
            <div
              className={`${
                activeTab === child.props.id
                  ? 'flex border-b-2 border-purple-500 py-1'
                  : 'py-1'
              } flex text-gray-700 font-medium w-fit pr-1 pl-2 flex-none`}
              key={child.props.id}
              data-tab-id={child.props.id}
            >
              <button
                className="cursor-pointer hover:bg-gray-200 pl-2 pr-2 rounded-t-md"
                onClick={e => handleClick(e, child.props.id)}
              >
                {child.props.label}
              </button>
              <button
                className="m-1 transition-all duration-100 hover:border-1 h-5"
                onClick={() => onClose?.(child.props.id)}
              >
                <HiXMark />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="px-2 text-gray-500 hover:text-gray-800 disabled:opacity-40"
          onClick={() => scrollTabs('right')}
        >
          &#8250;
        </button>
      </div>
      <div className="py-2 h-[95%]">
        {childrenProps.map((child) => {
          if (child.props.id === activeTab) {
            return (
              <div className="h-full" key={child.props.id}>
                {child.props.children}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

Tabs.Tab = Tab;
