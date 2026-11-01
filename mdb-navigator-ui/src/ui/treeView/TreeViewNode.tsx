import { CoordPosition } from "../../types/coordPosition";
import { useTreeViewContext } from "./useTreeViewContext";
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

  function handleOnClick(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) {
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
  const icon = node.isExpanded ? iconExpanded : node.Icon;

  return (
    <li>
      <div
        className={`flex h-6 items-center gap-1 pr-3 ${node.isSelected ? 'bg-selected text-on-selected' : 'hover:bg-hover'} ${node.className ?? ''}`}
      >
        {hasChildNodes ? (
          <TreeViewIExpandedIcon
            isExpanded={node.isExpanded}
            onExpand={handleSetIsExpanded}
          />
        ) : (
          // Same width as the chevron, so leaves line up with their siblings.
          <span className="w-4 flex-none" aria-hidden="true" />
        )}
        <span className={`flex flex-none items-center ${node.isSelected ? '' : 'text-fg-muted'}`}>
          {icon}
        </span>
        <span className="ml-1 whitespace-nowrap select-none" onClick={handleOnClick}>
          {node.nodeTextElement ?? node.nodeText ?? node.nodeName}
        </span>
      </div>

      <div
        className={`overflow-hidden ${
          node.isExpanded ? "opacity-100 " : "opacity-0 max-h-0 h-0 pointer-events-none"
        } transition-all ease-in-out delay-150 duration-150`}
      >
        {hasChildNodes && (
          <ul className="pl-4">
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
