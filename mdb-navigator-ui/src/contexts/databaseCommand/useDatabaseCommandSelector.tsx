import { useContext } from "react";
import { DatabaseCommandContext } from "./useDatabaseCommandContext";
import { ResultSet } from "../../models/databaseCommand/result/resultSet";

// Stable empty value so consumers don't see a new array on every render.
const NO_RESULT_SETS: ResultSet[] = [];

export default function useDatabaseCommandSelector(id: string) {
  const context = useContext(DatabaseCommandContext);
  const command = context?.state.commands.find(c => c.id === id);

  return {
    command,
    isExecuting: command?.isExecuting ?? false,
    resultSets: command?.resultSets ?? NO_RESULT_SETS,
    error: command?.error ?? null,
    status: command?.status ?? null,
    stats: command?.stats ?? null,
    hubStatus: context?.state.hubStatus ?? 'disconnected',
  };
}
