import { View } from "./view";

export interface ViewDetails  {
  connectionId: string;
  dataSource: string;
  databaseName: string;
  views: View[];
}