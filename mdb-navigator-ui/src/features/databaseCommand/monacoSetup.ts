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
// Monaco's own adapter for the old worker options (moduleId, label, createData); its JSON language uses it.
import { createWebWorker as createLegacyWebWorker } from 'monaco-editor/esm/vs/common/workers.js';

self.MonacoEnvironment = {
  // monaco-sql-languages requests its worker with the language id as label.
  getWorker(_workerId: string, label: string) {
    return label === 'pgsql' ? new PgSQLWorker() : new EditorWorker();
  },
};

// monaco-sql-languages (up to 1.3.1) still calls editor.createWebWorker with the old options. Since Monaco 0.53
// that function wants a ready `worker` instead; without one it silently fell back to a plain editor worker on the
// main thread, so validation and completion failed ("Missing requestHandler or method: doValidation" /
// "doCompletionWithEntities") and the pgsql worker never started. Calls without `worker` go through Monaco's
// adapter, which creates the worker via MonacoEnvironment.getWorker and sends createData the way the pgsql worker
// expects; calls that already pass a worker (the adapter's own) go straight through.
const createWebWorker = monaco.editor.createWebWorker;
monaco.editor.createWebWorker = ((opts: Parameters<typeof createWebWorker>[0] | LegacyWebWorkerOptions) =>
  'worker' in opts ? createWebWorker(opts) : createLegacyWebWorker(opts)) as typeof createWebWorker;

// Our own editor themes, so the editor's background matches the app's (--canvas in src/index.css).
export const MONACO_THEMES = { light: 'mdbnavigator-light', dark: 'mdbnavigator-dark' } as const;

monaco.editor.defineTheme(MONACO_THEMES.light, {
  base: 'vs',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#ffffff',
    'editorGutter.background': '#ffffff',
    'editorLineNumber.foreground': '#8b929c',
    'editorLineNumber.activeForeground': '#1f2328',
    'editor.lineHighlightBackground': '#f5f8ff',
    'editor.lineHighlightBorder': '#00000000',
  },
});

monaco.editor.defineTheme(MONACO_THEMES.dark, {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#1e1f22',
    'editorGutter.background': '#1e1f22',
    'editorLineNumber.foreground': '#6f737a',
    'editorLineNumber.activeForeground': '#dfe1e5',
    'editor.lineHighlightBackground': '#26282b',
    'editor.lineHighlightBorder': '#00000000',
  },
});

loader.config({ monaco });
