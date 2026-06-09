import { useEffect, useRef } from 'react'
import {
  Chart,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js'
import type { Scores } from '../types'

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip)

export default function RadarChart({ scores }: { scores: Scores }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    chartRef.current?.destroy()
    chartRef.current = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: ['自己理解', '社会探索', '行動性', '意思決定', '深度・解像度'],
        datasets: [{
          data: [scores.self, scores.social, scores.action, scores.decision, scores.depth],
          backgroundColor: 'rgba(15,23,42,0.08)',
          borderColor: 'rgba(15,23,42,0.7)',
          borderWidth: 2,
          pointBackgroundColor: ['#7C3AED', '#059669', '#D97706', '#DC2626', '#0F172A'],
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            min: 0, max: 100,
            ticks: { stepSize: 25, display: false },
            grid: { color: 'rgba(0,0,0,0.06)' },
            angleLines: { color: 'rgba(0,0,0,0.06)' },
            pointLabels: {
              font: { family: "'Noto Sans JP', sans-serif", size: 12, weight: 600 as number },
              color: '#374151',
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.r} / 100` } },
        },
        animation: { duration: 700, easing: 'easeOutQuart' },
      },
    })
    return () => { chartRef.current?.destroy() }
  }, [scores])

  return (
    <div className="canvas-wrap" style={{ padding: 24 }}>
      <canvas ref={canvasRef} />
    </div>
  )
}
