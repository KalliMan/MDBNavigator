import { defineConfig } from 'vitest/config'

// Unit tests cover pure functions only, so they run in Node without the app's Vite plugins or a browser DOM.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
