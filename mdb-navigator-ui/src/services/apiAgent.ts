import axios, { AxiosResponse } from 'axios'
import LocalSessionStorage from '../utils/localSessionStorage';
import { ConnectionSettings } from '../models/connect/connectionSettings';
import { TablesDetails } from '../models/schema/tablesDetails';
import { DatabasesDetails } from '../models/schema/databasesDetails';
import { DatabaseSQLCommandQuery } from '../models/databaseCommand/query/databaseSQLCommandQuery';
import { DatabaseCommandResult } from '../models/databaseCommand/databaseCommandResult';

// import { ConnectionSettings } from '../models/connectionSettings';
// import { Database } from '../models/database';
// import { DatabaseConnectionInfo } from '../models/databaseConnectInfo';
// import { TablesDetails } from '../models/tablesDetails';
// import { CommandQuery } from '../models/commandQuery';
// import LocalSessionStorage from '../common/utils/localSessionStorage';
// import { DatabaseCommantResult } from '../models/databaseCommantResul';

axios.defaults.baseURL = 'https://localhost:7262/api';

axios.interceptors.request.use((config) => {
  // const token = store.commonStore.token;

  if (config.headers) {
    const id = LocalSessionStorage.getApplicationId();
    config.headers.set('id', id);
  }

  return config;
});

const responseBody = (resp: AxiosResponse) => resp.data;

const requests = {
  get: <T> (url: string) => axios.get<T>(url).then(responseBody),
  post: <T> (url: string, body: object) => axios.post<T>(url, body).then(responseBody)
};

const databaseConnectionApi = {
  connect: (connectionSettings: ConnectionSettings): Promise<boolean> =>
    requests.post<boolean>('/DatabaseConnection/connect', connectionSettings),
}

const databaseSchemaApi = {
  fetchDatabases: (): Promise<DatabasesDetails> => requests.get<DatabasesDetails>('/DatabaseSchema/databases'),
  fetchTables: (databaseName: string): Promise<TablesDetails> => requests.get<TablesDetails>(`/DatabaseSchema/tables/${databaseName}`)
};

const databaseCommandApi = {
  execute: (cmdQuery: DatabaseSQLCommandQuery) => requests.post<string>('/DatabaseCommand', cmdQuery),

  getTopNTableRecords: (id: string, databaseName: string, schema: string, table: string, recordsNumber: number): Promise<DatabaseCommandResult> =>
    requests.get<DatabaseCommandResult>(`/DatabaseCommand/tableRecords/${id}/${databaseName}/${schema}/${table}/${recordsNumber}`),
  getTopNTableRecordsScript: (id: string, databaseName: string, schema: string, table: string, recordsNumber: number): Promise<string> =>
    requests.get<string>(`/DatabaseCommand/tableRecordsScript/${id}/${databaseName}/${schema}/${table}/${recordsNumber}`),
}

const agent = {
  databaseConnectionApi,
  databaseSchemaApi,
  databaseCommandApi
};

export default agent;
