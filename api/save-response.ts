import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  if (!webhookUrl) {
    console.log('[save-response] 保存スキップ: GOOGLE_SHEETS_WEBHOOK_URL not set')
    return res.status(200).json({ success: true, skipped: true })
  }

  try {
    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    })
    if (webhookRes.ok) {
      console.log('[save-response] 保存成功')
      return res.status(200).json({ success: true })
    } else {
      const text = await webhookRes.text()
      console.error('[save-response] 保存失敗:', webhookRes.status, text)
      return res.status(200).json({ success: false, error: `webhook ${webhookRes.status}` })
    }
  } catch (err) {
    // Never block the UI
    console.error('[save-response] 保存失敗 (例外):', err)
    return res.status(200).json({ success: false, error: String(err) })
  }
}
