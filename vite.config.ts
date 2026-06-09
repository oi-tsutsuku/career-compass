import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel: base はデフォルト '/' のまま（設定不要）
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
