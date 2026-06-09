import { useEffect, useRef } from 'react'
import type { Scores } from '../types'

export default function DepthMap({ scores }: { scores: Scores }) {
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

    // Dot
    ctx.beginPath(); ctx.arc(top.x, top.y, 7, 0, Math.PI * 2)
    ctx.fillStyle = '#0F172A'; ctx.fill()
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke()

    // Label
    ctx.font = "700 12px 'Noto Sans JP', sans-serif"
    ctx.fillStyle = '#0F172A'
    ctx.fillText(`深度 ${scores.depth}`, top.x + 11, top.y - 6)
  }, [scores])

  return (
    <div className="canvas-wrap">
      <canvas ref={canvasRef} width={560} height={400} style={{ width: '100%', height: 'auto' }} />
    </div>
  )
}
