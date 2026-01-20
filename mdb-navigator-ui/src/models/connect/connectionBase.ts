import { ServerType } from "../../types/serverTypeOptions";

export interface ConnectionBase {
  serverType: ServerType;
  serverName: string;
  port?: number;
  userName: string;
}
