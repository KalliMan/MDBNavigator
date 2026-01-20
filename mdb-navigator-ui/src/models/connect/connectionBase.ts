import { ServerType } from "../../types/serverTypeOptions";

export interface ConnectionBase {
  serverType: ServerType;
  serverName: string | null;
  port?: number;
  userName: string;
}
