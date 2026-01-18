import Editor, { OnMount } from "@monaco-editor/react";
import "monaco-sql-languages/esm/languages/pgsql/pgsql.contribution";
import { LanguageIdEnum } from "monaco-sql-languages";

import { useEffect, useRef, useState } from "react";
import Button from "../../ui/common/Button";
import { ButtonType } from "../../ui/common/ButtonType.enum";
import { DatabaseSQLCommandQuery } from "../../models/databaseCommand/query/databaseSQLCommandQuery";
import useDatabaseCommandContext from "../../contexts/databaseCommand/useDatabaseCommand";

interface Props {
  databaseCommandQuery: DatabaseSQLCommandQuery;
  execute?(query: string): void;
}

export default function DatabaseCommand({ databaseCommandQuery }: Props) {
  const { executeDatabaseSQLCommand } = useDatabaseCommandContext();
  const commandQuery = useRef<DatabaseSQLCommandQuery>(databaseCommandQuery);
  const [sqlQuery, setSqlQuery] = useState<string>(
    commandQuery.current.cmdQuery
  );

  useEffect(() => {
    commandQuery.current = databaseCommandQuery;
    setSqlQuery(databaseCommandQuery.cmdQuery);
  }, [databaseCommandQuery]);

  useEffect(() => {
    if (commandQuery.current.executeImmediately) {
      executeDatabaseSQLCommand(commandQuery.current);
      commandQuery.current.executeImmediately = false;
    }
  }, [commandQuery, executeDatabaseSQLCommand]);

  function handleEditorChange(value: string | undefined) {
    setSqlQuery(value || "");
  }

  function handleExecute() {
    commandQuery.current.cmdQuery = sqlQuery;
    executeDatabaseSQLCommand(commandQuery.current);
  }

  const handleEditorMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () =>
      handleExecute()
    );
  };

  return (
    <div className="border h-full flex flex-col">
      <div className="px-2 py-1 text-xs text-stone-600 border-b border-stone-300 flex justify-between">
        <span>{commandQuery.current.name}</span>
        <span>{commandQuery.current.databaseName}</span>
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
        <Button type={ButtonType.primary} onClick={handleExecute}>
          Execute (Ctrl+Enter)
        </Button>
      </div>
    </div>
  );
}
