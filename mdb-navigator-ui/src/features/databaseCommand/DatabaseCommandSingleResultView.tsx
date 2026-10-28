import { useMemo } from "react";
import { ResultSet } from "../../models/databaseCommand/result/resultSet";
import DataGrid, { DataGridColumn } from "../../ui/dataGrid/DataGrid";

interface Props {
  resultSet: ResultSet;
}

export function DatabaseCommandSingleResultView({ resultSet }: Props) {
  const columns = useMemo<DataGridColumn[]>(
    () => resultSet.fields.map(f => ({ name: f.fieldName, type: f.fieldDataTypeName })),
    [resultSet.fields]
  );

  return <DataGrid columns={columns} rows={resultSet.rows} />;
}
