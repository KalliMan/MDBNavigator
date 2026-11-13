/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SIGNALR_URL: string;
  readonly VITE_DEV_DB_SERVER?: string;
  readonly VITE_DEV_DB_PORT?: string;
  readonly VITE_DEV_DB_USER?: string;
  readonly VITE_DEV_DB_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Monaco's core entry (editor + features, no basic languages) ships without typings; it exports the same API.
declare module 'monaco-editor/esm/vs/editor/edcore.main' {
  export * from 'monaco-editor';
}

// The old createWebWorker options, still used by monaco-sql-languages (see monacoSetup.ts).
interface LegacyWebWorkerOptions {
  moduleId?: string;
  label?: string;
  createData?: unknown;
  createWorker?: () => Worker;
  host?: Record<string, (...args: unknown[]) => unknown>;
  keepIdleModels?: boolean;
}

// Monaco's adapter for those options; it ships without typings.
declare module 'monaco-editor/esm/vs/common/workers.js' {
  import type { editor } from 'monaco-editor';
  export function createWebWorker<T extends object>(opts: LegacyWebWorkerOptions): editor.MonacoWebWorker<T>;
}
