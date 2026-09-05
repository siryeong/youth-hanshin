import { defineConfig } from 'vitest/config'

export default defineConfig({
  envDir: false,
  test: { environment: 'node', include: ['supabase/tests/villages.test.ts'], testTimeout: 30_000 },
})
