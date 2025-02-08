import axios, { AxiosError, AxiosResponse } from 'axios'
import LocalSessionStorage from '../utils/localSessionStorage';
import { ConnectionSettings } from '../models/connect/connectionSettings';
import { TablesDetails } from '../models/schema/tablesDetails';
import { DatabasesDetails } from '../models/schema/databasesDetails';
import { DatabaseSQLCommandQuery } from '../models/databaseCommand/query/databaseSQLCommandQuery';
import { DatabaseCommandResult } from '../models/databaseCommand/result/databaseCommandResult';
import { toast } from 'react-toastify';
import { sleep } from '../common/helpers/commonHelpers';
import { ProceduresDetails } from '../models/schema/procedureDetails';

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

    // const pagination = response.headers['pagination'];
    // if (pagination) {
    //     response.data = new PaginatedResult(response.data, JSON.parse(pagination));
    //     return response as AxiosResponse<PaginatedResult<any>>;
    // }

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
        // if (config.method === 'get' && data.errors.hasOwnProperty('id')) {
        //     router.navigate('/not-found');
        // }

        if (data.errors) {
          const modalStateErrors = [];
          for (const key in data.errors) {
            if (data.errors[key]) {
              modalStateErrors.push(data.errors[key]);
            }
          }

          throw modalStateErrors.flat();
        } else {
          toast.error(data);
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
        //          router.navigate('/not-found')
        break;
      case 500:
        toast.error(data.message);
        //          store.commonStore.setSetverError(data);
        //          router.navigate('/server-error')
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
  connect: (connectionSettings: ConnectionSettings): Promise<boolean> =>
    requests.post<boolean>('/databaseConnection/connect', connectionSettings),
}

const databaseSchemaApi = {
  fetchDatabases: (): Promise<DatabasesDetails> =>
    requests.get<DatabasesDetails>('/databaseSchema/databases'),
  fetchTables: (databaseName: string): Promise<TablesDetails> =>
    requests.get<TablesDetails>(`/databaseSchema/tables/${databaseName}`),
  fetchStoredProcedures: (databaseName: string): Promise<ProceduresDetails> =>
    requests.get<ProceduresDetails>(`/databaseSchema/storedProcedures/${databaseName}`),
  fetchFunctions: (databaseName: string): Promise<ProceduresDetails> =>
    requests.get<ProceduresDetails>(`/databaseSchema/functions/${databaseName}`)
};

const databaseCommandApi = {
  execute: (cmdQuery: DatabaseSQLCommandQuery): Promise<DatabaseCommandResult> =>
    requests.post<DatabaseCommandResult>('/databaseCommand', cmdQuery),
  getProcedureDefinition: (databaseName: string, schema: string, name: string): Promise<string> =>
    requests.get<DatabaseCommandResult>(`/databaseCommand/procedureDefinition/${databaseName}/${schema}/${name}`),

  getTopNTableRecords: (id: string, databaseName: string, schema: string, table: string, recordsNumber: number): Promise<DatabaseCommandResult> =>
    requests.get<DatabaseCommandResult>(`/databaseCommand/tableRecords/${id}/${databaseName}/${schema}/${table}/${recordsNumber}`),
  getTopNTableRecordsScript: (id: string, databaseName: string, schema: string, table: string, recordsNumber: number): Promise<string> =>
    requests.get<string>(`/databaseCommand/tableRecordsScript/${id}/${databaseName}/${schema}/${table}/${recordsNumber}`),

  getCreateTableScript: (databaseName: string, schema: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/createTableScript/${databaseName}/${schema}`),
  getDropTableScript: (databaseName: string, schema: string, table: string): Promise<string> =>
    requests.get<string>(`/databaseCommand/dropTableScript/${databaseName}/${schema}/${table}`),
}

const agent = {
  databaseConnectionApi,
  databaseSchemaApi,
  databaseCommandApi
};

export default agent;

