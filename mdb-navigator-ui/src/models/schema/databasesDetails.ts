import { Database } from './database';

export interface DatabasesDetails {
  dataSource: string;
  databases: Database[];
}
