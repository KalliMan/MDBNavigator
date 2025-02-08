import { ServerType } from "../../types/serverTypeOptions";

export interface ConnectionSettings {
  serverType: ServerType;
  serverName: string;
  port: number;
  userName: string;
  password: string;
}
