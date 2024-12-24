export enum DatabaseCommandQueryType {
  GetTopNRecordsTable = "GetTopNRecordsTable",

}

export class DatabaseCommandQueryBase {
  constructor(
    public databaseCommandQueryType: DatabaseCommandQueryType,
    public id: string,
    public databaseName: string,
    public executeImmediately: boolean) {
  }
}
