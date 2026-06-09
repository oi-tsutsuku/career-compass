import { useEffect, useRef } from 'react'
import type { Scores, Axis } from '../types'
import { AXIS_META } from '../data/questions'

interface Props {
  scores: Scores
  recommendedAxis?: Axis
}

// How far to project in the recommended direction (0-100 units)
const DIRECTION_DELTA = 22

function getTargetScores(scores: Scores, axis: Axis): Scores {
  const target = { ...scores }
  const projected = Math.min(100, scores[axis] + DIRECTION_DELTA)
  target[axis] = projected
  return target
}

export default function DepthMap({ scores, recommendedAxis }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    // Isometric projection: x=自己理解, y=社会探索, z=depth
    function iso(xv: number, yv: number, zv: number) {
      const gx = (xv / 100) * 0.9 + 0.05
      const gy = (yv / 100) * 0.9 + 0.05
      const gz = (zv / 100) * 0.85
      const tileW = W * 0.40
      const tileH = W * 0.22
      const ox = W * 0.50
      const oy = H * 0.68
      return {
        x: ox + (gx - gy) * tileW,
        y: oy + (gx + gy) * tileH * 0.5 - gz * H * 0.48,
      }
    }

    const GRID = 5
    const GC = 'rgba(0,0,0,0.06)'
    const GCD = 'rgba(0,0,0,0.12)'

    // Floor grid
    for (let i = 0; i <= GRID; i++) {
      const t = (i / GRID) * 100
      ctx.beginPath()
      const a = iso(t, 0, 0), b = iso(t, 100, 0)
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
      ctx.strokeStyle = (i === 0 || i === GRID) ? GCD : GC
      ctx.lineWidth = 1; ctx.stroke()

      ctx.beginPath()
      const c = iso(0, t, 0), d = iso(100, t, 0)
      ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y)
      ctx.strokeStyle = (i === 0 || i === GRID) ? GCD : GC
      ctx.stroke()
    }

    // Corner pillars
    for (const [cx, cy] of [[0,0],[100,0],[100,100],[0,100]]) {
      const bot = iso(cx, cy, 0), top = iso(cx, cy, 100)
      ctx.beginPath(); ctx.moveTo(bot.x, bot.y); ctx.lineTo(top.x, top.y)
      ctx.strokeStyle = GC; ctx.lineWidth = 1; ctx.stroke()
    }

    // Axis labels
    ctx.font = "500 11px 'Noto Sans JP', sans-serif"
    ctx.fillStyle = '#9CA3AF'
    const xl = iso(112, 0, 0); ctx.fillText('自己理解 →', xl.x - 36, xl.y + 14)
    const yl = iso(0, 112, 0); ctx.fillText('社会探索', yl.x - 52, yl.y + 4)
    const zm = iso(0, 0, 50)
    ctx.save(); ctx.translate(zm.x - 28, zm.y); ctx.rotate(-Math.PI / 2)
    ctx.fillText('深度・解像度', -40, 0); ctx.restore()

    // --- Recommended direction ---
    if (recommendedAxis) {
      const target = getTargetScores(scores, recommendedAxis)
      const fromTop = iso(scores.self, scores.social, scores.depth)
      const toTop   = iso(target.self, target.social, target.depth)

      // Dashed line from current to target
      ctx.beginPath()
      ctx.moveTo(fromTop.x, fromTop.y)
      ctx.lineTo(toTop.x, toTop.y)
      ctx.strokeStyle = 'rgba(37,99,235,0.55)'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 4])
      ctx.stroke()
      ctx.setLineDash([])

      // Arrowhead at target
      const angle = Math.atan2(toTop.y - fromTop.y, toTop.x - fromTop.x)
      const alen = 8
      ctx.beginPath()
      ctx.moveTo(toTop.x, toTop.y)
      ctx.lineTo(toTop.x - alen * Math.cos(angle - 0.45), toTop.y - alen * Math.sin(angle - 0.45))
      ctx.lineTo(toTop.x - alen * Math.cos(angle + 0.45), toTop.y - alen * Math.sin(angle + 0.45))
      ctx.closePath()
      ctx.fillStyle = 'rgba(37,99,235,0.8)'
      ctx.fill()

      // Target dot (hollow)
      ctx.beginPath(); ctx.arc(toTop.x, toTop.y, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = 'rgba(37,99,235,0.9)'
      ctx.lineWidth = 2
      ctx.fill(); ctx.stroke()

      // Label
      const recMeta = AXIS_META[recommendedAxis]
      ctx.font = "600 11px 'Noto Sans JP', sans-serif"
      ctx.fillStyle = 'rgba(37,99,235,0.9)'
      ctx.fillText(`▲ ${recMeta.label}を伸ばす`, toTop.x + 9, toTop.y - 4)
    }

    // User pillar
    const bot = iso(scores.self, scores.social, 0)
    const top = iso(scores.self, scores.social, scores.depth)

    ctx.beginPath(); ctx.moveTo(bot.x, bot.y); ctx.lineTo(top.x, top.y)
    ctx.strokeStyle = 'rgba(15,23,42,0.25)'; ctx.lineWidth = 3
    ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([])

    // Floor shadow
    ctx.beginPath(); ctx.arc(bot.x, bot.y, 7, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(15,23,42,0.15)'; ctx.fill()

    // Glow
    const grad = ctx.createRadialGradient(top.x, top.y, 0, top.x, top.y, 16)
    grad.addColorStop(0, 'rgba(15,23,42,0.30)'); grad.addColorStop(1, 'rgba(15,23,42,0)')
    ctx.beginPath(); ctx.arc(top.x, top.y, 16, 0, Math.PI * 2)
    ctx.fillStyle = grad; ctx.fill()

    // Dot (current position)
    ctx.beginPath(); ctx.arc(top.x, top.y, 7, 0, Math.PI * 2)
    ctx.fillStyle = '#0F172A'; ctx.fill()
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke()

    // Label
    ctx.font = "700 12px 'Noto Sans JP', sans-serif"
    ctx.fillStyle = '#0F172A'
    ctx.fillText(`深度 ${scores.depth}`, top.x + 11, top.y - 6)
  }, [scores, recommendedAxis])

  return (
    <div className="canvas-wrap">
      <canvas ref={canvasRef} width={560} height={400} style={{ width: '100%', height: 'auto' }} />
    </div>
  )
}
