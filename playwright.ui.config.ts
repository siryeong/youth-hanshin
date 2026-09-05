import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/ui',
  use: { baseURL: 'http://127.0.0.1:5178' },
  webServer: {
    command: 'node e2e/ui/server.ts',
    url: 'http://127.0.0.1:5178',
  },
})
