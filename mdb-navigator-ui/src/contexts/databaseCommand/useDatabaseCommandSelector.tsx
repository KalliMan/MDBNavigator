import { useContext } from "react";
import { DatabaseCommandContext } from "./useDatabaseCommand";

export default function useDatabaseCommandSelector(id: string) {
  const context = useContext(DatabaseCommandContext);
  const command = context?.state.commands.find(c => c.id === id);
  
  return {
    command,
    isExecuting: command?.isExecuting ?? false,
    result: command?.result,
    batchResults: command?.batchResults ?? [],
    error: command?.error ?? null,
  };
}