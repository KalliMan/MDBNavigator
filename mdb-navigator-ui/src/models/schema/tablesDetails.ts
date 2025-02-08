import { Table } from "./table";

export interface TablesDetails {
  dataSource: string;
  databaseName: string;
  tables: Table[];
}
