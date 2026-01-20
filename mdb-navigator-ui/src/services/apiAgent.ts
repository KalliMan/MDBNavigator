import axios, { AxiosError, AxiosResponse } from 'axios'
import LocalSessionStorage from '../utils/localSessionStorage';
import { ConnectionSettings } from '../models/connect/connectionSettings';
import { TablesDetails } from '../models/schema/tablesDetails';
import { DatabasesDetails } from '../models/schema/databasesDetails';
import { DatabaseSQLCommandQuery } from '../models/databaseCommand/query/databaseSQLCommandQuery';
import { DatabaseCommandResult } from '../models/databaseCommand/result/databaseCommandResult';
import { toast } from 'react-toastify';
import { sleep } from '../common/helpers/commonHelpers';
import { ProceduresDetails } from '../models/schema/proceduresDetails';
import { ConnectedResult } from '../models/connect/connectedResult';
import { ViewDetails } from '../models/schema/viewsDetails';

axios.defaults.baseURL = import.meta.env.VITE_API_URL; //'https://localhost:7262/api';

console.log(axios.defaults.baseURL);

axios.interceptors.request.use((config) => {
  if (config.headers) {
    const id = LocalSessionStorage.getApplicationId();
    config.headers.set('id', id);
  }

  return config;
});

axios.interceptors.response.use(
  async (response) => {
    if (import.meta.env.DEV) {
      await sleep(500);
    }

    return response;
  },
  (error: AxiosError) => {
    if (error.code === "ERR_NETWORK" && !error.response) {
      toast.error("Network error - cannot connect to the server!");
      return Promise.reject(error);
    }
    const { data, status } = error.response as AxiosResponse;
    switch (status) {

      case 400:
        if (data.errors) {
          const modalStateErrors = [];
          for (const key in data.errors) {
            if (data.errors[key]) {
              modalStateErrors.push(data.errors[key]);
            }
          }

          toast.error(modalStateErrors.flat());
        } else {
          toast.error(data.message);
        }
        break;
      case 401:
        toast.error("Unauthorised!");
        break;
      case 403:
        toast.error("Forbidden!");
        break;
      case 404:
        toast.error("Not Found!");
        break;
      case 500:
        toast.error(data.message);
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
  fetchStoredProcedures: (connectionId: string, databaseName: string): Promise<ProceduresDetails> =>
    requests.get<ProceduresDetails>(`/databaseSchema/storedProcedures/${connectionId}/${databaseName}`),
  fetchFunctions: (connectionId: string, databaseName: string): Promise<ProceduresDetails> =>
    requests.get<ProceduresDetails>(`/databaseSchema/functions/${connectionId}/${databaseName}`),
  fetchViews: (connectionId: string, databaseName: string): Promise<ViewDetails> =>
    requests.get<ViewDetails>(`/databaseSchema/views/${connectionId}/${databaseName}`),
};

const databaseCommandApi = {
  execute: (cmdQuery: DatabaseSQLCommandQuery): Promise<DatabaseCommandResult> =>
    requests.post<DatabaseCommandResult>('/databaseCommand', cmdQuery),

  getProcedureDefinition: (connectionId: string, databaseName: string, schema: string, name: string): Promise<string> =>
    requests.get<DatabaseCommandResult>(`/databaseCommand/procedureDefinition/${connectionId}/${databaseName}/${schema}/${name}`),
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

  getTopNTableRecords: (connectionId: string, id: string, databaseName: string, schema: string, table: string, recordsNumber: number): Promise<DatabaseCommandResult> =>
    requests.get<DatabaseCommandResult>(`/databaseCommand/tableRecords/${connectionId}/${id}/${databaseName}/${schema}/${table}/${recordsNumber}`),
  getTopNTableRecordsScript: (connectionId: string, id: string, databaseName: string, schema: string, table: string, recordsNumber: number): Promise<string> =>
    requests.get<string>(`/databaseCommand/tableRecordsScript/${connectionId}/${id}/${databaseName}/${schema}/${table}/${recordsNumber}`),

  getCreateTableScript: (connectionId: string, databaseName: string, schema: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/createTableScript/${connectionId}/${databaseName}/${schema}`),
  getDropTableScript: (connectionId: string, databaseName: string, schema: string, table: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/dropTableScript/${connectionId}/${databaseName}/${schema}/${table}`),
}

const agent = {
  databaseConnectionApi,
  databaseSchemaApi,
  databaseCommandApi
};

export default agent;

