import axios, { AxiosResponse } from 'axios'
import LocalSessionStorage from '../utils/localSessionStorage';
import { ConnectionSettings } from '../models/connect/connectionSettings';
import { DatabaseConnectionInfo } from '../models/connect/databaseConnectInfo';

// import { ConnectionSettings } from '../models/connectionSettings';
// import { Database } from '../models/database';
// import { DatabaseConnectionInfo } from '../models/databaseConnectInfo';
// import { TablesDetails } from '../models/tablesDetails';
// import { CommandQuery } from '../models/commandQuery';
// import LocalSessionStorage from '../common/utils/localSessionStorage';
// import { DatabaseCommantResult } from '../models/databaseCommantResul';

axios.defaults.baseURL = 'https://localhost:7145/api';

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
  connect: (connectionSettings: ConnectionSettings): Promise<DatabaseConnectionInfo> => requests.post<DatabaseConnectionInfo>('/DatabaseConnection/connect', connectionSettings),
}

// const databaseSchemaApi = {
//   fetchDatabases: () => requests.get<Database[]>('/DatabaseSchema/databases'),
//   fetchTables: (databaseName: string) => requests.get<TablesDetails>(`/DatabaseSchema/tables/${databaseName}`)
// };

// const databaseCommandApi = {
//   execute: (cmdQuery: CommandQuery) => requests.post<DatabaseCommantResult>('/DatabaseCommand', cmdQuery)
// }

const agent = {
  databaseConnectionApi,
//  databaseSchemaApi,
//  databaseCommandApi
};

export default agent;
