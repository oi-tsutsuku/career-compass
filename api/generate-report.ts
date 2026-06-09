import type { VercelRequest, VercelResponse } from '@vercel/node'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Scores {
  self: number
  social: number
  action: number
  decision: number
  depth: number
}

interface FreeText {
  growth: string
  concern: string
  interview: string
}

interface ReportPayload {
  grade: string
  status: string
  scores: Scores
  freeText: FreeText
  answerTendency?: string
}

type Mode = '広げる' | '深める' | '動く' | '決める'

interface StrategyResult {
  axis: string
  axisLabel: string
  mode: Mode
  reason: string
}

// ─── Grade → number ───────────────────────────────────────────────────────────

function gradeToNum(grade: string): number {
  const map: Record<string, number> = {
    '大学1年生': 1, '大学2年生': 2, '大学3年生': 3, '大学4年生': 4,
    '修士1年生': 5, '修士2年生': 6,
  }
  return map[grade] ?? 3
}

// ─── Strategy: determines mode + axis + reason ────────────────────────────────
//
// Priority (first match wins):
//  1. 1〜2年生 + social < 60          → 広げる (社会探索)
//  2. self >= 65 + social < 55        → 広げる (自己分析済み、外へ)
//  3. depth >= 65 + social < 55       → 広げる (深掘りより選択肢を)
//  4. action >= 65 + depth < 55       → 深める (動きっぱなし→振り返りを)
//  5. grade >= 3 + social >= 55 + depth < 55 → 深める (探索済み→言語化を)
//  6. self + social + depth >= 55 + decision < 55 → 決める
//  7. self + social + depth >= 55 + action < 55  → 動く
//  8. default: weakest axis

function recommendStrategy(scores: Scores, gradeNum: number): StrategyResult {
  const { self: s, social: e, action: a, decision: d, depth: dep } = scores
  const isEarly = gradeNum <= 2
  const isLate  = gradeNum >= 3

  const AXIS_LABELS: Record<string, string> = {
    self: '自己理解', social: '社会探索', action: '行動性',
    decision: '意思決定', depth: '深度・解像度',
  }

  if (isEarly && e < 60) return {
    axis: 'social', axisLabel: AXIS_LABELS['social'], mode: '広げる',
    reason: `${gradeNum <= 2 ? '1〜2年生' : '学年'}の今は自己分析より先に社会探索を広げる時期。業界・職種・OB訪問など外の世界に触れることで、自己理解もより具体的になる。`,
  }

  if (s >= 65 && e < 55) return {
    axis: 'social', axisLabel: AXIS_LABELS['social'], mode: '広げる',
    reason: '自己理解は十分できている。次は外の世界（業界・職種・人）と照らし合わせることが必要。自己分析をさらに深めても、比較対象がなければ選択肢は広がらない。',
  }

  if (dep >= 65 && e < 55) return {
    axis: 'social', axisLabel: AXIS_LABELS['social'], mode: '広げる',
    reason: '深度は高いが社会探索が不足している。深掘りをさらに続けるより選択肢を増やすことで、今の深度が活きるようになる。',
  }

  if (a >= 65 && dep < 55) return {
    axis: 'depth', axisLabel: AXIS_LABELS['depth'], mode: '深める',
    reason: '行動量はあるが経験の言語化・意味づけが追いついていない。動き続けるより一度立ち止まって「その経験から何を学んだか」を言葉にすることで、面接での語りが根本から変わる。',
  }

  if (isLate && e >= 55 && dep < 55) return {
    axis: 'depth', axisLabel: AXIS_LABELS['depth'], mode: '深める',
    reason: '社会探索は進んでいる。3年生以降は「何をしたか」より「なぜそれを選んだか・何を学んだか」を語れる深度が問われる段階。',
  }

  if (s >= 55 && e >= 55 && dep >= 55 && d < 55) return {
    axis: 'decision', axisLabel: AXIS_LABELS['decision'], mode: '決める',
    reason: '情報は十分に揃っている。今足りないのは比較基準。「どう選ぶか」の軸を1つ決めることで、情報収集が目的化するループから抜け出せる。',
  }

  if (s >= 55 && e >= 55 && dep >= 55 && a < 55) return {
    axis: 'action', axisLabel: AXIS_LABELS['action'], mode: '動く',
    reason: '理解・探索・言語化は揃っている。あとは実際に動いてフィードバックを得ることで、確信と修正の両方が生まれる。',
  }

  // Default: weakest axis
  const candidates = [
    { axis: 'social',   score: e,   axisLabel: AXIS_LABELS['social'],   mode: '広げる' as Mode, reason: '業界・職種・人への接点を増やすことで、自分に合う選択肢が見えてくる。' },
    { axis: 'depth',    score: dep, axisLabel: AXIS_LABELS['depth'],    mode: '深める' as Mode, reason: '経験を言語化する力を高めることが、面接での説得力に直結する。' },
    { axis: 'action',   score: a,   axisLabel: AXIS_LABELS['action'],   mode: '動く'   as Mode, reason: '考えるより動いてみることで、自分の反応や向き不向きが分かる。' },
    { axis: 'decision', score: d,   axisLabel: AXIS_LABELS['decision'], mode: '決める' as Mode, reason: '選択基準を1つ決めることで、情報収集が目的化しなくなる。' },
    { axis: 'self',     score: s,   axisLabel: AXIS_LABELS['self'],     mode: '深める' as Mode, reason: '自分の価値観や動機をもう一段掘り下げることが、一貫した軸の形成につながる。' },
  ]
  const weakest = candidates.reduce((min, x) => x.score < min.score ? x : min)
  return weakest
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(payload: ReportPayload, strategy: StrategyResult): string {
  const { grade, status, scores, freeText, answerTendency } = payload
  const { self: s, social: e, action: a, decision: d, depth: dep } = scores
  const { mode, axisLabel, reason: strategyReason } = strategy

  const hasFreeText = freeText.growth.trim() || freeText.concern.trim() || freeText.interview.trim()

  const freeTextBlock = hasFreeText
    ? `## 自由記述（本人の言葉 — 必ず具体的に引用すること）
- 最近成長したと思った経験: 「${freeText.growth || '（未記入）'}」
- 就活で引っかかっていること: 「${freeText.concern || '（未記入）'}」
- うまく言語化できていない経験: 「${freeText.interview || '（未記入）'}」`
    : ''

  return `あなたはキャリア支援の専門家です。以下の就活診断データをもとに、この大学生に向けた個別フィードバックを日本語で書いてください。

## 受診者情報
- 学年: ${grade}
- 就活状況: ${status}

## 5軸スコア（各0〜100）
- 自己理解: ${s}
- 社会探索: ${e}
- 行動性: ${a}
- 意思決定: ${d}
- 深度・解像度: ${dep}

${answerTendency ? `## 回答傾向\n${answerTendency}\n` : ''}
${freeTextBlock}

## 今回の推奨モード（事前に計算済み — これをそのまま使うこと）
- モード: **${mode}**（${axisLabel}を優先）
- 判断根拠: ${strategyReason}

---

## 出力形式（必ずこの5節構成で、各節冒頭に番号を付けること）

①現在地の解釈
スコアの組み合わせから、この人の今の状態を2〜3文で説明する。
断定は避け、「〜の段階にある」「〜が見て取れる」などの表現を使う。
スコアをただ読み上げるだけの文は禁止。

②根拠
なぜその解釈になるかを、スコアの組み合わせと自由記述から説明する。
自由記述がある場合は、本人の言葉を「」で具体的に引用すること（要約不可）。
「〜という言葉から」「〜と書いてくれたことから」のように、本人の声を起点に展開する。
自由記述が未記入の場合はスコアの構造から根拠を導く。

③面接で語れそうな材料
以下のルールを厳守すること：
- 「〜という経験は、○○として面接で話せる可能性があります」の形式を基本とする
- 自由記述がある場合は、そこに書かれた具体的な経験を言い換える。自由記述がない場合はスコアから推測する
- 「自己分析力」「総合力」「適応力」「コミュニケーション能力」「論理的思考力」「問題解決力」などの汎用表現は一切使用禁止
- 強みの名前ではなく、「どんな場面でどう動いたか」に近い具体的な表現にすること
- 例: 「うまく説明できていないと書いてくれた〜という経験は、自分なりの視点で状況を解釈し直す力として面接で話せる可能性があります」

④推奨行動（モード: ${mode}）
今すぐ実行できる具体的な行動を1〜2つ提案する。
この人の推奨モードは「${mode}」（${axisLabel}）であり、以下の理由による：${strategyReason}
行動は「〜してみる」「〜を1つ決める」など実行可能な粒度にすること。
「自己分析を深める」「業界研究をする」のような抽象指示は禁止。

⑤学年との比較
${grade}の学生の一般的な傾向と比べて、この人の現在地を文脈化する。
「同学年と比べると〜」「この時期に〜ができているのは〜」のように相対化する。

---

## 制約
- 全体700〜1000字（節番号・見出しを除く本文のみカウント）
- ①〜⑤の節番号は必ず冒頭に付ける
- 各節の最初の行は、節の内容を示す短い見出しにしてよい（例: 「①現在地の解釈」→「①現在地の解釈」）
- テンプレート感が出ないよう、自由記述の内容によって文章構造を変えること
- スコアを数字で列挙するだけの文は禁止
- 自由記述がある場合はそれを最優先で活用する`
}

// ─── Demo fallback ─────────────────────────────────────────────────────────────

const DEMO_REPORT = `①現在地の解釈
あなたは現在、自分の内側に向き合う力を持ちながらも、経験を言葉にする「深度・解像度」をさらに高めていける段階にいます。焦らず、自分のペースで整理していきましょう。

②根拠
スコアの構成から、経験の蓄積よりも「その経験をどう語るか」の精度を上げることが次の一歩と読み取れます。自由記述に書いてくれた内容には、すでに面接で使えるエピソードの素材が含まれています。

③面接で語れそうな材料
日常のなかで感じた小さな変化や気づきは、面接で「どう状況を見立て、どう動いたか」という話に変換できる可能性があります。「なぜそう感じたか」まで掘り下げることで、あなただけの言葉が生まれます。

④推奨行動（モード: 深める）
この1ヶ月で試してほしいこと：①最も印象に残った経験を1つ選び「状況→行動→結果→感じたこと→学び」の順で書き出す。②書き出した内容を誰かに口頭で話してみて、どこで詰まるかを確認する。

⑤学年との比較
同学年の学生と比べると、自己理解の基盤はしっかりしています。あとは「社会との接点」を意識的に増やすことで、スコア全体のバランスが一段上がります。`

// ─── Handler ──────────────────────────────────────────────────────────────────

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

  const gradeNum = gradeToNum(payload.grade)
  const strategy = recommendStrategy(payload.scores, gradeNum)

  try {
    const prompt = buildPrompt(payload, strategy)
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
        max_tokens: 1400,
        temperature: 0.75,
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
    return res.status(200).json({ report, mode: strategy.mode, axis: strategy.axis })
  } catch (err) {
    console.error('generate-report error:', err)
    return res.status(200).json({ report: DEMO_REPORT })
  }
}
