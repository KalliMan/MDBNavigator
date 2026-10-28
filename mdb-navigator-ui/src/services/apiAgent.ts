import axios, { AxiosError, AxiosResponse } from 'axios'
import LocalSessionStorage from '../utils/localSessionStorage';
import { ConnectionSettings } from '../models/connect/connectionSettings';
import { TablesDetails } from '../models/schema/table/tablesDetails';
import { DatabasesDetails } from '../models/schema/database/databasesDetails';
import { DatabaseSQLCommandQuery } from '../models/databaseCommand/query/databaseSQLCommandQuery';
import { toast } from 'react-toastify';
import { ProceduresDetails } from '../models/schema/procedure/proceduresDetails';
import { ConnectedResult } from '../models/connect/connectedResult';
import { ViewDetails } from '../models/schema/view/viewsDetails';
import { TableDefinitionDetails } from '../models/schema/table/tableDefinitionDetails';

axios.defaults.baseURL = import.meta.env.VITE_API_URL;
// Regular API calls are short (queries stream via SignalR after a 202), so a hanging request is an error.
axios.defaults.timeout = 60_000;

axios.interceptors.request.use((config) => {
  if (config.headers) {
    const id = LocalSessionStorage.getApplicationId();
    config.headers.set('id', id);
  }

  return config;
});

// The API answers with { message } (ExceptionMiddleware); ASP.NET itself may answer with ProblemDetails
// ({ title, detail, errors }) or plain text. Returns a readable message for any of these.
function getErrorMessage(data: unknown, status: number): string {
  if (typeof data === 'string' && data.trim()) {
    return data;
  }
  if (data && typeof data === 'object') {
    const body = data as { message?: string; detail?: string; title?: string; errors?: Record<string, string[] | string> };
    if (body.errors) {
      const messages = Object.values(body.errors).flat().filter(Boolean);
      if (messages.length > 0) {
        return messages.join('\n');
      }
    }
    if (body.message) return body.message;
    if (body.detail) return body.detail;
    if (body.title) return body.title;
  }
  return `Request failed (${status})`;
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
        toast.error("Unauthorised!");
        break;
      case 403:
        toast.error("Forbidden!");
        break;
      default:
        // 400, 404, 409, 5xx ...: the server's explanation, or a status-based fallback.
        toast.error(getErrorMessage(data, status));
        break;
    }

    return Promise.reject(error);
  }
);

const responseBody = (resp: AxiosResponse) => resp.data;

const requests = {
  get: <T> (url: string) => axios.get<T>(url).then(responseBody),
  post: <T> (url: string, body: object) => axios.post<T>(url, body).then(responseBody)
};

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
    requests.get<DatabasesDetails>(`/databaseSchema/databases/${connectionId}`),

  fetchTables: (connectionId: string, databaseName: string): Promise<TablesDetails> =>
    requests.get<TablesDetails>(`/databaseSchema/tables/${connectionId}/${databaseName}`),
  tableDefinition: (connectionId: string, databaseName: string, schema: string, table: string): Promise<TableDefinitionDetails> =>
    requests.get<TableDefinitionDetails>(`/databaseSchema/tableDefinition/${connectionId}/${databaseName}/${schema}/${table}`),

  fetchStoredProcedures: (connectionId: string, databaseName: string): Promise<ProceduresDetails> =>
    requests.get<ProceduresDetails>(`/databaseSchema/storedProcedures/${connectionId}/${databaseName}`),
  fetchFunctions: (connectionId: string, databaseName: string): Promise<ProceduresDetails> =>
    requests.get<ProceduresDetails>(`/databaseSchema/functions/${connectionId}/${databaseName}`),
  fetchViews: (connectionId: string, databaseName: string): Promise<ViewDetails> =>
    requests.get<ViewDetails>(`/databaseSchema/views/${connectionId}/${databaseName}`),
};

const databaseCommandApi = {
  execute: (cmdQuery: DatabaseSQLCommandQuery): Promise<{ id: string }> =>
    requests.post<{ id: string }>('/databaseCommand', cmdQuery),
  cancel: (commandId: string): Promise<void> =>
    requests.post<void>(`/databaseCommand/cancel/${commandId}`, {}),

  getProcedureDefinition: (connectionId: string, databaseName: string, schema: string, name: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/procedureDefinition/${connectionId}/${databaseName}/${schema}/${name}`),
  getCreateStoredProcedureScript: (connectionId: string, databaseName: string, schema: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/createStoredProcedureScript/${connectionId}/${databaseName}/${schema}`),
  getCreateFunctionScript: (connectionId: string, databaseName: string, schema: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/createFunctionScript/${connectionId}/${databaseName}/${schema}`),
  getDropProcedureScript: (connectionId: string, databaseName: string, schema: string, name: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/dropProcedureScript/${connectionId}/${databaseName}/${schema}/${name}`),

  getViewDefinition: (connectionId: string, databaseName: string, schema: string, name: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/viewDefinition/${connectionId}/${databaseName}/${schema}/${name}`),
  getCreateViewScript: (connectionId: string, databaseName: string, schema: string,): Promise<string> =>
    requests.get<string>(`/databaseCommand/createViewScript/${connectionId}/${databaseName}/${schema}`),
  getDropViewScript: (connectionId: string, databaseName: string, schema: string, name: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/dropViewScript/${connectionId}/${databaseName}/${schema}/${name}`),

  getTopNTableRecordsScript: (connectionId: string, id: string, databaseName: string, schema: string, table: string, recordsNumber: number): Promise<string> =>
    requests.get<string>(`/databaseCommand/tableRecordsScript/${connectionId}/${id}/${databaseName}/${schema}/${table}/${recordsNumber}`),

  getCreateNewTableScript: (connectionId: string, databaseName: string, schema: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/createNewTableScript/${connectionId}/${databaseName}/${schema}`),
  getCreateTableScript: (connectionId: string, databaseName: string, schema: string, table: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/createTableScript/${connectionId}/${databaseName}/${schema}/${table}`),
  getDropTableScript: (connectionId: string, databaseName: string, schema: string, table: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/dropTableScript/${connectionId}/${databaseName}/${schema}/${table}`),
  getInsertTableScript: (connectionId: string, databaseName: string, schema: string, table: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/insertTableScript/${connectionId}/${databaseName}/${schema}/${table}`),
}

const agent = {
  databaseConnectionApi,
  databaseSchemaApi,
  databaseCommandApi
};

export default agent;

