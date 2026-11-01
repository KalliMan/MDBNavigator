import { ConnectionBase } from "../models/connect/connectionBase";

// Each connection gets a color for its tree node, query tabs and query bar, so it is clear where a query runs.
// (Saved connections will let the user choose; this stays the fallback.)
const CONNECTION_COLORS = ['#16a34a', '#ea580c', '#7c3aed', '#0284c7', '#db2777', '#ca8a04'];

export const UNKNOWN_CONNECTION_COLOR = '#8b929c';

// Picked once, when the connection is made (the connect reducer keeps it). The preferred color comes from the
// server's address, so a server keeps its color across reconnects and reloads. When an open connection already
// has that color (the same server twice, or a hash clash), the next free one is used so they can be told apart.
// Only with more open connections than colors do two share one.
export function pickConnectionColor(connection: ConnectionBase, usedColors: string[]): string {
  const key = `${connection.serverName}:${connection.port ?? ''}:${connection.userName}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  const preferred = hash % CONNECTION_COLORS.length;
  for (let i = 0; i < CONNECTION_COLORS.length; i++) {
    const color = CONNECTION_COLORS[(preferred + i) % CONNECTION_COLORS.length];
    if (!usedColors.includes(color)) {
      return color;
    }
  }
  return CONNECTION_COLORS[preferred];
}

// user@host:port, as shown in the query bar.
export function connectionAddress(connection: ConnectionBase): string {
  return `${connection.userName}@${connection.serverName}${connection.port ? `:${connection.port}` : ''}`;
}
