import Editor, { OnMount } from "@monaco-editor/react";
import "./monacoSetup";
import { KeyCode, KeyMod } from "monaco-editor";
import { LanguageIdEnum } from "monaco-sql-languages";

import { useEffect, useRef, useState } from "react";
import Button from "../../ui/common/Button";
import { ButtonType } from "../../ui/common/ButtonType.enum";
import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import useDatabaseCommandContext from "../../contexts/databaseCommand/useDatabaseCommandContext";
import useDatabaseCommandSelector from "../../contexts/databaseCommand/useDatabaseCommandSelector";
import useDatabaseServerConnectContext from "../../contexts/databaseServerConnect/useDatabaseServerConnect";

interface Props {
  databaseCommandQuery: DatabaseSQLCommandQuery;
  execute?(query: string): void;
}

export default function DatabaseCommand({ databaseCommandQuery }: Props) {
  const { executeDatabaseSQLCommand, cancelDatabaseSQLCommand } = useDatabaseCommandContext();
  const { isExecuting, hubStatus } = useDatabaseCommandSelector(databaseCommandQuery.id);
  const { databaseServerConnections } = useDatabaseServerConnectContext();
  // A tab of a disconnected server stays open (its SQL is kept) but can't run.
  const isServerConnected = databaseServerConnections.some(
    c => c.connectedResult?.connectionId === databaseCommandQuery.connectionId
  );
  // While the hub is (re)connecting, results could not be delivered; when disconnected, Execute reconnects first.
  const isHubBusy = hubStatus === 'connecting' || hubStatus === 'reconnecting';
  const canExecute = !isExecuting && !isHubBusy && isServerConnected;
  const executeDisabledReason = !isServerConnected
    ? 'Disconnected — connect to the server again to run this query'
    : isHubBusy ? 'Connecting to the server...' : undefined;
  // The editor's Ctrl+Enter command is bound once on mount, so it reads the current values through a ref
  // (otherwise it would keep calling the execute function and state of the first render).
  const latest = useRef({ canExecute, query: databaseCommandQuery, execute: executeDatabaseSQLCommand });
  useEffect(() => {
    latest.current = { canExecute, query: databaseCommandQuery, execute: executeDatabaseSQLCommand };
  });
  const [sqlQuery, setSqlQuery] = useState<string>(databaseCommandQuery.cmdQuery);
  // Queries opened with executeImmediately (e.g. "Select Top 100") run once when their tab opens.
  const autoRunDone = useRef(false);

  useEffect(() => {
    setSqlQuery(databaseCommandQuery.cmdQuery);
  }, [databaseCommandQuery]);

  useEffect(() => {
    if (databaseCommandQuery.executeImmediately && !autoRunDone.current) {
      autoRunDone.current = true;
      // executeDatabaseSQLCommand reports its own errors in the tab's status, so it isn't awaited.
      void executeDatabaseSQLCommand(databaseCommandQuery);
    }
  }, [databaseCommandQuery, executeDatabaseSQLCommand]);

  function handleEditorChange(value: string | undefined) {
    setSqlQuery(value || "");
  }

  // Runs the editor text; the query object in context state is never modified.
  function run(cmdQuery: string) {
    void latest.current.execute({ ...latest.current.query, cmdQuery });
  }

  function handleExecute() {
    run(sqlQuery);
  }

  function handleCancel() {
    cancelDatabaseSQLCommand(databaseCommandQuery.id);
  }

  const handleEditorMount: OnMount = (editor) => {
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.Enter, () => {
      if (!latest.current.canExecute) return;
      run(editor.getValue());
    });
  };

  return (
    <div className="border h-full flex flex-col">
      <div className="px-2 py-1 text-xs text-stone-600 border-b border-stone-300 flex justify-between">
        <span>{databaseCommandQuery.name}</span>
        <span>{databaseCommandQuery.databaseName}</span>
      </div>
      <div className="flex-1 border-stone-400 border-b-2 min-h-0 p-t-2">
        <Editor
          defaultLanguage={LanguageIdEnum.PG}
          language={LanguageIdEnum.PG}
          defaultValue="-- Put your query here"
          value={sqlQuery}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: "off",
            automaticLayout: true,
          }}
          onMount={handleEditorMount}
        />
      </div>
      <div className="min-h-10 flex items-center px-2 flex-none">
        {isExecuting ? (
          <Button type={ButtonType.primary} onClick={handleCancel}>
            Cancel
          </Button>
        ) : (
          <span title={executeDisabledReason} className="flex items-center gap-2">
            <Button type={ButtonType.primary} onClick={handleExecute} disabled={!canExecute}>
              Execute (Ctrl+Enter)
            </Button>
            {!isServerConnected && (
              <span className="text-xs text-red-600">Disconnected — connect to the server again to run this query</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
