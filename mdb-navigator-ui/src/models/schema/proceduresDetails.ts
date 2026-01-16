import { Procedure } from "./procedure";

export interface ProceduresDetails{
  connectionId: string;
  dataSource: string;
  databaseName: string;
  procedures: Procedure[];
}