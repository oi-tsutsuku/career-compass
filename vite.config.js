// このファイルは vite.config.ts に移行済みです。
// Vite は .ts を優先しますが、念のため base を '/' に修正しています。
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel 用: base は '/' (デフォルト)
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
