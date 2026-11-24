import Editor, { OnMount } from "@monaco-editor/react";
import { MONACO_THEMES } from "./monacoSetup";
// editor is a value here for its enums (OverviewRulerLane, TrackedRangeStickiness); it is also the type namespace.
import { KeyCode, KeyMod, editor } from "monaco-editor";
import { LanguageIdEnum } from "monaco-sql-languages";

import { RefObject, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { LuGauge, LuListTree, LuPlay, LuSquare } from "react-icons/lu";
import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import useDatabaseCommandContext from "../../contexts/databaseCommand/useDatabaseCommandContext";
import useDatabaseCommandSelector from "../../contexts/databaseCommand/useDatabaseCommandSelector";
import useDatabaseServerConnectContext from "../../contexts/databaseServerConnect/useDatabaseServerConnect";
import { QueryTarget } from "../../models/databaseCommand/query/queryTarget";
import useTheme from "../../contexts/theme/useTheme";
import { MONO_FONT } from "../../utils/fonts";
import { PlanMode } from "../../models/databaseCommand/query/planMode";
import { mayChangeData } from "../queryPlan/queryPlan";
import AnalyzeConfirm from "./AnalyzeConfirm";
import QueryTargetPicker from "./QueryTargetPicker";
import { errorSpan, escapeMarkdown } from "./errorLocation";
import { parseRunError } from "./runStatus";

interface Props {
  databaseCommandQuery: DatabaseSQLCommandQuery;
  target: QueryTarget;
  onTargetChange: (target: QueryTarget) => void;
  // Set here once the editor is mounted: puts the cursor on the failed run's mark (the Error tab's "Go to error").
  goToErrorRef: RefObject<(() => void) | null>;
  execute?(query: string): void;
}

// Where a run's text starts in the editor, 1-based as Monaco counts. Run and Ctrl+Enter send the whole editor.
type StartsAt = { line: number; column: number };
const WHOLE_EDITOR: StartsAt = { line: 1, column: 1 };

// How the place the database reported for a failed run looks in the editor (classes in index.css).
const ERROR_MARK: editor.IModelDecorationOptions = {
  inlineClassName: 'run-error-mark',
  linesDecorationsClassName: 'run-error-gutter',
  overviewRuler: { color: { id: 'editorOverviewRuler.errorForeground' }, position: editor.OverviewRulerLane.Right },
  // Typing right before or after the mark doesn't make it longer.
  stickiness: editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
};

export default function DatabaseCommand({ databaseCommandQuery, target, onTargetChange, goToErrorRef }: Props) {
  const { executeDatabaseSQLCommand, cancelDatabaseSQLCommand } = useDatabaseCommandContext();
  const { command, isExecuting, error, hubStatus } = useDatabaseCommandSelector(databaseCommandQuery.id);
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
  // The editor, for the selection: Explain works on the selected statement.
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  // The failed run's mark. A decoration, so it moves with the text while the user types.
  const errorMarks = useRef<editor.IEditorDecorationsCollection | null>(null);
  // The mark is set in an effect, which must run again once the editor exists.
  const [editorMounted, setEditorMounted] = useState(false);
  // The statement waiting for the user's yes before Explain Analyze runs it (it may change data), and where its
  // text starts in the editor.
  const [pendingAnalyze, setPendingAnalyze] = useState<{ text: string; startsAt: StartsAt } | null>(null);
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

  const source = command?.source ?? null;
  const errorOffset = command?.errorOffset ?? null;

  // Marks the place the database reported for the failed run. A new run clears it (errorOffset is null again).
  useEffect(() => {
    const marks = errorMarks.current;
    const model = editorRef.current?.getModel();
    if (!editorMounted || !marks || !model) return;
    marks.clear();
    if (!source || errorOffset === null) return;

    // Where the sent text started. If the editor no longer has that text there, it was edited while the query
    // ran, and the offsets mean something else: no mark.
    const startOffset = model.getOffsetAt({ lineNumber: source.line, column: source.column });
    if (model.getValue().substring(startOffset, startOffset + source.text.length) !== source.text) return;

    const span = errorSpan(source.text, errorOffset);
    const start = model.getPositionAt(startOffset + span.start);
    const end = model.getPositionAt(startOffset + span.end);
    marks.set([{
      range: { startLineNumber: start.lineNumber, startColumn: start.column, endLineNumber: end.lineNumber, endColumn: end.column },
      options: {
        ...ERROR_MARK,
        hoverMessage: error ? { value: escapeMarkdown(parseRunError(error).message.split('\n')[0]) } : undefined,
      },
    }]);
  }, [editorMounted, source, errorOffset, error]);

  // The Error tab can't call into a disposed editor.
  useEffect(() => () => {
    goToErrorRef.current = null;
  }, [goToErrorRef]);

  function handleEditorChange(value: string | undefined) {
    setSqlQuery(value || "");
  }

  // Runs the editor text where the tab now points (1.2d); the query object in context state is never modified.
  // plan: ask for the plan of one statement instead of running the text (Explain, Explain Analyze).
  // startsAt: where that text starts in the editor (a selection's start), for the error's place.
  function run(cmdQuery: string, plan: PlanMode | null = null, startsAt: StartsAt = WHOLE_EDITOR) {
    const { query, target: where, execute } = latest.current;
    setTargetNote(null);
    void execute({ ...query, connectionId: where.connectionId, databaseName: where.databaseName, cmdQuery }, plan, startsAt);
  }

  // What Explain works on: the selection, or the whole editor when nothing is selected. (Run always runs the whole editor.)
  function explainText(): { text: string; startsAt: StartsAt } {
    const editorInstance = editorRef.current;
    const selection = editorInstance?.getSelection();
    if (editorInstance && selection && !selection.isEmpty()) {
      return {
        text: editorInstance.getModel()?.getValueInRange(selection) ?? '',
        startsAt: { line: selection.startLineNumber, column: selection.startColumn },
      };
    }
    return { text: editorInstance?.getValue() ?? sqlQuery, startsAt: WHOLE_EDITOR };
  }

  // Reads through `latest` like the editor's keys do, so F7 never works with an older render's state.
  function explain(plan: PlanMode) {
    if (!latest.current.canExecute) return;
    const picked = explainText();
    // Analyze runs the statement (rolled back): the user is asked first when it may change data.
    if (plan === 'Analyze' && mayChangeData(picked.text)) {
      setPendingAnalyze(picked);
      return;
    }
    run(picked.text, plan, picked.startsAt);
  }

  function handleExecute() {
    run(sqlQuery);
  }

  function handleCancel() {
    cancelDatabaseSQLCommand(databaseCommandQuery.id);
  }

  const handleEditorMount: OnMount = (mounted) => {
    editorRef.current = mounted;
    errorMarks.current = mounted.createDecorationsCollection();
    goToErrorRef.current = () => {
      const range = errorMarks.current?.getRange(0);
      if (!range) {
        // No mark: the text was edited while the query ran (see the effect above).
        toast.info("The editor's text changed while the query ran, so the place can't be shown.");
        return;
      }
      const position = range.getStartPosition();
      mounted.setPosition(position);
      mounted.revealPositionInCenterIfOutsideViewport(position);
      mounted.focus();
    };
    setEditorMounted(true);
    mounted.addCommand(KeyMod.CtrlCmd | KeyCode.Enter, () => {
      if (!latest.current.canExecute) return;
      run(mounted.getValue());
    });
    mounted.addCommand(KeyCode.F7, () => explain('Estimate'));
    mounted.addCommand(KeyMod.Shift | KeyCode.F7, () => explain('Analyze'));
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 flex-none items-center gap-1.5 border-b border-line-subtle pl-2 pr-3">
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
        <span className="flex" title={executeDisabledReason ?? 'Explain: the plan for the selected statement, or the whole editor, without running it (F7)'}>
          <button
            type="button"
            onClick={() => explain('Estimate')}
            disabled={!canExecute}
            className="flex h-7 items-center gap-1.5 rounded-[3px] px-2 font-medium text-fg hover:bg-hover disabled:cursor-not-allowed disabled:text-fg-faint disabled:hover:bg-transparent cursor-pointer"
          >
            <LuListTree size={14} aria-hidden="true" />
            Explain
          </button>
        </span>
        <span className="flex" title={executeDisabledReason ?? 'Explain Analyze: runs the statement to show real times; its changes are rolled back (Shift+F7)'}>
          <button
            type="button"
            onClick={() => explain('Analyze')}
            disabled={!canExecute}
            className="flex h-7 items-center gap-1.5 rounded-[3px] px-2 font-medium text-fg hover:bg-hover disabled:cursor-not-allowed disabled:text-fg-faint disabled:hover:bg-transparent cursor-pointer"
          >
            <LuGauge size={14} aria-hidden="true" />
            Analyze
          </button>
        </span>
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
      {pendingAnalyze !== null && (
        <AnalyzeConfirm
          onConfirm={() => {
            const pending = pendingAnalyze;
            setPendingAnalyze(null);
            run(pending.text, 'Analyze', pending.startsAt);
          }}
          onClose={() => setPendingAnalyze(null)}
        />
      )}
    </div>
  );
}
