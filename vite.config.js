import { defineConfig } from 'vite'

// ── GitHub Pages 向け設定 ──────────────────────────────────────
// リポジトリ名が "career-compass" の場合 → base: '/career-compass/'
// ユーザー/組織ページ (username.github.io) の場合 → base: '/'
// どちらか分からない場合は './' のままで OK（相対パス）
// ─────────────────────────────────────────────────────────────
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
