# Career Compass — 就活現在地マップ

大学生向けキャリア探索アプリ。性格診断ではなく、**就活に向けた現在地と次の一歩**を見える化します。

5つの軸（自己理解・社会探索・行動性・意思決定・**深度/解像度**）でスコアを算出し、レーダーチャートと3Dマップで可視化します。

---

## 技術スタック

- **React 18 + TypeScript**
- **Vite 5**（バンドラー / 開発サーバー）
- **Chart.js**（レーダーチャート）
- **Canvas API**（等角投影3Dマップ）
- **Vercel**（デプロイ）

---

## ローカル起動

```bash
# 1. リポジトリをクローン
git clone https://github.com/<your-username>/career-compass.git
cd career-compass

# 2. 依存パッケージをインストール
npm install

# 3. 開発サーバーを起動
npm run dev
# → http://localhost:5173 で開く
```

### ビルド確認

```bash
npm run build   # tsc + vite build → dist/
npm run preview # dist/ をローカルでプレビュー
```

---

## Vercel へのデプロイ

### 1. GitHubにリポジトリを作成

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/career-compass.git
git push -u origin main
```

### 2. Vercel でプロジェクトをインポート

1. [vercel.com/new](https://vercel.com/new) を開く
2. GitHubリポジトリ `career-compass` を選択
3. Framework Preset が **Vite** になっていることを確認
4. **Deploy** をクリック

以降、`main` ブランチへの push で自動デプロイされます。

> `vercel.json` に `"framework": "vite"` と SPA用リライト設定が含まれているため、追加設定は不要です。

---

## API連携（オプション）

すべての外部API連携は **`src/api/index.ts`** にまとめています。  
デフォルトは `demoMode: true`（APIキーがない場合に自動で有効）。

### 環境変数の設定

`.env.local` をプロジェクトルートに作成（`.gitignore` に含まれています）：

```
VITE_OPENAI_KEY=sk-XXXXXXXXXX
VITE_SHEETS_URL=https://script.google.com/macros/s/XXXXX/exec
VITE_OPENAI_MODEL=gpt-4o-mini
```

Vercelのダッシュボードでも同じ変数を設定してください：  
**Project Settings → Environment Variables**

### OpenAI フィードバック生成

`VITE_OPENAI_KEY` を設定すると、詳細診断完了後に個別フィードバックが生成されます。  
未設定の場合はデモ用のフィードバックテキストが表示されます。

### Google Sheets 保存

`VITE_SHEETS_URL` を設定すると、回答データがスプレッドシートに保存されます。

**Google Apps Script 設定手順：**

1. スプレッドシートを新規作成 → 拡張機能 → Apps Script
2. 以下のコードを貼り付け

```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(Object.keys(data));
  }
  sheet.appendRow(Object.values(data));
  return ContentService.createTextOutput('ok');
}
```

3. デプロイ → 新しいデプロイ → ウェブアプリ
4. 実行者: **自分**、アクセス: **全員** に設定して URL を取得
5. 取得した URL を `VITE_SHEETS_URL` に設定

> ⚠️ APIキーは `.env.local` で管理し、コードに直書きしないでください。

---

## プライバシー設計

- 氏名・メールアドレス・電話番号・学籍番号・住所は**一切取得しません**
- 同意チェックがない場合はデータを保存しません
- APIキー・シークレットはコードに含まれません（環境変数で管理）

---

## ファイル構成

```
career-compass/
├── src/
│   ├── types/
│   │   └── index.ts          # 型定義
│   ├── data/
│   │   ├── questions.ts      # 質問データ・軸メタ情報
│   │   └── patterns.ts       # 8パターンのフィードバックデータ
│   ├── utils/
│   │   └── scoring.ts        # スコア計算・パターン判定
│   ├── api/
│   │   └── index.ts          # 外部API連携（Sheets / OpenAI）
│   ├── context/
│   │   └── AppContext.tsx     # グローバル状態管理（useReducer）
│   ├── components/
│   │   ├── Landing.tsx        # トップ画面
│   │   ├── BasicInfo.tsx      # 基本情報入力
│   │   ├── LightQuiz.tsx      # ライト診断（20問）
│   │   ├── Results.tsx        # 結果画面（深度・解像度を中心に表示）
│   │   ├── DetailQuiz.tsx     # 詳細診断（25問）
│   │   ├── Report.tsx         # 詳細レポート
│   │   ├── RadarChart.tsx     # レーダーチャート（Chart.js）
│   │   └── DepthMap.tsx       # 等角投影3Dマップ（Canvas API）
│   ├── App.tsx                # 画面ルーティング
│   ├── main.tsx               # エントリーポイント
│   ├── index.css              # デザインシステム・トークン
│   └── vite-env.d.ts          # Vite型宣言
├── index.html
├── vite.config.ts
├── vercel.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── package.json
```

---

## ライセンス

MIT
