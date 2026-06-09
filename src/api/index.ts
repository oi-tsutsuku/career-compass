import type { Scores, BasicInfo } from '../types'

// ── Config ────────────────────────────────────────────────────────
// Production: set via Vercel environment variables
// .env.local: VITE_OPENAI_KEY=sk-xxx  VITE_SHEETS_URL=https://...
export const CFG = {
  sheetsUrl:   import.meta.env.VITE_SHEETS_URL   || '',
  openaiKey:   import.meta.env.VITE_OPENAI_KEY   || '',
  openaiModel: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
  // demoMode = true when no API key is present
  get demoMode() { return !this.openaiKey },
}

// ── Google Sheets ─────────────────────────────────────────────────
export async function submitToSheets(data: Record<string, unknown>): Promise<void> {
  if (!CFG.sheetsUrl) return
  try {
    await fetch(CFG.sheetsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch {
    // silently fail — data saving is optional
  }
}

// ── OpenAI ────────────────────────────────────────────────────────
const DEMO_REPORT = `
あなたの診断結果を拝見しました。

5つの軸のなかで、特に「深度・解像度」に注目してみてください。
就活において「何をしたか」より「何を感じ、何を学んだか」を語れる力は、
面接官の印象に強く残ります。

あなたの経験を振り返るとき、「なぜそう感じたのか」まで掘り下げることを
意識してみてください。そこから、自分だけの言葉が生まれてきます。

次の一歩として、最も印象に残っている経験を1つ選び、
「状況 → 行動 → 結果 → 感じたこと → 学び」の順で書き出してみることをおすすめします。
`.trim()

export async function generateOpenAIReport(
  scores: Scores,
  basicInfo: BasicInfo,
): Promise<string> {
  if (CFG.demoMode) {
    await new Promise((r) => setTimeout(r, 1200)) // simulate latency
    return DEMO_REPORT
  }

  const prompt = `
あなたはキャリア支援の専門家です。以下の就活診断結果をもとに、大学生に向けた個別フィードバックを日本語で書いてください。

【基本情報】
学年: ${basicInfo.grade}
就活状況: ${basicInfo.status}
地域: ${basicInfo.area}

【5軸スコア（0〜100）】
自己理解: ${scores.self}
社会探索: ${scores.social}
行動性: ${scores.action}
意思決定: ${scores.decision}
深度・解像度: ${scores.depth}

【フィードバックの方針】
- 「深度・解像度」を最も重要な軸として扱い、その意味と伸ばし方を中心に述べる
- 断定的な表現は避け、「〜の可能性があります」「〜かもしれません」などの表現を使う
- 個人を特定する情報は含めない
- 200〜300字程度で、温かく具体的に
`.trim()

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CFG.openaiKey}`,
    },
    body: JSON.stringify({
      model: CFG.openaiModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.7,
    }),
  })

  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`)
  const json = await res.json() as { choices: { message: { content: string } }[] }
  return json.choices[0]?.message?.content?.trim() ?? DEMO_REPORT
}
