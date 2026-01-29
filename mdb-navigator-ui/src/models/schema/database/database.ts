import { ProceduresDetails } from "../procedure/proceduresDetails"
import { TableDefinitionDetails } from "../table/tableDefinitionDetails"
import { TablesDetails } from "../table/tablesDetails"
import { ViewDetails } from "../view/viewsDetails"

export interface Database {
  internalId: string,
  name: string

  tablesDetails: TablesDetails | null,
  tableDefinitionDetails: TableDefinitionDetails[] | null,

  storedProceduresDetails: ProceduresDetails | null,
  functionsDetails: ProceduresDetails | null
  viewsDetails: ViewDetails | null

  tablesError?: string | null,
  storedProceduresError?: string | null,
  functionsError?: string | null,
  viewsError?: string | null
}
