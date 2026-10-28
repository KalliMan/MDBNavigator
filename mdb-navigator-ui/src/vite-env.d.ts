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
