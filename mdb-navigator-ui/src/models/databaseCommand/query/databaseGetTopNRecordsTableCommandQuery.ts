import { DatabaseCommandQueryBase, DatabaseCommandQueryType } from "./databaseCommandQueryBase";

export class DatabaseGetTopNRecordsTableCommandQuery extends DatabaseCommandQueryBase {
  constructor(public id: string,
    public databaseName: string,
    public schema: string,
    public table: string,
    public recordsNumber: number,
    public executeImmediately: boolean) {

    super(DatabaseCommandQueryType.GetTopNRecordsTable, id, databaseName, executeImmediately);
  }
}
