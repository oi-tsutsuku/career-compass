// ─────────────────────────────────────────────────────────────
// chart.js  —  レーダーチャート & 3D 現在地マップ
// ─────────────────────────────────────────────────────────────
import Chart from 'chart.js/auto'

let radarChart = null

/**
 * レーダーチャートを初期化（または再描画）する
 * @param {{ self, social, action, decision, depth }} scores
 */
export function initRadar(scores) {
  const canvas = document.getElementById('radarCanvas')
  if (!canvas) return
  if (radarChart) { radarChart.destroy(); radarChart = null }

  radarChart = new Chart(canvas, {
    type: 'radar',
    data: {
      labels: ['自己理解', '社会探索', '行動性', '意思決定', '深度・解像度'],
      datasets: [{
        data: [scores.self, scores.social, scores.action, scores.decision, scores.depth],
        backgroundColor: 'rgba(91,91,214,0.18)',
        borderColor: 'rgba(91,91,214,0.9)',
        borderWidth: 2.5,
        pointBackgroundColor: 'rgba(91,91,214,1)',
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
          ticks: { display: false, stepSize: 25 },
          grid: { color: 'rgba(0,0,0,0.07)' },
          pointLabels: {
            font: { size: 11, family: "'Noto Sans JP', sans-serif", weight: '600' },
            color: '#374151',
          },
          angleLines: { color: 'rgba(0,0,0,0.07)' },
        },
      },
      plugins: { legend: { display: false } },
    },
  })
}

/**
 * 等角投影（isometric）による3D現在地マップを Canvas に描画する
 * X軸: 自己理解 / Y軸: 社会探索 / Z軸: 深度・解像度
 * @param {string} id  canvas 要素の id
 * @param {{ self, social, action, decision, depth }} scores
 */
export function drawMap(id, scores) {
  const canvas = document.getElementById(id)
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = (canvas.width = canvas.offsetWidth || 320)
  const H = (canvas.height = 200)

  // 背景
  ctx.fillStyle = '#0F0E2E'
  ctx.fillRect(0, 0, W, H)

  // グリッドドット
  ctx.fillStyle = 'rgba(165,180,252,0.15)'
  for (let gx = 0; gx < W; gx += 24) {
    for (let gy = 0; gy < H; gy += 24) {
      ctx.beginPath()
      ctx.arc(gx, gy, 1.2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const cx = W / 2
  const cy = H / 2 + 10
  const sc = Math.min(W, H) * 0.32
  const cos30 = Math.cos(Math.PI / 6)
  const sin30 = Math.sin(Math.PI / 6)

  /** 3D座標 → 2Dスクリーン座標 */
  const iso = (x, y, z) => [
    cx + (x - y) * cos30 * sc,
    cy + (x + y) * sin30 * sc - z * sc * 0.8,
  ]

  const O  = iso(0, 0, 0)
  const X1 = iso(1, 0, 0)
  const Y1 = iso(0, 1, 0)
  const Z1 = iso(0, 0, 1)

  // 軸描画
  const axes = [
    { to: X1, color: '#818CF8', label: '自己理解' },
    { to: Y1, color: '#34D399', label: '社会探索' },
    { to: Z1, color: '#F472B6', label: '深度' },
  ]
  axes.forEach(({ to, color, label }) => {
    ctx.strokeStyle = color + '99'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(O[0], O[1])
    ctx.lineTo(to[0], to[1])
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(to[0], to[1], 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.font = '600 10px "Noto Sans JP", sans-serif'
    ctx.fillText(label, to[0] + 5, to[1] + 4)
  })

  // 行動性 補助矢印
  ctx.strokeStyle = 'rgba(251,191,36,0.4)'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 4])
  ctx.beginPath()
  ctx.moveTo(O[0], O[1])
  const A1 = iso(0.6, 0.6, 0)
  ctx.lineTo(A1[0], A1[1])
  ctx.stroke()
  ctx.setLineDash([])
  ctx.font = '600 9px "Noto Sans JP", sans-serif'
  ctx.fillStyle = 'rgba(251,191,36,0.7)'
  ctx.fillText('行動性', A1[0] + 4, A1[1] - 4)

  // ユーザーポジション
  const nx = scores.self   / 100
  const ny = scores.social / 100
  const nz = scores.depth  / 100
  const [px, py] = iso(nx, ny, nz)

  // グロー
  for (let r = 28; r > 4; r -= 4) {
    const grad = ctx.createRadialGradient(px, py, 0, px, py, r)
    grad.addColorStop(0, 'rgba(165,180,252,0.06)')
    grad.addColorStop(1, 'rgba(165,180,252,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(px, py, r, 0, Math.PI * 2)
    ctx.fill()
  }
  const coreGrad = ctx.createRadialGradient(px, py, 0, px, py, 10)
  coreGrad.addColorStop(0, 'rgba(255,255,255,0.95)')
  coreGrad.addColorStop(0.4, 'rgba(165,180,252,0.9)')
  coreGrad.addColorStop(1, 'rgba(99,102,241,0)')
  ctx.fillStyle = coreGrad
  ctx.beginPath()
  ctx.arc(px, py, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(px, py, 4, 0, Math.PI * 2)
  ctx.fill()

  // ドロップシャドウ（床への垂線）
  const [bx, by] = iso(nx, ny, 0)
  ctx.strokeStyle = 'rgba(165,180,252,0.25)'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 3])
  ctx.beginPath()
  ctx.moveTo(px, py)
  ctx.lineTo(bx, by)
  ctx.stroke()
  ctx.setLineDash([])

  // 「現在地」ラベル
  ctx.font = 'bold 11px "Noto Sans JP", sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.fillText('現在地', px + 10, py - 6)
}
