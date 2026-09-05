import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testIgnore: '**/ui/**',
  globalSetup: './e2e/global-setup.ts',
  use: { baseURL: 'http://127.0.0.1:5173' },
  webServer: {
    // vite 는 host 를 지정하지 않으면 localhost 만 바인딩해 IPv6(::1)로 뜬다.
    // webServer.url 의 127.0.0.1(IPv4) 로는 연결이 안 돼 60초 타임아웃이 난다.
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
  },
})
