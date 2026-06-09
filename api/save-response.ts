import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  if (!webhookUrl) {
    console.log('保存スキップ: GOOGLE_SHEETS_WEBHOOK_URL not set')
    return res.status(200).json({ ok: true, skipped: true })
  }

  try {
    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    })
    if (!webhookRes.ok) {
      console.error('Sheets webhook error:', webhookRes.status)
    }
    return res.status(200).json({ ok: true })
  } catch (err) {
    // Never block the UI — always return ok
    console.error('save-response error:', err)
    return res.status(200).json({ ok: true, error: true })
  }
}
