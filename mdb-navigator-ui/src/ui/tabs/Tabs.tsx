import { useEffect, useState } from 'react';
import Tab from './Tab';
import { HiXMark } from 'react-icons/hi2';

interface Props {
  activeId: string | null;
  onClose?: (id: string) => void;
}

export default function Tabs({ activeId, onClose, children }: React.PropsWithChildren<Props>) {

  const childrenProps = Array.isArray(children) ? children : [children];
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

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, newActiveTab: string) => {
    e.preventDefault();
    setActiveTab(newActiveTab);
  };

  if (!children) {
    return null;
  }

  return (
    <div className="h-screen">
      <div className="flex h-[5%] w-fit border-b border-gray-300">
        {childrenProps.map(child => (
          <div
            className={`${
              activeTab === child.props.id
                ? 'flex border-b-2 border-purple-500'
                : ''
            } flex text-gray-700 font-medium py-2 w-fit pr-10 pl-10`}
            key={child.props.id}
          >
            <button onClick={e => handleClick(e, child.props.id)}>
              {child.props.label}
            </button>
            <button className="m-1 transition-all duration-200 hover:border-2 h-5"
              onClick={() => onClose?.(child.props.id)}>
              <HiXMark />
            </button>
          </div>
        ))}
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
