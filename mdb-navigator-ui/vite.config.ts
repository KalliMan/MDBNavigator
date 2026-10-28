import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      // monaco-sql-languages imports the full 'monaco-editor', which also registers Monaco's basic
      // languages (including a competing basic 'pgsql') and bundles TS/CSS/HTML/JSON workers we don't use.
      // Point the bare import at the editor core; deep imports (monaco-editor/esm/...) are unaffected.
      { find: /^monaco-editor$/, replacement: 'monaco-editor/esm/vs/editor/edcore.main.js' },
    ],
  },
  preview:{
    port: 3000,
    strictPort: true,
  },
  build: {
//    outDir: '../MDBNavigator.API/wwwroot',
    outDir: 'dist',
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
//    origin: 'Https://0.0.0.0:3000',
//    allowedHosts: ['mdbnavigator-ui.wonderfulglacier-2c666d8f.westus2.azurecontainerapps.io']
  }
})
