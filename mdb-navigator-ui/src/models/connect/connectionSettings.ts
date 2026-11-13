import { ConnectionBase } from "./connectionBase";

export interface ConnectionSettings extends ConnectionBase {
  password: string;
  // With an empty password: the server uses this saved connection's remembered password.
  savedConnectionId?: string | null;
}
