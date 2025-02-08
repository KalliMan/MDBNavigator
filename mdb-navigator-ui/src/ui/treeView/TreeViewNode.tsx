import { CoordPosition } from "../../types/coordPosition";
import { useTreeViewContext } from "./TreeViewContextProvider";
import TreeViewIExpandedIcon from "./TreeViewIExpandedIcon";
import { NodeDataActionTypes } from "./TreeViewNodeActionTypes";
import { TreeViewNodeData } from "./TreeViewNodeData";

export interface Props {
  node: TreeViewNodeData;
  onNodeClick: (node: TreeViewNodeData, target: CoordPosition) => void;
  onExpand: (id: string, expanded: boolean) => void;
}

export function TreeViewNode({node, onNodeClick, onExpand}: Props) {
  const {dispatch} = useTreeViewContext();

  function handleOnClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    onNodeClick(node, {
      x: e.pageX,
      y: e.pageY
    });
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
    <>
    <ul className="ml-5">
        <div
          className={`flex hover:bg-sky-200 ${node.isExpanded ? 'z-auto' : 'z-0'}`}>
          {hasChildNodes && <TreeViewIExpandedIcon
            isExpanded={node.isExpanded}
            onExpand={handleSetIsExpanded}
          />}
          <div
            className="flex select-none w-fit pl-2 pr-3"
          >
            <div className="mt-1">
              {iconExpanded ?? (<span >{iconExpanded}</span>)}
            </div>

            <span className="ml-1" onClick={handleOnClick}>{node.nodeName}</span>
          </div>
        </div>

      <div
        className={`${
          node.isExpanded ? "opacity-100 " : "opacity-0 max-h-0"
        } transition-all ease-in-out delay-150 duration-150`}
      >

          {node.nodes?.map((childNode) => (
            <li className="" key={childNode.id}>
              <TreeViewNode node={childNode}
                onNodeClick={onNodeClick}
                onExpand={(id, expanded) => onExpand(id, expanded)} />
            </li>
          ))}
      </div>
      </ul>
    </>
  );
}
