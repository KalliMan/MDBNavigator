import { useTreeViewContext } from "./TreeViewContextProvider";
import TreeViewIExpandedIcon from "./TreeViewIExpandedIcon";
import { NodeDataActionTypes } from "./TreeViewNodeActionTypes";
import { NodeData } from "./TreeViewNodeData";

export interface Props {
  node: NodeData;
}

export function TreeViewNode({node}: Props) {
  const {dispatch} = useTreeViewContext();

  function handleSetIsExpanded() {
    dispatch({
      type: NodeDataActionTypes.EXPAND_NODE,
      payload: {
        id: node.id,
        expand: !node.isExpanded
      }
    })
  }

  const hasChildNodes = node.nodes && node.nodes?.length > 0;

  return (
    <>
      <div className="flex">
        {hasChildNodes && <TreeViewIExpandedIcon isExpanded={node.isExpanded} onExpand={handleSetIsExpanded}/>}
        <p
          className="select-none hover:bg-sky-200 w-fit pl-2 pr-3"
        >
          {node.nodeName}
        </p>
      </div>

      <div
        className={`${
          node.isExpanded ? "opacity-100" : "opacity-0"
        } transition-opacity ease-in-out delay-150 duration-150`}
      >
        <ul className="ml-5">
          {node.nodes?.map((childNode) => (
            <li className="" key={childNode.id}>
              <TreeViewNode node={childNode}  />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
