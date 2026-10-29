import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Where the dev proxy sends API calls: the API's HTTP port in its "https" launch profile. Override with
  // API_PROXY_TARGET (environment variable or .env.development.local), e.g. for the "http" profile.
  const apiTarget = loadEnv(mode, '.', '').API_PROXY_TARGET || 'http://localhost:3002'

  return {
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
      // Same origin as the API in development, like in production (the API serves the built UI), so the sign-in
      // cookie just works and no CORS is involved. The target is an HTTP port, so the scheme matches the browser's
      // (http://localhost:3000). The browser's Host is kept: the API builds the sign-in providers' return address
      // from it (http://localhost:3000/api/auth/signin-...).
      proxy: {
        '/api': { target: apiTarget, changeOrigin: false },
        '/batchCommandResult': { target: apiTarget, changeOrigin: false, ws: true },
      },
  //    origin: 'Https://0.0.0.0:3000',
  //    allowedHosts: ['mdbnavigator-ui.wonderfulglacier-2c666d8f.westus2.azurecontainerapps.io']
    }
  }
})
