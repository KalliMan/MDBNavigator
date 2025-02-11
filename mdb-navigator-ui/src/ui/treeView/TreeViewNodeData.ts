import { JSX } from "react";

export interface TreeViewNodeData {
  id: string;
  nodeName: string;
  isExpanded?: boolean;

  Icon?: JSX.Element;
  IconExpanded?: JSX.Element;
  type?: string;
  metaData?: string;

  nodes?: TreeViewNodeData[];
  parentNode?: TreeViewNodeData;
}
