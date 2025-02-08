import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  preview:{
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: '../MDBNavigator.API/wwwroot',
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    origin: 'Https://0.0.0.0:3000',
  }
})
