import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// ===== ใส่ PROJECT-ID และ PORT emulator ที่ใช้งานจริงตรงนี้ =====
const FIREBASE_PROJECT_ID = 'lucas-strategy-company-dev';  // <-- ใส่ project id firebase ของคุณ
const FUNCTIONS_PORT = 5001;                    // <-- หรือ port ที่ emulator แจ้ง (default 5001)

export default defineConfig({
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: `http://localhost:${FUNCTIONS_PORT}/${FIREBASE_PROJECT_ID}/us-central1`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
