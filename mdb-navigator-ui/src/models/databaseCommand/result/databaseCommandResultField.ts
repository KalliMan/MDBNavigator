import { DbTypeCategory } from "./dbTypeCategory";

export interface DatabaseCommandResultField {
  index: number;
  fieldName: string;
  // Decides how the grid sorts and formats the column.
  category: DbTypeCategory;
  // What the database calls the type ("jsonb", "numeric(10, 2)"). Shown, never interpreted.
  dataTypeName: string;
}
