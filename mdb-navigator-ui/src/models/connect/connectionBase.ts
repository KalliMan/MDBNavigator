import { ServerType } from "../../types/serverTypeOptions";

export interface ConnectionBase {
  serverType: ServerType;
  serverName: string;
  port?: number;
  userName: string;
  // The database opened when a request names none; null: the server's default.
  databaseName?: string | null;
}
