import { ServerType } from "../../types/serverTypeOptions";

// As the API returns it (GET/POST/PUT api/savedConnections). Never a password.
export interface SavedConnection {
  id: string;
  name: string;
  serverType: ServerType;
  serverName: string;
  port: number;
  databaseName: string | null;
  userName: string;
  // "#rrggbb", or null: the color comes from the server's address (pickConnectionColor).
  color: string | null;
}

// Body of POST and PUT.
export type SavedConnectionInput = Omit<SavedConnection, 'id'>;
