import type { VercelRequest, VercelResponse } from '@vercel/node'

const TEST_DATA = {
  submitted_at: new Date().toISOString(),
  grade: '大学3年生',
  status: 'まだ就活を始めていない',
  university: '',
  faculty: '',
  consent_research_use: true,
  self_score: 72,
  social_score: 54,
  action_score: 60,
  decision_score: 48,
  depth_score: 65,
  total_score: 60,
  recommended_mode: '広げる',
  recommended_axis: 'social',
  experience_tags: '接客,後輩指導,新人教育',
  custom_experiences: '',
  free_text_growth: 'テストデータ: 新人教育を担当したとき、うまく教えられなかった反省から言葉の選び方を意識するようになった。',
  free_text_concern: 'テストデータ: 自分が何をしたいのかまだはっきりしていない。',
  free_text_interview: 'テストデータ: 接客で対応が難しいお客さんへの対応をうまく言語化できていない。',
  generated_report_text: 'テスト送信のため省略',
  detail_completed: true,
  light_answers: '3,4,2,5,3,4,3,4,2,3,4,3,2,4,3,4,3,4,2,3',
  detail_answers: '1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  if (!webhookUrl) {
    return res.status(200).json({
      success: false,
      error: 'GOOGLE_SHEETS_WEBHOOK_URL is not set',
    })
  }

  try {
    const testData = { ...TEST_DATA, submitted_at: new Date().toISOString() }
    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    })

    if (webhookRes.ok) {
      return res.status(200).json({ success: true, message: 'テストデータをGoogle Sheetsに送信しました', data: testData })
    } else {
      const text = await webhookRes.text()
      return res.status(200).json({ success: false, error: `webhook ${webhookRes.status}: ${text}` })
    }
  } catch (err) {
    return res.status(200).json({ success: false, error: String(err) })
  }
}
