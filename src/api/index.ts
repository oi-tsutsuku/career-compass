import type { Scores, BasicInfo, FreeText } from '../types'

export interface ReportPayload {
  grade: string
  status: string
  scores: Scores
  freeText: FreeText
  experienceTags: string[]
  customExperiences: string[]
  answerTendency?: string
}

export interface SavePayload {
  submitted_at: string
  grade: string
  status: string
  university: string
  faculty: string
  consent_research_use: boolean
  // Scores
  self_score: number
  social_score: number
  action_score: number
  decision_score: number
  depth_score: number
  total_score: number
  // Strategy
  recommended_mode: string
  recommended_axis: string
  // Experience
  experience_tags: string
  custom_experiences: string
  // Free text
  free_text_growth: string
  free_text_concern: string
  free_text_interview: string
  // Output
  generated_report_text: string
  // Optional metadata
  detail_completed: boolean
  // Legacy compatibility
  light_answers: string
  detail_answers: string
}

export function buildSavePayload(
  basicInfo: BasicInfo,
  consentResearch: boolean,
  lightAnswers: number[],
  detailAnswers: (number | null)[],
  freeText: FreeText,
  experienceTags: string[],
  customExperiences: string[],
  scores: Scores,
  recommendedAxis: string,
  recommendedMode: string,
  report: string,
): SavePayload {
  const total = Math.round(
    (scores.self + scores.social + scores.action + scores.decision + scores.depth) / 5
  )
  return {
    submitted_at: new Date().toISOString(),
    grade: basicInfo.grade,
    status: basicInfo.status,
    university: '',
    faculty: '',
    consent_research_use: consentResearch,
    self_score: scores.self,
    social_score: scores.social,
    action_score: scores.action,
    decision_score: scores.decision,
    depth_score: scores.depth,
    total_score: total,
    recommended_mode: recommendedMode,
    recommended_axis: recommendedAxis,
    experience_tags: experienceTags.join(','),
    custom_experiences: customExperiences.join(','),
    free_text_growth: freeText.growth,
    free_text_concern: freeText.concern,
    free_text_interview: freeText.interview,
    generated_report_text: report,
    detail_completed: true,
    light_answers: lightAnswers.join(','),
    detail_answers: detailAnswers.map(a => a ?? '').join(','),
  }
}

// ─── Demo fallback ─────────────────────────────────────────────────────────────

const DEMO_REPORT = `①現在地の解釈
あなたは現在、自分の内側に向き合う力を持ちながらも、経験を言葉にする「深度・解像度」をさらに高めていける段階にいます。

②根拠
スコアの構成から、経験の蓄積よりも「その経験をどう語るか」の精度を上げることが次の一歩と読み取れます。

③面接で語れそうな経験テーマ

【テーマ1】自分なりに状況を読み、動いた経験
なぜ語れるのか：日常の中での関わりや工夫の積み重ねが、面接での「どう考え、どう動いたか」という話に変換できる可能性があります。
面接での使い方：「主体性があります」ではなく、「こういう状況で、自分はこう判断してこう動いた」という具体的な場面を話すと伝わりやすくなります。

【テーマ2】誰かの役に立った・支えた経験
なぜ語れるのか：人との関わりの中で、相手の状況を見て動いた経験は「相手の立場に立てる人」として伝わる素材になります。
面接での使い方：「協調性があります」ではなく、「この人が困っていると気づいて、自分はこうした」という経緯を話す形にすると具体性が出ます。

【テーマ3】続けてきた・やり切った経験
なぜ語れるのか：継続してきたことには必ず「やめたくなった瞬間」があります。そこをどう乗り越えたかが、面接で差がつく話になります。
面接での使い方：「継続力があります」ではなく、「〜という状況で迷ったが、こう考えて続けた」という場面を話すと伝わりやすくなります。

④推奨行動（モード: 深める）
この1ヶ月で試してほしいこと：①最も印象に残った経験を1つ選び「状況→行動→結果→感じたこと→学び」の順で書き出す。②その内容を誰かに口頭で話してみて、どこで詰まるかを確認する。

⑤学年との比較
同学年の学生と比べると、自己理解の基盤はしっかりしています。あとは「社会との接点」を意識的に増やすことで、スコア全体のバランスが一段上がります。`

// ─── API calls ────────────────────────────────────────────────────────────────

export async function generateReport(payload: ReportPayload): Promise<string> {
  try {
    const res = await fetch('/api/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`generate-report ${res.status}`)
    const data = await res.json() as { report?: string }
    return data.report ?? DEMO_REPORT
  } catch {
    return DEMO_REPORT
  }
}

export async function saveResponse(data: SavePayload): Promise<void> {
  try {
    await fetch('/api/save-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch {
    console.log('保存スキップ')
  }
}
