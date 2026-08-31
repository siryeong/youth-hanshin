import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['supabase/tests/**/*.test.ts'],
    setupFiles: ['dotenv/config'],
    testTimeout: 20000,
    fileParallelism: false,
  },
})
