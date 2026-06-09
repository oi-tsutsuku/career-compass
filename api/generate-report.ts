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
  experienceTags: string[]
  customExperiences: string[]
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

// ─── Strategy ─────────────────────────────────────────────────────────────────

function recommendStrategy(scores: Scores, gradeNum: number): StrategyResult {
  const { self: s, social: e, action: a, decision: d, depth: dep } = scores
  const isEarly = gradeNum <= 2
  const isLate  = gradeNum >= 3

  const LABELS: Record<string, string> = {
    self: '自己理解', social: '社会探索', action: '行動性',
    decision: '意思決定', depth: '深度・解像度',
  }

  if (isEarly && e < 60) return {
    axis: 'social', axisLabel: LABELS.social, mode: '広げる',
    reason: `${gradeNum <= 2 ? '1〜2年生' : '学年'}の今は自己分析より先に社会探索を広げる時期。業界・職種・OB訪問など外の世界に触れることで、自己理解もより具体的になる。`,
  }
  if (s >= 65 && e < 55) return {
    axis: 'social', axisLabel: LABELS.social, mode: '広げる',
    reason: '自己理解は十分できている。次は外の世界（業界・職種・人）と照らし合わせることが必要。自己分析をさらに深めても、比較対象がなければ選択肢は広がらない。',
  }
  if (dep >= 65 && e < 55) return {
    axis: 'social', axisLabel: LABELS.social, mode: '広げる',
    reason: '深度は高いが社会探索が不足している。深掘りをさらに続けるより選択肢を増やすことで、今の深度が活きるようになる。',
  }
  if (a >= 65 && dep < 55) return {
    axis: 'depth', axisLabel: LABELS.depth, mode: '深める',
    reason: '行動量はあるが経験の言語化・意味づけが追いついていない。動き続けるより一度立ち止まって「その経験から何を学んだか」を言葉にすることで、面接での語りが根本から変わる。',
  }
  if (isLate && e >= 55 && dep < 55) return {
    axis: 'depth', axisLabel: LABELS.depth, mode: '深める',
    reason: '社会探索は進んでいる。3年生以降は「何をしたか」より「なぜそれを選んだか・何を学んだか」を語れる深度が問われる段階。',
  }
  if (s >= 55 && e >= 55 && dep >= 55 && d < 55) return {
    axis: 'decision', axisLabel: LABELS.decision, mode: '決める',
    reason: '情報は十分に揃っている。今足りないのは比較基準。「どう選ぶか」の軸を1つ決めることで、情報収集が目的化するループから抜け出せる。',
  }
  if (s >= 55 && e >= 55 && dep >= 55 && a < 55) return {
    axis: 'action', axisLabel: LABELS.action, mode: '動く',
    reason: '理解・探索・言語化は揃っている。あとは実際に動いてフィードバックを得ることで、確信と修正の両方が生まれる。',
  }

  const candidates = [
    { axis: 'social',   score: e,   axisLabel: LABELS.social,   mode: '広げる' as Mode, reason: '業界・職種・人への接点を増やすことで、自分に合う選択肢が見えてくる。' },
    { axis: 'depth',    score: dep, axisLabel: LABELS.depth,    mode: '深める' as Mode, reason: '経験を言語化する力を高めることが、面接での説得力に直結する。' },
    { axis: 'action',   score: a,   axisLabel: LABELS.action,   mode: '動く'   as Mode, reason: '考えるより動いてみることで、自分の反応や向き不向きが分かる。' },
    { axis: 'decision', score: d,   axisLabel: LABELS.decision, mode: '決める' as Mode, reason: '選択基準を1つ決めることで、情報収集が目的化しなくなる。' },
    { axis: 'self',     score: s,   axisLabel: LABELS.self,     mode: '深める' as Mode, reason: '自分の価値観や動機をもう一段掘り下げることが、一貫した軸の形成につながる。' },
  ]
  return candidates.reduce((min, x) => x.score < min.score ? x : min)
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

const BANNED_WORDS = [
  'コミュニケーション能力', '協調性', '主体性', '継続力', '総合力',
  '適応力', '自己分析力', '問題解決力', '論理的思考力', 'リーダーシップ',
  'チャレンジ精神', '責任感', '行動力',
]

function buildPrompt(payload: ReportPayload, strategy: StrategyResult): string {
  const { grade, status, scores, freeText, experienceTags, customExperiences, answerTendency } = payload
  const { self: s, social: e, action: a, decision: d, depth: dep } = scores
  const { mode, axisLabel, reason: stratReason } = strategy

  const hasFreeText = freeText.growth.trim() || freeText.concern.trim() || freeText.interview.trim()
  const hasExperience = experienceTags.length > 0 || customExperiences.length > 0

  const freeTextBlock = hasFreeText
    ? `## 自由記述（本人の言葉 — 必ず「」で具体的に引用すること。要約・言い換え不可）
- 最近成長したと思った経験: 「${freeText.growth || '（未記入）'}」
- 就活で引っかかっていること: 「${freeText.concern || '（未記入）'}」
- うまく言語化できていない経験: 「${freeText.interview || '（未記入）'}」`
    : ''

  const expBlock = hasExperience
    ? `## 経験タグ（本人が選択）
${experienceTags.length > 0 ? experienceTags.join('、') : '（未選択）'}

## その他自由入力経験
${customExperiences.length > 0 ? customExperiences.join('、') : '（なし）'}`
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

${expBlock}

## 今回の推奨モード（事前計算済み — そのまま使うこと）
- モード: **${mode}**（${axisLabel}を優先）
- 判断根拠: ${stratReason}

---

## 出力形式（必ずこの5節構成。各冒頭に①〜⑤を付ける）

①現在地の解釈
スコアの組み合わせから、この人の今の状態を2〜3文で説明する。
断定は避け「〜の段階にある」「〜が見て取れる」などの表現を使う。
スコアをただ列挙するだけの文章は禁止。

②根拠
なぜその解釈になるかを、スコアと自由記述・経験タグから説明する。
自由記述がある場合は本人の言葉を「」で引用すること（要約不可）。
「〜という言葉から」「〜と書いてくれたことから」のように本人の声を起点に展開する。

③面接で語れそうな経験テーマ
【重要】以下のルールを厳守する：

（A）経験テーマを3つ出す。各テーマは以下の形式：
【テーマN】〈経験の本質を表す15〜25字の具体的フレーズ〉
なぜ語れるのか：〈選んだ経験タグ・自由記述・スコアを根拠に説明〉
面接での使い方：〈「○○があります」ではなく「〜という場面で〜した」という形で話す方法〉

（B）禁止ワード（以下を経験テーマ・強み名として単独使用しないこと）：
${BANNED_WORDS.join('、')}

（C）テーマのフレーズは必ず「〜した経験」「〜を乗り越えた場面」「〜を変えた取り組み」など
経験の動詞・場面を含む形にする。

（D）自由記述がある場合はそこに書かれた具体的経験を変換する。
経験タグがある場合はタグに紐づけて語れる場面を想定する。
どちらもない場合はスコア構造から推定する。

（E）「面接での使い方」では必ず、禁止ワードを使った表現の例を示した上で、
それに代わる具体的な話し方を提案する。

④推奨行動（モード: ${mode}）
今すぐ実行できる具体的な行動を1〜2つ。
推奨モードは「${mode}」（${axisLabel}）。根拠: ${stratReason}
行動は「〜してみる」「〜を1つ決める」などの実行可能な粒度にする。
「自己分析を深める」「業界研究をする」のような抽象指示は禁止。

⑤学年との比較
${grade}の学生の一般的な傾向と比べて、この人の現在地を文脈化する。
「同学年と比べると〜」「この時期に〜できているのは〜」のように相対化する。

---

## 制約
- ①〜⑤の節番号は必ず冒頭に付ける
- 全体で1000〜1300字程度（③の3テーマを含む）
- テンプレート感が出ないよう、自由記述・経験タグの内容によって文章構造を変える
- 自由記述がある場合はそれを最優先で活用する
- 経験タグがある場合はタグを必ず③に反映させる
- スコアを数字で列挙するだけの文は禁止`
}

// ─── Demo fallback ─────────────────────────────────────────────────────────────

const DEMO_REPORT = `①現在地の解釈
あなたは現在、自分の内側に向き合う力を持ちながらも、経験を言葉にする「深度・解像度」をさらに高めていける段階にいます。

②根拠
スコアの構成から、経験の蓄積よりも「その経験をどう語るか」の精度を上げることが次の一歩と読み取れます。

③面接で語れそうな経験テーマ

【テーマ1】状況を自分なりに読み、動き方を変えた経験
なぜ語れるのか：日常の中での判断や工夫の積み重ねが「自分はどう考え、どう動いたか」という話に変換できます。
面接での使い方：「主体性があります」ではなく、「こういう状況で、自分はこう判断してこう動いた」という具体的な場面を話すと伝わりやすくなります。

【テーマ2】誰かの困りごとに気づいて動いた経験
なぜ語れるのか：人との関わりの中で、相手の状況を見て動いた経験は「相手の立場に立てる人」として伝わります。
面接での使い方：「協調性があります」ではなく、「この人が困っていると気づいて、自分はこうした」という経緯を話す形にすると具体性が出ます。

【テーマ3】続けるかやめるか迷って、それでも続けた経験
なぜ語れるのか：継続してきたことには必ず「やめたくなった瞬間」があります。そこをどう乗り越えたかが、面接で差がつく話になります。
面接での使い方：「継続力があります」ではなく、「〜という状況で迷ったが、こう考えて続けた」という場面を話すと伝わりやすくなります。

④推奨行動（モード: 深める）
この1ヶ月で試してほしいこと：①最も印象に残った経験を1つ選び「状況→行動→結果→感じたこと→学び」の順で書き出す。②その内容を誰かに口頭で話してみて、どこで詰まるかを確認する。

⑤学年との比較
同学年の学生と比べると、自己理解の基盤はしっかりしています。あとは「社会との接点」を意識的に増やすことで、スコア全体のバランスが一段上がります。`

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return res.status(200).json({ report: DEMO_REPORT })

  const payload = req.body as ReportPayload
  if (!payload?.scores || !payload?.grade) return res.status(400).json({ error: 'Invalid payload' })

  const gradeNum = gradeToNum(payload.grade)
  const strategy = recommendStrategy(payload.scores, gradeNum)

  try {
    const prompt = buildPrompt(payload, strategy)
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1800,
        temperature: 0.75,
      }),
    })

    if (!openaiRes.ok) {
      console.error('OpenAI error:', openaiRes.status, await openaiRes.text())
      return res.status(200).json({ report: DEMO_REPORT })
    }

    const json = await openaiRes.json() as { choices: { message: { content: string } }[] }
    const report = json.choices[0]?.message?.content?.trim() ?? DEMO_REPORT
    return res.status(200).json({ report, mode: strategy.mode, axis: strategy.axis })
  } catch (err) {
    console.error('generate-report error:', err)
    return res.status(200).json({ report: DEMO_REPORT })
  }
}
