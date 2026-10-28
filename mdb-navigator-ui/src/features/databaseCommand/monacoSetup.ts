// Makes @monaco-editor/react use the bundled Monaco instead of downloading another copy from a CDN.
// The pgsql language (highlighting, completion, diagnostics) from monaco-sql-languages registers into
// this bundled instance; with the CDN copy the editor fell back to Monaco's basic pgsql mode, which
// only highlights reserved words (TABLE yes, DROP/VIEW no). It also removes the runtime CDN dependency.
import { loader } from '@monaco-editor/react';
// Editor core and features without Monaco's own basic languages (their 'pgsql' would compete).
import * as monaco from 'monaco-editor/esm/vs/editor/edcore.main';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import PgSQLWorker from 'monaco-sql-languages/esm/languages/pgsql/pgsql.worker?worker';
import 'monaco-sql-languages/esm/languages/pgsql/pgsql.contribution';

self.MonacoEnvironment = {
  // monaco-sql-languages requests its worker with the language id as label.
  getWorker(_workerId: string, label: string) {
    return label === 'pgsql' ? new PgSQLWorker() : new EditorWorker();
  },
};

loader.config({ monaco });
