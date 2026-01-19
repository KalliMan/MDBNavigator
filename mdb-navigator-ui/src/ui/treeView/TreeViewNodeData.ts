import { JSX } from "react";

export interface TreeViewNodeData {
  id: string;
  nodeName: string;
  nodeText?: string;
  isExpanded?: boolean;

  isSelected?: boolean;

  Icon?: JSX.Element;
  IconExpanded?: JSX.Element;
  type?: string;
  metaData?: string;

  className?: string;

  nodes?: TreeViewNodeData[];
  parentNode?: TreeViewNodeData;
}
