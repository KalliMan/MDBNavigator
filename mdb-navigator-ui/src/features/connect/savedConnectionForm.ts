import { ConnectedResult } from '../../models/connect/connectedResult';
import { ConnectionBase } from '../../models/connect/connectionBase';
import { ConnectionSettings } from '../../models/connect/connectionSettings';
import { SavedConnection, SavedConnectionInput } from '../../models/connect/savedConnection';
import { SAVED_CONNECTION_NAME_MAX_LENGTH, SAVED_CONNECTIONS_MAX } from '../../models/connect/savedConnectionLimits';
import { ServerType } from '../../types/serverTypeOptions';
import { ConnectionDisplay } from '../../contexts/databaseServerConnect/DatabaseServerConnectActionTypes';

// What the dialog edits. Same fields as a saved connection plus the password; port as typed.
export interface ConnectForm {
  name: string;
  serverType: ServerType;
  serverName: string;
  port: number;
  databaseName: string;
  userName: string;
  password: string;
  color: string | null;
  // "Remember password": applies only when the connection is saved.
  rememberPassword: boolean;
}

// "New connection": dev defaults from .env.development.local, as today, and empty name, database and color.
export function newConnectForm(): ConnectForm {
  return {
    name: '',
    serverType: ServerType.PostgreSQL,
    // Dev-only defaults from .env.development.local; production builds always start empty.
    serverName: import.meta.env.DEV ? import.meta.env.VITE_DEV_DB_SERVER ?? '' : '',
    port: import.meta.env.DEV && import.meta.env.VITE_DEV_DB_PORT ? Number(import.meta.env.VITE_DEV_DB_PORT) : 5432,
    databaseName: '',
    userName: import.meta.env.DEV ? import.meta.env.VITE_DEV_DB_USER ?? '' : '',
    password: import.meta.env.DEV ? import.meta.env.VITE_DEV_DB_PASSWORD ?? '' : '',
    color: null,
    rememberPassword: false,
  };
}

// A saved entry in the form; password empty (typed each time, or the remembered one is used by id).
export function formFromSaved(saved: SavedConnection): ConnectForm {
  return {
    name: saved.name,
    serverType: saved.serverType,
    serverName: saved.serverName,
    port: saved.port,
    databaseName: saved.databaseName ?? '',
    userName: saved.userName,
    password: '',
    color: saved.color,
    rememberPassword: saved.hasPassword,
  };
}

// The reconnect dialog: everything from the open connection, password empty.
export function formFromConnected(connected: ConnectedResult): ConnectForm {
  return {
    name: '',
    serverType: connected.serverType,
    serverName: connected.serverName,
    port: connected.port ?? 5432,
    databaseName: connected.databaseName ?? '',
    userName: connected.userName,
    password: '',
    color: null,
    rememberPassword: false,
  };
}

const emptyToNull = (value: string): string | null => value.trim() || null;

// What the connection is called unless the user types another name: the same server:port the API calls it.
// Empty while there is no server name yet.
export function defaultName(form: ConnectForm): string {
  const server = form.serverName.trim();
  return server ? `${server}:${form.port}` : '';
}

// The form with its name set to the default: the dialog pre-fills the Name field with it, so the user can edit it.
export function withDefaultName(form: ConnectForm): ConnectForm {
  return { ...form, name: defaultName(form) };
}

// The name in the field, or the default when the user cleared it.
function effectiveName(form: ConnectForm): string {
  return form.name.trim() || defaultName(form);
}

// Mirrors RememberedPassword.SameTarget on the server: a remembered password is used, and kept, only for the server
// and user it was typed for. Host names ignore case; user names don't (PostgreSQL's are case-sensitive).
export function sameTarget(form: ConnectForm, target: ConnectionBase): boolean {
  return form.serverType === target.serverType
    && form.serverName.trim().toLowerCase() === target.serverName.trim().toLowerCase()
    && form.port === (target.port ?? 5432)
    && form.userName.trim() === target.userName.trim();
}

// The saved connection whose remembered password a connect with an empty password field would use, or null when the
// password must be typed. Reconnect: the id the open connection came with. Connect: the selected entry, if it has one.
export function rememberedPasswordId(form: ConnectForm, selected: SavedConnection | null, reconnecting: ConnectedResult | null): string | null {
  if (reconnecting) {
    return reconnecting.savedConnectionId && sameTarget(form, reconnecting) ? reconnecting.savedConnectionId : null;
  }
  return selected?.hasPassword && sameTarget(form, selected) ? selected.id : null;
}

// What connect/reconnect send: databaseName trimmed, empty -> null; serverName and userName as typed (the server
// trims nothing today; keep it so).
// rememberedId: from rememberedPasswordId; sent only when the password field is empty.
export function toConnectionSettings(form: ConnectForm, rememberedId: string | null): ConnectionSettings {
  return {
    serverType: form.serverType,
    serverName: form.serverName,
    port: form.port,
    userName: form.userName,
    password: form.password,
    databaseName: emptyToNull(form.databaseName),
    // A typed password always wins.
    savedConnectionId: form.password ? null : rememberedId,
  };
}

// What POST/PUT send: name, serverName, userName and databaseName trimmed; empty database -> null.
// remember: the "Remember password" box applies (it is ticked and the connection is being saved).
// Built field by field, never by spreading the form: the password goes only into a request that remembers it.
export function toSavedInput(form: ConnectForm, remember: boolean): SavedConnectionInput {
  return {
    name: effectiveName(form),
    serverType: form.serverType,
    serverName: form.serverName.trim(),
    port: form.port,
    databaseName: emptyToNull(form.databaseName),
    userName: form.userName.trim(),
    color: form.color,
    rememberPassword: remember,
    password: remember && form.password ? form.password : null,
  };
}

export function toDisplay(form: ConnectForm): ConnectionDisplay {
  return { name: effectiveName(form), color: form.color };
}

// What is wrong with the form, by field, so the dialog can show each message next to its field. Empty: fine.
// `save` is a problem with saving that no field owns (a full list). The name is checked only when saving.
export type FormErrors = Partial<Record<'name' | 'serverName' | 'port' | 'userName' | 'password' | 'save', string>>;

// selectedId: the entry being changed (it may keep its own name), null for a new one.
// passwordOptional: a remembered password will be used when the field is left empty (see rememberedPasswordId).
// The name, port and list messages are the server's own, so the user sees one wording.
export function formErrors(form: ConnectForm, saved: SavedConnection[], selectedId: string | null, saving: boolean,
  passwordOptional: boolean): FormErrors {
  const errors: FormErrors = {};

  if (!form.serverName.trim()) {
    errors.serverName = 'Server name is required.';
  }
  if (!Number.isInteger(form.port) || form.port < 1 || form.port > 65535) {
    errors.port = 'Port must be between 1 and 65535.';
  }
  if (!form.userName.trim()) {
    errors.userName = 'User name is required.';
  }
  if (!form.password && !passwordOptional) {
    errors.password = 'Password is required.';
  }

  if (saving) {
    // A saved entry has its own name: there is no default to fall back on, so it can't be saved without one.
    if (selectedId !== null && !form.name.trim()) {
      errors.name = 'Name is required.';
    }
    const name = effectiveName(form);
    if (!errors.name && name.length > SAVED_CONNECTION_NAME_MAX_LENGTH) {
      errors.name = `Name must be at most ${SAVED_CONNECTION_NAME_MAX_LENGTH} characters.`;
    } else if (!errors.name && saved.some(s => s.id !== selectedId && s.name.trim().toUpperCase() === name.toUpperCase())) {
      errors.name = `A saved connection named "${name}" already exists.`;
    }
    if (selectedId === null && saved.length >= SAVED_CONNECTIONS_MAX) {
      errors.save = `You can save up to ${SAVED_CONNECTIONS_MAX} connections. Delete one first.`;
    }
  }
  return errors;
}
