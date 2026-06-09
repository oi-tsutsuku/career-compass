import type { Scores, BasicInfo, FreeText } from '../types'

export interface ReportPayload {
  grade: string
  status: string
  scores: Scores
  freeText: FreeText
  answerTendency?: string
}

export interface SavePayload {
  submitted_at: string
  grade: string
  job_hunting_status: string
  university: string
  faculty: string
  consent_research_use: boolean
  light_answers: string
  detail_answers: string
  free_text_growth: string
  free_text_concern: string
  free_text_interview: string
  self_understanding_score: number
  social_exploration_score: number
  action_score: number
  decision_score: number
  resolution_depth_score: number
  recommended_next_axis: string
  generated_report_text: string
}

export function buildSavePayload(
  basicInfo: BasicInfo,
  consentResearch: boolean,
  lightAnswers: number[],
  detailAnswers: (number | null)[],
  freeText: FreeText,
  scores: Scores,
  recommendedNextAxis: string,
  report: string,
): SavePayload {
  return {
    submitted_at: new Date().toISOString(),
    grade: basicInfo.grade,
    job_hunting_status: basicInfo.status,
    university: '',
    faculty: '',
    consent_research_use: consentResearch,
    light_answers: lightAnswers.join(','),
    detail_answers: detailAnswers.map(a => a ?? '').join(','),
    free_text_growth: freeText.growth,
    free_text_concern: freeText.concern,
    free_text_interview: freeText.interview,
    self_understanding_score: scores.self,
    social_exploration_score: scores.social,
    action_score: scores.action,
    decision_score: scores.decision,
    resolution_depth_score: scores.depth,
    recommended_next_axis: recommendedNextAxis,
    generated_report_text: report,
  }
}

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

const DEMO_REPORT = `①現在地の解釈
あなたは現在、自分の内側に向き合う力を持ちながらも、経験を言葉にする「深度・解像度」をさらに高めていける段階にいます。焦らず、自分のペースで整理していきましょう。

②根拠
スコアの構成から、経験の蓄積よりも「その経験をどう語るか」の精度を上げることが次の一歩と読み取れます。自由記述に書いてくれた内容には、すでに面接で使えるエピソードの素材が含まれています。

③面接で語れそうな材料
日常のなかで感じた小さな変化や気づきは、「自己認識力」として面接で話せる可能性があります。「なぜそう感じたか」まで掘り下げることで、あなただけの言葉が生まれます。

④推奨行動
この1ヶ月で試してほしいこと：①最も印象に残った経験を1つ選び「状況→行動→結果→感じたこと→学び」の順で書き出す。②社会探索として、OB・OG訪問を1件設定し、業界の実態を自分の言葉で説明できるようにする。

⑤学年との比較
同学年の学生と比べると、自己理解の基盤はしっかりしています。あとは「社会との接点」を意識的に増やすことで、スコア全体のバランスが一段上がります。`
