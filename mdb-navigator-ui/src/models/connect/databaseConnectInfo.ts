import { ServerType } from "../../types/serverTypeOptions";

export interface DatabaseConnectionInfo {
  serverType: ServerType;
  dataSource: string;
  serverVersion: string;
  userName: string;
}
