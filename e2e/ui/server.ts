import { createServer } from 'vite'

const server = await createServer({
  envDir: false,
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('http://127.0.0.1:54321'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('ui-test-key'),
  },
  server: { host: '127.0.0.1', port: 5178, strictPort: true },
})
await server.listen()
