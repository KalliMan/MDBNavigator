import { Procedure } from "./procedure";

export interface ProceduresDetails{
  dataSource: string;
  databaseName: string;
  procedures: Procedure[];
}