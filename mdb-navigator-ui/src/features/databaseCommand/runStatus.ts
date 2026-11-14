import { RunningStatement } from "../../contexts/databaseCommand/DatabaseCommandReducer";
import { ResultSet } from "../../models/databaseCommand/result/resultSet";

// The status bar's text while a run is going.
export function executingLabel(
  statement: RunningStatement | null,
  resultSets: Pick<ResultSet, 'resultSetIndex' | 'skippingRest'>[]
): string {
  if (statement) {
    // A result set's last batch says the server is skipping its remaining rows; the statement that is running
    // is then that result set's own, so a flag left on an earlier result set never shows here.
    const position = resultSets.findIndex(rs => rs.resultSetIndex === statement.index);
    if (position !== -1 && resultSets[position].skippingRest) {
      // Tabs are numbered by position, not by resultSetIndex (statements without columns leave gaps).
      return `Skipping the remaining rows of Result ${position + 1} (row limit reached)...`;
    }
    if (statement.count > 1) {
      return `Executing statement ${statement.index + 1} of ${statement.count}...`;
    }
  }
  return 'Executing query...';
}

// "1 record affected", "1,234 records affected".
export function recordsAffectedText(count: number): string {
  return `${count.toLocaleString('en-US')} ${count === 1 ? 'record' : 'records'} affected`;
}

// The id of the Error tab in a result strip; result sets have their own ids.
export const ERROR_TAB_ID = 'error';

// Which tab of the result strip shows. picked: the tab the user clicked last (null: none yet).
// A failed run opens its Error tab by itself: its result sets are new, so a tab picked in an earlier run no
// longer exists. Without an error, a tab that is gone falls back to the first result. null: nothing to show.
export function activeResultTabId(resultSetIds: string[], picked: string | null, hasError: boolean): string | null {
  if (picked === ERROR_TAB_ID && hasError) {
    return ERROR_TAB_ID;
  }
  if (picked !== null && resultSetIds.includes(picked)) {
    return picked;
  }
  if (hasError) {
    return ERROR_TAB_ID;
  }
  return resultSetIds[0] ?? null;
}

export interface RunError {
  // null for a single statement, or an error that is not about a statement (a lost connection).
  statement: { number: number; count: number; line: number } | null;
  message: string;
}

// Splits the server's "Statement 2 of 3 (line 2): <message>" (ExecuteQueryHandler.AtStatement) into its parts.
export function parseRunError(error: string): RunError {
  const match = /^Statement (\d+) of (\d+) \(line (\d+)\): ([\s\S]*)$/.exec(error);
  if (!match) {
    return { statement: null, message: error };
  }
  return {
    statement: { number: Number(match[1]), count: Number(match[2]), line: Number(match[3]) },
    message: match[4],
  };
}

// What happened to the other statements of a script whose statement `number` (from 1) failed.
export function statementsAroundFailure(number: number, count: number): string {
  const parts: string[] = [];
  const before = number - 1;
  if (before === 1) {
    parts.push('Statement 1 ran.');
  } else if (before > 1) {
    parts.push(`Statements 1 to ${before} ran.`);
  }
  const after = count - number;
  if (after === 1) {
    parts.push(`Statement ${count} was not run.`);
  } else if (after > 1) {
    parts.push(`Statements ${number + 1} to ${count} were not run.`);
  }
  return parts.join(' ');
}

// The status bar's text for a finished run with results that stopped at the row limit; null when none did.
export function rowLimitText(rowCount: number, resultSetCount: number, truncatedCount: number): string | null {
  if (truncatedCount === 0) {
    return null;
  }
  const rows = rowCount.toLocaleString('en-US');
  if (resultSetCount === 1) {
    return `Showing first ${rows} rows (row limit reached). Sort and filter cover these rows only.`;
  }
  return `${rows} rows in ${resultSetCount} results. Row limit reached in ${truncatedCount} ${truncatedCount === 1 ? 'result' : 'results'}; sort and filter cover the loaded rows only.`;
}
