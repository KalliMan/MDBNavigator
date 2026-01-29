import { Database } from './database';

export interface DatabasesDetails {
  connectionId: string;
  dataSource: string;
  databases: Database[];
}
