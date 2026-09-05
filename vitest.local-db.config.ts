import { defineConfig } from 'vitest/config'

export default defineConfig({
  envDir: false,
  test: { environment: 'node', include: ['supabase/tests/villages.test.ts', 'supabase/tests/operations.test.ts'], fileParallelism: false, testTimeout: 30_000 },
})
