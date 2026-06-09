import { useState, useCallback } from 'react'
import type { PatternId, Scores } from '../types'
import { PATTERNS } from '../data/patterns'
import { AXIS_META } from '../data/questions'
import { recommendStrategy, gradeToNum } from '../utils/scoring'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  scores: Scores
  patternId: PatternId
  grade: string
  /** Pass for Report screen to include AI text in copy */
  report?: string
}

type BtnStatus = 'idle' | 'loading' | 'done' | 'error'

// ─── Canvas helpers ───────────────────────────────────────────────────────────

const FONT = "'Hiragino Kaku Gothic Pro', 'Meiryo', 'Yu Gothic', sans-serif"

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

interface CardInput {
  pattern: { name: string; emoji: string; nextSteps: string[] }
  scores: Scores
  mode: string
  axisLabel: string
}

async function buildShareCanvas(input: CardInput): Promise<HTMLCanvasElement> {
  const { pattern, scores, mode, axisLabel } = input

  // Wait for fonts
  if (document.fonts?.ready) await document.fonts.ready

  const DPR = Math.min(window.devicePixelRatio || 1, 2)
  const W = 800
  const AXES = ['depth', 'self', 'social', 'action', 'decision'] as const

  // Estimate height dynamically
  const H = 900
  const canvas = document.createElement('canvas')
  canvas.width = W * DPR
  canvas.height = H * DPR
  const ctx = canvas.getContext('2d')!
  ctx.scale(DPR, DPR)

  // ── Background ─────────────────────────────────────────────────────────────
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, W, H)

  // ── Header band ────────────────────────────────────────────────────────────
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, W, 68)

  ctx.font = `700 17px ${FONT}`
  ctx.fillStyle = '#ffffff'
  ctx.fillText('Career Compass', 40, 42)

  ctx.font = `400 13px ${FONT}`
  ctx.fillStyle = '#94a3b8'
  ctx.textAlign = 'right'
  ctx.fillText('就活現在地レポート', W - 40, 42)
  ctx.textAlign = 'left'

  let y = 68 + 44

  // ── Pattern name ───────────────────────────────────────────────────────────
  ctx.font = `500 42px sans-serif`
  ctx.fillStyle = '#0f172a'
  ctx.fillText(pattern.emoji, 40, y + 30)

  ctx.font = `700 30px ${FONT}`
  ctx.fillStyle = '#0f172a'
  ctx.fillText(pattern.name, 108, y + 28)

  y += 68

  // ── Depth hero ─────────────────────────────────────────────────────────────
  ctx.fillStyle = '#0f172a'
  roundRect(ctx, 40, y, W - 80, 116, 14)
  ctx.fill()

  ctx.font = `500 12px ${FONT}`
  ctx.fillStyle = '#94a3b8'
  ctx.fillText('⭐  深度・解像度スコア', 58, y + 26)

  ctx.font = `900 64px ${FONT}`
  ctx.fillStyle = '#ffffff'
  ctx.fillText(String(scores.depth), 58, y + 94)

  // "/ 100" positioned right of number
  const numW = ctx.measureText(String(scores.depth)).width
  ctx.font = `400 18px ${FONT}`
  ctx.fillStyle = '#64748b'
  ctx.fillText('/ 100', 58 + numW + 10, y + 94)

  y += 136

  // ── Score bars ─────────────────────────────────────────────────────────────
  ctx.font = `700 15px ${FONT}`
  ctx.fillStyle = '#0f172a'
  ctx.fillText('5軸スコア', 40, y)
  y += 20

  const LABEL_W = 128
  const BAR_X = 40 + LABEL_W + 12
  const BAR_MAX = W - BAR_X - 80  // right padding
  const BAR_H = 8
  const ROW = 44

  for (const axis of AXES) {
    const score = scores[axis]
    const meta = AXIS_META[axis]
    const isDepth = axis === 'depth'

    ctx.font = isDepth ? `700 13px ${FONT}` : `400 13px ${FONT}`
    ctx.fillStyle = isDepth ? '#0f172a' : '#64748b'
    ctx.fillText((isDepth ? '⭐  ' : '') + meta.label, 40, y + 18)

    // Bar track
    ctx.fillStyle = '#e2e8f0'
    roundRect(ctx, BAR_X, y + 10, BAR_MAX, BAR_H, 4)
    ctx.fill()

    // Bar fill
    ctx.fillStyle = meta.color
    const fillW = Math.max(BAR_H, BAR_MAX * score / 100)
    roundRect(ctx, BAR_X, y + 10, fillW, BAR_H, 4)
    ctx.fill()

    // Score number
    ctx.font = `700 13px ${FONT}`
    ctx.fillStyle = '#0f172a'
    ctx.textAlign = 'right'
    ctx.fillText(String(score), W - 40, y + 18)
    ctx.textAlign = 'left'

    y += ROW
  }

  y += 16

  // ── Mode chip ──────────────────────────────────────────────────────────────
  const chipText = `▶ 推奨モード: ${mode}（${axisLabel}）`
  ctx.font = `700 13px ${FONT}`
  const chipW = ctx.measureText(chipText).width + 36
  const chipH = 34

  ctx.fillStyle = 'rgba(37,99,235,0.08)'
  roundRect(ctx, 40, y, chipW, chipH, chipH / 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(37,99,235,0.25)'
  ctx.lineWidth = 1.5
  roundRect(ctx, 40, y, chipW, chipH, chipH / 2)
  ctx.stroke()

  ctx.fillStyle = '#2563eb'
  ctx.fillText(chipText, 58, y + 22)

  y += chipH + 16

  // ── Next step preview (first item only) ───────────────────────────────────
  if (pattern.nextSteps.length > 0) {
    ctx.font = `700 13px ${FONT}`
    ctx.fillStyle = '#475569'
    ctx.fillText('次の一歩', 40, y + 14)
    y += 28

    // Truncate to max width
    const MAX_TEXT_W = W - 100
    ctx.font = `400 13px ${FONT}`
    ctx.fillStyle = '#64748b'
    const step = pattern.nextSteps[0]
    let truncated = step
    while (ctx.measureText(truncated + '…').width > MAX_TEXT_W && truncated.length > 0) {
      truncated = truncated.slice(0, -1)
    }
    if (truncated !== step) truncated += '…'

    ctx.fillStyle = '#e2e8f0'
    roundRect(ctx, 40, y, W - 80, 40, 8)
    ctx.fill()

    ctx.fillStyle = '#475569'
    ctx.fillText('1. ' + truncated, 56, y + 24)
    y += 52
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  // Separator line
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(40, H - 52)
  ctx.lineTo(W - 40, H - 52)
  ctx.stroke()

  ctx.font = `400 12px ${FONT}`
  ctx.fillStyle = '#94a3b8'
  ctx.textAlign = 'center'
  ctx.fillText('career-compass.vercel.app', W / 2, H - 24)
  ctx.textAlign = 'left'

  return canvas
}

// ─── Clipboard helper (with iOS fallback) ─────────────────────────────────────

async function copyText(text: string): Promise<void> {
  // Modern API
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  // Legacy fallback (iOS Safari < 13.4)
  const el = document.createElement('textarea')
  el.value = text
  el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0'
  document.body.appendChild(el)
  el.focus()
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}

// ─── Text formatter ───────────────────────────────────────────────────────────

const AXIS_ORDER = ['depth', 'self', 'social', 'action', 'decision'] as const

function buildShareText(
  pattern: { name: string; emoji: string },
  scores: Scores,
  mode: string,
  axisLabel: string,
  report?: string,
): string {
  const lines: string[] = []
  lines.push('━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('Career Compass 診断結果')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('')
  lines.push(`タイプ: ${pattern.emoji} ${pattern.name}`)
  lines.push('')
  lines.push('【5軸スコア】')
  for (const axis of AXIS_ORDER) {
    const meta = AXIS_META[axis]
    const pad = '　'.repeat(Math.max(0, 8 - meta.label.length))
    lines.push(`${axis === 'depth' ? '⭐' : '　'} ${meta.label}${pad} ${scores[axis]}/100`)
  }
  lines.push('')
  lines.push(`推奨モード: ${mode}（${axisLabel}を優先）`)

  if (report) {
    lines.push('')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('個別フィードバック')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('')
    lines.push(report)
  }

  lines.push('')
  lines.push('career-compass.vercel.app')
  return lines.join('\n')
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ShareActions({ scores, patternId, grade, report }: Props) {
  const [imgStatus,  setImgStatus]  = useState<BtnStatus>('idle')
  const [textStatus, setTextStatus] = useState<BtnStatus>('idle')
  const [urlStatus,  setUrlStatus]  = useState<BtnStatus>('idle')

  const pattern  = PATTERNS[patternId]
  const gradeNum = gradeToNum(grade)
  const { axis, mode } = recommendStrategy(scores, gradeNum)
  const axisLabel = AXIS_META[axis].label

  // ── Image save ─────────────────────────────────────────────────────────────
  const handleImageSave = useCallback(async () => {
    setImgStatus('loading')
    try {
      const canvas = await buildShareCanvas({ pattern, scores, mode, axisLabel })
      canvas.toBlob(blob => {
        if (!blob) { setImgStatus('error'); return }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `career-compass-${patternId}.png`
        a.click()
        URL.revokeObjectURL(url)
        setImgStatus('done')
        setTimeout(() => setImgStatus('idle'), 2500)
      }, 'image/png')
    } catch {
      setImgStatus('error')
      setTimeout(() => setImgStatus('idle'), 2500)
    }
  }, [pattern, scores, mode, axisLabel, patternId])

  // ── Text copy ──────────────────────────────────────────────────────────────
  const handleTextCopy = useCallback(async () => {
    setTextStatus('loading')
    try {
      const text = buildShareText(pattern, scores, mode, axisLabel, report)
      await copyText(text)
      setTextStatus('done')
    } catch {
      setTextStatus('error')
    }
    setTimeout(() => setTextStatus('idle'), 2500)
  }, [pattern, scores, mode, axisLabel, report])

  // ── PDF (print) ────────────────────────────────────────────────────────────
  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  // ── URL copy ───────────────────────────────────────────────────────────────
  const handleUrlCopy = useCallback(async () => {
    setUrlStatus('loading')
    try {
      await copyText(window.location.href)
      setUrlStatus('done')
    } catch {
      setUrlStatus('error')
    }
    setTimeout(() => setUrlStatus('idle'), 2500)
  }, [])

  function btnLabel(status: BtnStatus, idle: string, loading: string): string {
    if (status === 'loading') return loading
    if (status === 'done')    return '✓ 完了'
    if (status === 'error')   return '⚠ エラー'
    return idle
  }

  const BTN: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 48,
    borderRadius: 'var(--r)',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    flex: '1 1 140px',
    minWidth: 0,
    fontFamily: 'inherit',
  }

  const BTN_PRIMARY: React.CSSProperties = {
    ...BTN,
    border: '1.5px solid var(--accent)',
    background: 'var(--accent)',
    color: '#fff',
  }

  const BTN_DONE: React.CSSProperties = {
    ...BTN,
    border: '1.5px solid #059669',
    background: '#f0fdf4',
    color: '#059669',
  }

  function btnStyle(status: BtnStatus, primary = false): React.CSSProperties {
    if (status === 'done')  return BTN_DONE
    if (primary) return BTN_PRIMARY
    return BTN
  }

  return (
    <div className="no-print" style={{
      width: '100%',
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      padding: '20px 0',
    }}>
      <div className="container">
        <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          保存・共有
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>

          {/* 画像保存 */}
          <button
            style={btnStyle(imgStatus, true)}
            onClick={handleImageSave}
            disabled={imgStatus === 'loading'}
          >
            <span style={{ fontSize: '1rem' }}>🖼</span>
            {btnLabel(imgStatus, '結果を保存', '生成中…')}
          </button>

          {/* テキストコピー */}
          <button
            style={btnStyle(textStatus)}
            onClick={handleTextCopy}
            disabled={textStatus === 'loading'}
          >
            <span style={{ fontSize: '1rem' }}>📋</span>
            {btnLabel(textStatus, 'レポートをコピー', 'コピー中…')}
          </button>

          {/* PDFで保存 */}
          <button
            style={BTN}
            onClick={handlePrint}
          >
            <span style={{ fontSize: '1rem' }}>📄</span>
            PDFで保存
          </button>

          {/* URLをコピー */}
          <button
            style={btnStyle(urlStatus)}
            onClick={handleUrlCopy}
            disabled={urlStatus === 'loading'}
          >
            <span style={{ fontSize: '1rem' }}>🔗</span>
            {btnLabel(urlStatus, 'URLをコピー', 'コピー中…')}
          </button>

        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 10 }}>
          画像には氏名・メールなどの個人情報は含まれません
        </p>
      </div>
    </div>
  )
}
