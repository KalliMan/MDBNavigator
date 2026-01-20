import { ProceduresDetails } from "./proceduresDetails"
import { TablesDetails } from "./tablesDetails"
import { ViewDetails } from "./viewsDetails"

export interface Database {
  internalId: string,
  name: string

  tablesDetails: TablesDetails | null,
  storedProceduresDetails: ProceduresDetails | null,
  functionsDetails: ProceduresDetails | null
  viewsDetails: ViewDetails | null

  tablesError?: string | null,
  storedProceduresError?: string | null,
  functionsError?: string | null,
  viewsError?: string | null
}
