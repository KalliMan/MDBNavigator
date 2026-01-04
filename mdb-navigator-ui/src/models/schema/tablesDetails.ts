import { Table } from "./table";

export interface TablesDetails {
  connectionId: string;
//  dataSource: string;
  databaseName: string;
  tables: Table[];
}
