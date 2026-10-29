import axios, { AxiosError, AxiosResponse } from 'axios'
import LocalSessionStorage from '../utils/localSessionStorage';
import { ConnectionSettings } from '../models/connect/connectionSettings';
import { TablesDetails } from '../models/schema/table/tablesDetails';
import { DatabasesDetails } from '../models/schema/database/databasesDetails';
import { ExecuteQueryRequest } from '../models/databaseCommand/query/executeQueryRequest';
import { toast } from 'react-toastify';
import { getResponseErrorMessage } from '../utils/errorMessage';
import { ProceduresDetails } from '../models/schema/procedure/proceduresDetails';
import { ConnectedResult } from '../models/connect/connectedResult';
import { ViewDetails } from '../models/schema/view/viewsDetails';
import { TableDefinitionDetails } from '../models/schema/table/tableDefinitionDetails';

axios.defaults.baseURL = import.meta.env.VITE_API_URL;
// Regular API calls are short (queries stream via SignalR after a 202), so a hanging request is an error.
axios.defaults.timeout = 60_000;

axios.interceptors.request.use((config) => {
  if (config.headers) {
    config.headers.set('id', LocalSessionStorage.getTabId());
  }

  return config;
});

// Set by the auth context: a 401 means the session ended, and the app shows the sign-in page.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

axios.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT) {
      toast.error("The server did not respond in time.");
      return Promise.reject(error);
    }
    if (!error.response) {
      toast.error("Network error - cannot connect to the server!");
      return Promise.reject(error);
    }

    const { data, status } = error.response;
    switch (status) {
      case 401:
        // No toast: the sign-in page explains it.
        onUnauthorized?.();
        break;
      case 403:
        toast.error("Forbidden!");
        break;
      default:
        // 400, 404, 409, 5xx ...: the server's explanation, or a status-based fallback.
        toast.error(getResponseErrorMessage(data, status));
        break;
    }

    return Promise.reject(error);
  }
);

const responseBody = <T,>(resp: AxiosResponse<T>): T => resp.data;

// Object names (database, schema, table...) travel as query parameters, which axios encodes, so names with
// characters like '/', '?' or '#' can't break the URL.
type QueryParams = Record<string, string | number>;

const requests = {
  get: <T> (url: string, params?: QueryParams) => axios.get<T>(url, { params }).then(responseBody),
  post: <T> (url: string, body: object) => axios.post<T>(url, body).then(responseBody)
};

const id = (connectionId: string) => encodeURIComponent(connectionId);

const databaseConnectionApi = {
  connect: (connectionSettings: ConnectionSettings): Promise<ConnectedResult> =>
    requests.post<ConnectedResult>('/databaseConnection/connect', connectionSettings),
  reconnect: (connectionId: string, reconnectionSettings: ConnectionSettings): Promise<ConnectedResult> =>
    requests.post<ConnectedResult>(`/databaseConnection/reconnect/${connectionId}`, reconnectionSettings),
  disconnect: (connectionId: string): Promise<void> =>
    requests.post<void>(`/databaseConnection/disconnect/${connectionId}`, { }),
}

const databaseSchemaApi = {
  fetchDatabases: (connectionId: string): Promise<DatabasesDetails> =>
    requests.get<DatabasesDetails>(`/databaseSchema/databases/${id(connectionId)}`),

  fetchTables: (connectionId: string, database: string): Promise<TablesDetails> =>
    requests.get<TablesDetails>(`/databaseSchema/tables/${id(connectionId)}`, { database }),
  tableDefinition: (connectionId: string, database: string, schema: string, table: string): Promise<TableDefinitionDetails> =>
    requests.get<TableDefinitionDetails>(`/databaseSchema/tableDefinition/${id(connectionId)}`, { database, schema, table }),

  fetchStoredProcedures: (connectionId: string, database: string): Promise<ProceduresDetails> =>
    requests.get<ProceduresDetails>(`/databaseSchema/storedProcedures/${id(connectionId)}`, { database }),
  fetchFunctions: (connectionId: string, database: string): Promise<ProceduresDetails> =>
    requests.get<ProceduresDetails>(`/databaseSchema/functions/${id(connectionId)}`, { database }),
  fetchViews: (connectionId: string, database: string): Promise<ViewDetails> =>
    requests.get<ViewDetails>(`/databaseSchema/views/${id(connectionId)}`, { database }),
};

const databaseCommandApi = {
  execute: (request: ExecuteQueryRequest): Promise<{ id: string }> =>
    requests.post<{ id: string }>('/databaseCommand', request),
  cancel: (executionId: string): Promise<void> =>
    requests.post<void>(`/databaseCommand/cancel/${encodeURIComponent(executionId)}`, {}),

  getProcedureDefinition: (connectionId: string, database: string, schema: string, name: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/procedureDefinition/${id(connectionId)}`, { database, schema, name }),
  getCreateStoredProcedureScript: (connectionId: string, database: string, schema: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/createStoredProcedureScript/${id(connectionId)}`, { database, schema }),
  getCreateFunctionScript: (connectionId: string, database: string, schema: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/createFunctionScript/${id(connectionId)}`, { database, schema }),
  getDropProcedureScript: (connectionId: string, database: string, schema: string, name: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/dropProcedureScript/${id(connectionId)}`, { database, schema, name }),

  getViewDefinition: (connectionId: string, database: string, schema: string, name: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/viewDefinition/${id(connectionId)}`, { database, schema, name }),
  getCreateViewScript: (connectionId: string, database: string, schema: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/createViewScript/${id(connectionId)}`, { database, schema }),
  getDropViewScript: (connectionId: string, database: string, schema: string, name: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/dropViewScript/${id(connectionId)}`, { database, schema, name }),

  getTopNTableRecordsScript: (connectionId: string, database: string, schema: string, table: string, recordsNumber: number): Promise<string> =>
    requests.get<string>(`/databaseCommand/tableRecordsScript/${id(connectionId)}`, { database, schema, table, recordsNumber }),

  getCreateNewTableScript: (connectionId: string, database: string, schema: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/createNewTableScript/${id(connectionId)}`, { database, schema }),
  getCreateTableScript: (connectionId: string, database: string, schema: string, table: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/createTableScript/${id(connectionId)}`, { database, schema, table }),
  getDropTableScript: (connectionId: string, database: string, schema: string, table: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/dropTableScript/${id(connectionId)}`, { database, schema, table }),
  getInsertTableScript: (connectionId: string, database: string, schema: string, table: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/insertTableScript/${id(connectionId)}`, { database, schema, table }),
}

const agent = {
  databaseConnectionApi,
  databaseSchemaApi,
  databaseCommandApi
};

export default agent;

