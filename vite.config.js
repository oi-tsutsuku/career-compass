import { defineConfig } from 'vite'

// ── GitHub Pages 向け設定 ──────────────────────────────────────
// プロジェクトページ (username.github.io/career-compass/) の場合
//   → base: '/career-compass/'  ← 絶対パスで確実に動く
// ユーザー/組織ページ (username.github.io) の場合
//   → base: '/'
// ─────────────────────────────────────────────────────────────
export default defineConfig({
  base: '/career-compass/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
