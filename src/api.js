// ─────────────────────────────────────────────────────────────
// api.js  —  外部API連携（Google Sheets / OpenAI）
//
// ⚠️ デモ版では CFG.demoMode = true のため API は呼ばれません。
//
// 後から追加する手順:
//   1. Google Sheets → CFG.sheetsUrl に Apps Script URL を設定
//   2. OpenAI        → CFG.openaiKey にAPIキーを設定し
//                      CFG.demoMode を false に変更
//
// 本番環境では .env ファイルや GitHub Secrets で管理してください。
//   vite.config.js で define を使って環境変数を注入できます。
//   例: define: { __SHEETS_URL__: JSON.stringify(process.env.VITE_SHEETS_URL) }
// ─────────────────────────────────────────────────────────────

export const CFG = {
  /** Google Apps Script のデプロイURL（POST エンドポイント） */
  sheetsUrl: '',

  /** OpenAI API キー */
  openaiKey: '',

  /** 使用モデル */
  openaiModel: 'gpt-4o-mini',

  /**
   * true の間は API 呼び出しをスキップし、テンプレート文言を使用する
   * GitHub Pages デモ公開時は true のまま運用推奨
   */
  demoMode: true,
}

// ─────────────────────────────────────────────────────────────
// Google Sheets 保存
// ─────────────────────────────────────────────────────────────

/**
 * 回答データを Google Sheets に保存する
 * Apps Script 側で POST を受け取り、スプレッドシートに1行追加する
 *
 * @param {Object} data  buildSheetRow() が返すオブジェクト
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
export async function submitToSheets(data) {
  if (!CFG.sheetsUrl) return { ok: false, reason: 'no_url' }
  try {
    await fetch(CFG.sheetsUrl, {
      method: 'POST',
      mode: 'no-cors',           // Apps Script は CORS を返さないため
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return { ok: true }
  } catch (e) {
    console.warn('[api] Sheets submit failed:', e)
    return { ok: false, reason: e.message }
  }
}

// ─────────────────────────────────────────────────────────────
// OpenAI 詳細レポート生成
// ─────────────────────────────────────────────────────────────

/**
 * OpenAI Chat Completions でパーソナライズされたレポートを生成する
 * demoMode=true または openaiKey 未設定の場合は null を返す
 *
 * @param {Object} scores    { self, social, action, decision, depth }
 * @param {Object} basicInfo { grade, status, hs, ... }
 * @returns {Promise<string|null>}
 */
export async function generateOpenAIReport(scores, basicInfo) {
  if (CFG.demoMode || !CFG.openaiKey) return null

  const prompt = `あなたは大学生向けのキャリア支援者です。
MBTIのように性格を断定せず、学生の現在地をもとに就職活動に役立つフィードバックを作成してください。

【学生情報】
学年: ${basicInfo.grade ?? '不明'}
就活状況: ${basicInfo.status ?? '不明'}
文理区分: ${basicInfo.hs ?? '不明'}

【スコア（0〜100点）】
自己理解: ${scores.self}
社会探索: ${scores.social}
行動性: ${scores.action}
意思決定: ${scores.decision}
深度・解像度: ${scores.depth}

【出力条件】
・断定しない（「傾向があります」「可能性があります」など）
・弱みではなくリスクとして表現する
・面接で伝えやすい強みを必ず含める
・深度・解像度に必ず触れる
・最後に次の行動を1〜3個提示する
・600〜800字程度`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CFG.openaiKey}`,
      },
      body: JSON.stringify({
        model: CFG.openaiModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
      }),
    })
    const json = await res.json()
    return json.choices?.[0]?.message?.content ?? null
  } catch (e) {
    console.warn('[api] OpenAI failed:', e)
    return null
  }
}
