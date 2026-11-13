import Editor, { OnMount } from "@monaco-editor/react";
import { MONACO_THEMES } from "./monacoSetup";
import { KeyCode, KeyMod } from "monaco-editor";
import { LanguageIdEnum } from "monaco-sql-languages";

import { useEffect, useRef, useState } from "react";
import { LuPlay, LuSquare } from "react-icons/lu";
import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import useDatabaseCommandContext from "../../contexts/databaseCommand/useDatabaseCommandContext";
import useDatabaseCommandSelector from "../../contexts/databaseCommand/useDatabaseCommandSelector";
import useDatabaseServerConnectContext from "../../contexts/databaseServerConnect/useDatabaseServerConnect";
import { QueryTarget } from "../../models/databaseCommand/query/queryTarget";
import useTheme from "../../contexts/theme/useTheme";
import { MONO_FONT } from "../../utils/fonts";
import QueryTargetPicker from "./QueryTargetPicker";

interface Props {
  databaseCommandQuery: DatabaseSQLCommandQuery;
  target: QueryTarget;
  onTargetChange: (target: QueryTarget) => void;
  execute?(query: string): void;
}

export default function DatabaseCommand({ databaseCommandQuery, target, onTargetChange }: Props) {
  const { executeDatabaseSQLCommand, cancelDatabaseSQLCommand } = useDatabaseCommandContext();
  const { isExecuting, hubStatus } = useDatabaseCommandSelector(databaseCommandQuery.id);
  const { databaseServerConnections } = useDatabaseServerConnectContext();
  const { theme } = useTheme();
  // A tab of a disconnected server stays open (its SQL is kept) but can't run.
  const isServerConnected = databaseServerConnections.some(
    c => c.connectedResult?.connectionId === target.connectionId
  );
  const anyServerConnected = databaseServerConnections.some(c => c.connectedResult);
  const disconnectedMessage = anyServerConnected
    ? 'Disconnected. Pick a connected server to run this query.'
    : 'Disconnected. Connect to a server to run this query.';
  // Set when the database changed without the user picking it; it replaces the address until the next action.
  const [targetNote, setTargetNote] = useState<string | null>(null);
  // While the hub is (re)connecting, results could not be delivered; when disconnected, Execute reconnects first.
  const isHubBusy = hubStatus === 'connecting' || hubStatus === 'reconnecting';
  const canExecute = !isExecuting && !isHubBusy && isServerConnected;
  const executeDisabledReason = !isServerConnected
    ? disconnectedMessage
    : isHubBusy ? 'Connecting to the server...' : undefined;
  // The editor's Ctrl+Enter command is bound once on mount, so it reads the current values through a ref
  // (otherwise it would keep calling the execute function and state of the first render).
  const latest = useRef({ canExecute, query: databaseCommandQuery, target, execute: executeDatabaseSQLCommand });
  useEffect(() => {
    latest.current = { canExecute, query: databaseCommandQuery, target, execute: executeDatabaseSQLCommand };
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

  // Runs the editor text where the tab now points (1.2d); the query object in context state is never modified.
  function run(cmdQuery: string) {
    const { query, target: where, execute } = latest.current;
    setTargetNote(null);
    void execute({ ...query, connectionId: where.connectionId, databaseName: where.databaseName, cmdQuery });
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
    <div className="flex h-full flex-col">
      <div className="flex h-9 flex-none items-center gap-1.5 border-b border-line-subtle px-2">
        {/* The span carries the tooltip: a disabled button shows none in some browsers. */}
        <span className="flex" title={executeDisabledReason ?? 'Run (Ctrl+Enter)'}>
          <button
            type="button"
            onClick={handleExecute}
            disabled={!canExecute}
            className="flex h-7 items-center gap-1.5 rounded-[3px] px-2 font-medium text-success hover:bg-hover disabled:cursor-not-allowed disabled:text-fg-faint disabled:hover:bg-transparent cursor-pointer"
          >
            <LuPlay size={14} aria-hidden="true" />
            Run
          </button>
        </span>
        <button
          type="button"
          onClick={handleCancel}
          disabled={!isExecuting}
          aria-label="Stop"
          title="Stop the running query"
          className="flex size-7 items-center justify-center rounded-[3px] text-danger hover:bg-hover disabled:cursor-not-allowed disabled:text-fg-faint disabled:hover:bg-transparent cursor-pointer"
        >
          <LuSquare size={13} aria-hidden="true" />
        </button>
        <span className="mx-1 h-[18px] w-px bg-line" aria-hidden="true" />
        <QueryTargetPicker
          target={target}
          locked={isExecuting}
          onChange={(next, note) => { setTargetNote(note); onTargetChange(next); }}
          onMenuOpen={() => setTargetNote(null)}
        />
        <span className="flex-1" />
        {!isServerConnected ? (
          <span className="truncate text-xs text-danger">{disconnectedMessage}</span>
        ) : targetNote ? (
          <span role="status" className="truncate text-xs text-warning">{targetNote}</span>
        ) : (
          <span className="truncate text-xs text-fg-muted">{target.address}</span>
        )}
      </div>
      <div className="min-h-0 flex-1">
        <Editor
          defaultLanguage={LanguageIdEnum.PG}
          language={LanguageIdEnum.PG}
          defaultValue="-- Put your query here"
          value={sqlQuery}
          onChange={handleEditorChange}
          theme={theme === 'dark' ? MONACO_THEMES.dark : MONACO_THEMES.light}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 21,
            fontFamily: MONO_FONT,
            wordWrap: "off",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 6 },
          }}
          onMount={handleEditorMount}
        />
      </div>
    </div>
  );
}
