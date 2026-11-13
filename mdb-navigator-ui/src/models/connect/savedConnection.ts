import { ServerType } from "../../types/serverTypeOptions";

// As the API returns it (GET/POST/PUT api/savedConnections). Never a password, only whether one is remembered.
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
  // The server remembers a password for it (encrypted; it never comes back to the browser).
  hasPassword: boolean;
}

// Body of POST and PUT.
export type SavedConnectionInput = Omit<SavedConnection, 'id' | 'hasPassword'> & {
  // false: no password is kept (PUT: a remembered one is forgotten).
  rememberPassword: boolean;
  // With rememberPassword: a new password to remember; null keeps the remembered one (PUT, same server and user).
  password: string | null;
};
