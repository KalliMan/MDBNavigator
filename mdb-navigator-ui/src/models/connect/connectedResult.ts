import { ConnectionBase } from "./connectionBase";

export interface ConnectedResult extends ConnectionBase {
  connectionId: string;
  connectionName: string;
  // Set when it was opened with that saved connection's remembered password, so a reconnect can use it again.
  savedConnectionId?: string | null;
}