export interface TreeViewSettings {
  allowKeepSelectedNode: boolean;
  // False: the root node itself is not shown, its children are the top level.
  showRoot: boolean;
}

export const DefaultTreeViewSettings: TreeViewSettings = {
  allowKeepSelectedNode: true,
  showRoot: true,
};
