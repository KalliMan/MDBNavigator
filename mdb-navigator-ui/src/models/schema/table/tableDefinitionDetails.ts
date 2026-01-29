export interface TableDefinitionDetails {
  connectionId: string;
  databaseName: string;
  databaseSchema: string;
  name: string;

  tableDefinitionError?: string | null;

  columns: TableColumn[];
  indexes: TableIndex[];
}

export interface TableColumn {
  columnName: string;
  dataType: string;
  maxLength?: number;
  isNullable: boolean;
}

export interface TableIndex {
  name: string;
  columnNames: string[];
  isUnique: boolean;
}

export default TableDefinitionDetails;
