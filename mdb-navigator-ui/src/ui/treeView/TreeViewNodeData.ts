export interface NodeData {
  id: string;
  nodeName: string;
  isExpanded?: boolean;

  nodes?: NodeData[];
}
