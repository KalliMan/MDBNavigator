import { CoordPosition } from "../../types/coordPosition";
import { useTreeViewContext } from "./TreeViewContextProvider";
import TreeViewIExpandedIcon from "./TreeViewIExpandedIcon";
import { NodeDataActionTypes } from "./TreeViewNodeActionTypes";
import { TreeViewNodeData } from "./TreeViewNodeData";
import { TreeViewSettings } from "./TreeViewSettings";

export interface Props {
  node: TreeViewNodeData;
  settings: TreeViewSettings;

  onNodeClick: (node: TreeViewNodeData, target: CoordPosition) => void;
  onExpand: (id: string, expanded: boolean) => void;
}

export function TreeViewNode({node, settings, onNodeClick, onExpand}: Props) {
  const {dispatch} = useTreeViewContext();

  function handleOnClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    e.preventDefault();
    onNodeClick(node, {
      x: e.pageX,
      y: e.pageY
    });

    if (settings.allowKeepSelectedNode) {
      dispatch({
        type: NodeDataActionTypes.SELECT_NODE,
        payload: {
          id: node.id,
          selected: true
        }
      });
    }
  }

  function handleSetIsExpanded() {
    onExpand(node.id, !node.isExpanded);

    dispatch({
      type: NodeDataActionTypes.EXPAND_NODE,
      payload: {
        id: node.id,
        expand: !node.isExpanded
      }
    })
  }

  const hasChildNodes = node.nodes && node.nodes?.length > 0;
  const iconExpanded = node.IconExpanded ?? node.Icon;

  return (
    <li>
      <div
        className={`flex hover:bg-sky-200 ${node.className ?? ''} ${node.isSelected ? 'bg-sky-300' : ''}`}
      >
        {hasChildNodes && (
          <TreeViewIExpandedIcon
            isExpanded={node.isExpanded}
            onExpand={handleSetIsExpanded}
          />
        )}
        <div className="flex select-none w-fit pl-2 pr-3">
          <div className="mt-1">
            {iconExpanded ?? (<span>{iconExpanded}</span>)}
          </div>

          <span className="ml-1" onClick={handleOnClick}>{node.nodeText || node.nodeName}</span>
        </div>
      </div>

      <div
        className={`${
          node.isExpanded ? "opacity-100 " : "opacity-0 max-h-0 h-0 pointer-events-none"
        } transition-all ease-in-out delay-150 duration-150`}
      >
        {hasChildNodes && (
          <ul className="ml-5">
            {node.nodes?.map((childNode) => (
              <TreeViewNode
                key={childNode.id}
                node={childNode}
                settings={settings}
                onNodeClick={onNodeClick}
                onExpand={onExpand}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}
