export enum ProcedureType {
  Unknown,
  Procedure,
  Function
}

export interface Procedure {
  databaseSchema: string;
  name: string;
  procedureType: ProcedureType;
}
