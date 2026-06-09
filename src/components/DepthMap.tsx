import { useEffect, useRef } from 'react'
import type { Scores } from '../types'

interface Props {
  scores: Scores
}

// Isometric 3D position map
// X axis = 自己理解 (self)
// Y axis = 社会探索 (social)
// Z axis = 深度・解像度 (depth) — the hero axis
export default function DepthMap({ scores }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height

    ctx.clearRect(0, 0, W, H)

    // ── Iso helpers ──────────────────────────────────────────────
    const iso = (x: number, y: number, z: number) => {
      // normalize 0-100 → 0-1, then scale to grid
      const gx = (x / 100) * 0.9 + 0.05
      const gy = (y / 100) * 0.9 + 0.05
      const gz = (z / 100) * 0.85

      const tileW = W * 0.40
      const tileH = W * 0.22
      const ox = W * 0.50
      const oy = H * 0.68

      const sx = (gx - gy) * tileW
      const sy = (gx + gy) * tileH * 0.5 - gz * H * 0.48

      return { x: ox + sx, y: oy + sy }
    }

    const grid = 5 // grid lines per axis
    const GRID_COLOR = 'rgba(0,0,0,0.06)'
    const GRID_DARK  = 'rgba(0,0,0,0.12)'

    // ── Draw grid floor ──────────────────────────────────────────
    for (let i = 0; i <= grid; i++) {
      const t = (i / grid) * 100
      // X lines
      ctx.beginPath()
      const a = iso(t, 0, 0), b = iso(t, 100, 0)
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
      ctx.strokeStyle = i === 0 || i === grid ? GRID_DARK : GRID_COLOR
      ctx.lineWidth = 1
      ctx.stroke()
      // Y lines
      ctx.beginPath()
      const c = iso(0, t, 0), d = iso(100, t, 0)
      ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y)
      ctx.strokeStyle = i === 0 || i === grid ? GRID_DARK : GRID_COLOR
      ctx.stroke()
    }

    // ── Vertical pillars at corners ──────────────────────────────
    const corners = [[0,0],[100,0],[100,100],[0,100]] as const
    const maxZ = 100
    for (const [cx, cy] of corners) {
      const bot = iso(cx, cy, 0)
      const top = iso(cx, cy, maxZ)
      ctx.beginPath()
      ctx.moveTo(bot.x, bot.y); ctx.lineTo(top.x, top.y)
      ctx.strokeStyle = GRID_COLOR
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // ── Axis labels ──────────────────────────────────────────────
    ctx.font = "500 11px 'Noto Sans JP', sans-serif"
    ctx.fillStyle = '#9CA3AF'

    const xEnd = iso(110, 0, 0)
    ctx.fillText('自己理解 →', xEnd.x - 36, xEnd.y + 14)

    const yEnd = iso(0, 110, 0)
    ctx.fillText('社会探索', yEnd.x - 56, yEnd.y + 4)

    // Depth label (vertical)
    ctx.save()
    const zMid = iso(0, 0, 50)
    ctx.translate(zMid.x - 28, zMid.y)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('深度・解像度', -40, 0)
    ctx.restore()

    // ── User position pillar ─────────────────────────────────────
    const userBot = iso(scores.self, scores.social, 0)
    const userTop = iso(scores.self, scores.social, scores.depth)

    // Pillar body
    ctx.beginPath()
    ctx.moveTo(userBot.x, userBot.y)
    ctx.lineTo(userTop.x, userTop.y)
    ctx.strokeStyle = 'rgba(15,23,42,0.25)'
    ctx.lineWidth = 3
    ctx.setLineDash([4, 3])
    ctx.stroke()
    ctx.setLineDash([])

    // Shadow at floor
    ctx.beginPath()
    ctx.arc(userBot.x, userBot.y, 7, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(15,23,42,0.15)'
    ctx.fill()

    // Glowing dot at top (depth position)
    const grad = ctx.createRadialGradient(userTop.x, userTop.y, 0, userTop.x, userTop.y, 16)
    grad.addColorStop(0, 'rgba(15,23,42,0.30)')
    grad.addColorStop(1, 'rgba(15,23,42,0)')
    ctx.beginPath()
    ctx.arc(userTop.x, userTop.y, 16, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()

    ctx.beginPath()
    ctx.arc(userTop.x, userTop.y, 7, 0, Math.PI * 2)
    ctx.fillStyle = '#0F172A'
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    // Score label near dot
    ctx.font = "700 12px 'Noto Sans JP', sans-serif"
    ctx.fillStyle = '#0F172A'
    ctx.fillText(`深度 ${scores.depth}`, userTop.x + 11, userTop.y - 6)

  }, [scores])

  return (
    <div className="canvas-wrap">
      <canvas ref={canvasRef} width={560} height={400} style={{ width: '100%', height: 'auto' }} />
    </div>
  )
}
