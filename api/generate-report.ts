import type { VercelRequest, VercelResponse } from '@vercel/node'

const DEMO_REPORT = `【現在地の解釈】
あなたは現在、自分の内側に向き合う力を持ちながらも、それを言語化する「深度・解像度」をさらに高めていける段階にいます。

【根拠】
スコアの構成から、経験の蓄積よりも「その経験をどう語るか」の精度を上げることが次の一歩と読み取れます。自由記述に書いてくれた内容には、すでに面接で使えるエピソードの素材が含まれています。

【面接で語れそうな材料】
日常のなかで感じた小さな変化や気づきは、「自己認識力」として面接で話せる可能性があります。「なぜそう感じたか」まで掘り下げることで、あなただけの言葉が生まれます。

【推奨行動】
この1ヶ月で試してほしいこと：①最も印象に残った経験を1つ選び「状況→行動→結果→感じたこと→学び」の順で書き出す。②OB・OG訪問を1件設定し、業界の実態を自分の言葉で説明できるようにする。

【学年との比較】
同学年の学生と比べると、自己理解の基盤はしっかりしています。あとは「社会との接点」を増やすことで、スコア全体のバランスが一段上がります。`

interface ReportPayload {
  grade: string
  status: string
  scores: {
    self: number
    social: number
    action: number
    decision: number
    depth: number
  }
  freeText: {
    growth: string
    concern: string
    interview: string
  }
  answerTendency?: string
}

function buildPrompt(payload: ReportPayload): string {
  const { grade, status, scores, freeText, answerTendency } = payload
  const { self: s, social: e, action: a, decision: d, depth: dep } = scores

  const axisNames: Record<string, string> = {
    self: '自己理解',
    social: '社会探索',
    action: '行動性',
    decision: '意思決定',
    depth: '深度・解像度',
  }

  // Find the recommended next axis (lowest score excluding depth if depth<55)
  let recAxis = 'depth'
  if (dep >= 55) {
    const others = [
      { k: 'self', v: s },
      { k: 'social', v: e },
      { k: 'action', v: a },
      { k: 'decision', v: d },
    ]
    recAxis = others.reduce((min, x) => x.v < min.v ? x : min).k
  }

  const hasFreeText = freeText.growth.trim() || freeText.concern.trim() || freeText.interview.trim()

  return `あなたはキャリア支援の専門家です。以下の就活診断データをもとに、大学生に向けた個別フィードバックを日本語で書いてください。

## 受診者情報
- 学年: ${grade}
- 就活状況: ${status}

## 5軸スコア（各0〜100）
- 自己理解: ${s}
- 社会探索: ${e}
- 行動性: ${a}
- 意思決定: ${d}
- 深度・解像度（最重要軸）: ${dep}

${answerTendency ? `## 回答傾向\n${answerTendency}\n` : ''}
${hasFreeText ? `## 自由記述（本人の言葉 — 必ず引用すること）
- 最近成長したと思った経験: 「${freeText.growth || '（未記入）'}」
- 就活で引っかかっていること: 「${freeText.concern || '（未記入）'}」
- うまく言語化できていない経験: 「${freeText.interview || '（未記入）'}」
` : ''}
## 出力形式（必ずこの5節構成で書くこと）
①現在地の解釈（スコアから現在状態を2〜3文。断定を避けた温かいトーン）
②根拠（スコアの背景と自由記述から理由を説明。自由記述がある場合は本人の言葉を「」で引用すること）
③面接で語れそうな材料（「〜という経験は、○○として面接で話せる可能性があります」の形式で具体的に）
④推奨行動（${axisNames[recAxis]}スコアが${scores[recAxis as keyof typeof scores]}のため、この軸を伸ばす具体的な行動を1ヶ月以内にできる1〜2つ）
⑤学年との比較（${grade}の学生の傾向と比べて、この受診者の現在地を文脈化する）

## 制約
- 全体700〜1000字
- 誰にでも当てはまる一般論は禁止
- スコアの読み上げだけで終わる文章は禁止
- 根拠のない強み診断は禁止
- 自由記述がある場合は最優先で引用し、テンプレート感が出ないよう文章構造を変えること
- 各節の冒頭に①②③④⑤の番号を付ける`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(200).json({ report: DEMO_REPORT })
  }

  const payload = req.body as ReportPayload
  if (!payload?.scores || !payload?.grade) {
    return res.status(400).json({ error: 'Invalid payload' })
  }

  try {
    const prompt = buildPrompt(payload)
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
        temperature: 0.7,
      }),
    })

    if (!openaiRes.ok) {
      console.error('OpenAI error:', openaiRes.status, await openaiRes.text())
      return res.status(200).json({ report: DEMO_REPORT })
    }

    const json = await openaiRes.json() as {
      choices: { message: { content: string } }[]
    }
    const report = json.choices[0]?.message?.content?.trim() ?? DEMO_REPORT
    return res.status(200).json({ report })
  } catch (err) {
    console.error('generate-report error:', err)
    return res.status(200).json({ report: DEMO_REPORT })
  }
}
