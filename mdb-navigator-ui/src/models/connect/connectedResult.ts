import { ConnectionBase } from "./connectionBase";

export interface ConnectedResult extends ConnectionBase {
  connectionId: string;
  connectionName: string;
}