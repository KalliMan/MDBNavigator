import { Table } from "./table";

export interface TablesDetails {
  connectionId: string;
  databaseName: string;
  tables: Table[];
}
