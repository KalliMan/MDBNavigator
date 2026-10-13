export interface TableDefinitionDetails {
  connectionId: string;
  databaseName: string;
  databaseSchema: string;
  name: string;

  tableDefinitionError?: string | null;

  columns: TableColumn[];
  indexes: TableIndex[];
  constraints: TableContraint[];
}

export interface TableColumn {
  columnName: string;
  dataType: string;
  maxLength?: number;
  isNullable: boolean;
}

export interface TableIndex {
  indexName: string;
  isUnique: boolean;
  indexType: number; // 0=Regular 1=Unique 2=PrimaryKey 3=UniqueConstraint
}

export interface TableContraint {
  constraintName: string;
  constraintType: string;
}

export default TableDefinitionDetails;
