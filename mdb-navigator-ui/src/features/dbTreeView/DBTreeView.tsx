import TreeView from "../../ui/treeView/TreeView"
import { NodeData } from "../../ui/treeView/TreeViewNodeData"

const root: NodeData = {
  id: '1',
  nodeName: "KalliMan's Server",
  isExpanded: true,
  nodes: [{
    id: '11',
    nodeName: 'Databases',
    isExpanded: true,
    nodes: [{
      id: '111',
      nodeName: 'BookStoreDB',
      nodes: [{
          id: '1111',
          nodeName: 'Tables',
          nodes: [{
            id:'table1',
            nodeName: 'AspNetUserClaims',
          },
          {
            id:'table2',
            nodeName: 'AspNetUserLogins',
          }]
      }]
    }]
  }]
}

function DBTreeView() {
  return (
    <TreeView root={root} />
  )
}

export default DBTreeView
