# Career Compass — 就活現在地マップ

大学生向けキャリア探索アプリ。性格診断ではなく、**就活に向けた現在地と次の一歩**を見える化します。

## 技術スタック

- **Vite** (バンドラー / 開発サーバー)
- **chart.js** (レーダーチャート)
- 純粋な HTML / CSS / JavaScript (フレームワークなし)

---

## ローカル起動方法

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

### ビルド（本番用）

```bash
npm run build
# → dist/ フォルダが生成される

npm run preview
# → dist/ をローカルでプレビュー
```

---

## GitHub Pages 公開方法

### 1. GitHubにリポジトリを作成

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/career-compass.git
git push -u origin main
```

### 2. GitHub Pages の設定

1. GitHubリポジトリの **Settings** タブを開く
2. 左メニューの **Pages** をクリック
3. **Source** を **"GitHub Actions"** に変更して保存

### 3. 自動デプロイの確認

`main` ブランチへの push と同時に GitHub Actions が動き、  
`https://<your-username>.github.io/career-compass/` で公開されます。

> **vite.config.js の `base` について**  
> デフォルトは `'./'`（相対パス）で動作します。  
> もし公開URLのサブパスと一致させたい場合は `base: '/career-compass/'` に変更してください。

---

## GitHub Actions 設定方法

`.github/workflows/deploy.yml` が設定済みです。

| ファイル | 説明 |
|---|---|
| `.github/workflows/deploy.yml` | `main` push 時に自動ビルド＆デプロイ |

**必要なリポジトリ設定（GitHub側）:**

1. **Settings → Pages → Source → GitHub Actions** に設定
2. **Settings → Actions → General → Workflow permissions** を  
   `Read and write permissions` に設定（またはデフォルトのまま）

手動で再デプロイしたい場合は  
**Actions タブ → "Deploy to GitHub Pages" → "Run workflow"** で実行できます。

---

## API連携を後から追加する場所

すべての外部API連携は **`src/api.js`** にまとめています。

### Google Sheets 連携を有効にする

```js
// src/api.js
export const CFG = {
  sheetsUrl: 'https://script.google.com/macros/s/XXXXX/exec',  // ← ここに設定
  demoMode: true,  // ← false に変更するとAPIが有効になる
  ...
}
```

**Google Apps Script 側の設定手順:**

1. スプレッドシートを新規作成 → 拡張機能 → Apps Script
2. 以下のコードを貼り付け

```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(Object.keys(data));   // ヘッダー行
  }
  sheet.appendRow(Object.values(data));  // データ行
  return ContentService.createTextOutput('ok');
}
```

3. **デプロイ → 新しいデプロイ → ウェブアプリ** で公開
4. 実行者: **自分**、アクセス: **全員** に設定して URL を取得
5. 取得した URL を `CFG.sheetsUrl` に設定

### OpenAI API 連携を有効にする

```js
// src/api.js
export const CFG = {
  openaiKey: 'sk-XXXXXXXXXX',   // ← ここに設定
  openaiModel: 'gpt-4o-mini',
  demoMode: false,               // ← false に変更
}
```

> ⚠️ **本番環境では API キーをコードに直書きしないでください。**  
> Vite の環境変数（`.env` ファイル + `import.meta.env.VITE_OPENAI_KEY`）と  
> GitHub Secrets を組み合わせて管理することを推奨します。

#### 環境変数を使う場合（推奨）

1. `.env` ファイルを作成（`.gitignore` に含まれています）

```
VITE_OPENAI_KEY=sk-XXXXXXXXXX
VITE_SHEETS_URL=https://script.google.com/...
```

2. `src/api.js` で参照

```js
export const CFG = {
  openaiKey: import.meta.env.VITE_OPENAI_KEY || '',
  sheetsUrl: import.meta.env.VITE_SHEETS_URL || '',
  demoMode: !import.meta.env.VITE_OPENAI_KEY,
}
```

3. GitHub Actions に Secrets を追加  
   **Settings → Secrets and variables → Actions → New repository secret**

4. `deploy.yml` の Build ステップに環境変数を追加

```yaml
- name: Build
  run: npm run build
  env:
    VITE_OPENAI_KEY: ${{ secrets.VITE_OPENAI_KEY }}
    VITE_SHEETS_URL: ${{ secrets.VITE_SHEETS_URL }}
```

---

## ファイル構成

```
career-compass/
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions 自動デプロイ
├── src/
│   ├── main.js              # アプリ起動・状態管理・全画面レンダリング
│   ├── style.css            # 全スタイル
│   ├── data.js              # 質問データ・選択肢・軸メタ情報
│   ├── scoring.js           # スコア計算・パターン判定
│   ├── patterns.js          # 8パターンのフィードバックデータ
│   ├── api.js               # 外部API連携（Sheets / OpenAI）★後から追加
│   └── chart.js             # レーダーチャート & 3Dマップ
├── index.html               # エントリーポイント
├── vite.config.js           # Vite 設定
├── package.json
└── README.md
```

---

## ライセンス

MIT
