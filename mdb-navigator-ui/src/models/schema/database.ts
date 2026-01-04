import { ProceduresDetails } from "./procedureDetails"
import { TablesDetails } from "./tablesDetails"

export interface Database {
  internalId: string,
  name: string

  tablesDetails: TablesDetails | null,
  storedProceduresDetails: ProceduresDetails | null,
  functionsDetails: ProceduresDetails | null  
}
