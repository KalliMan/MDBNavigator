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
