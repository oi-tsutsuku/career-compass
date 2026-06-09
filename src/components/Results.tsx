import { useApp } from '../context/AppContext'
import { PATTERNS } from '../data/patterns'
import { AXIS_META } from '../data/questions'
import { gradeToNum, recommendNextAxis } from '../utils/scoring'
import RadarChart from './RadarChart'
import DepthMap from './DepthMap'
import ShareActions from './ShareActions'

const AXES = ['depth', 'self', 'social', 'action', 'decision'] as const

export default function Results() {
  const { state, dispatch } = useApp()
  const { scores, pattern: patternId, basicInfo } = state
  if (!scores || !patternId) return null

  const pattern = PATTERNS[patternId]
  const gradeNum = gradeToNum(basicInfo.grade)
  const hl = pattern.hl(gradeNum)
  const recAxis = recommendNextAxis(scores, gradeNum)
  const depthLevel = scores.depth >= 70 ? '高い' : scores.depth >= 45 ? '中程度' : '伸ばせる余地あり'

  return (
    <div className="page">

      {/* Pattern */}
      <div style={{ width: '100%', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ paddingTop: 48, paddingBottom: 48 }}>
          <div className="fade-in">
            <span className="caption" style={{ color: 'var(--text-3)', display: 'block', marginBottom: 16 }}>あなたの就活タイプ</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <span style={{ fontSize: '3rem', lineHeight: 1 }}>{pattern.emoji}</span>
              <h1 className="headline">{pattern.name}</h1>
            </div>
            <p style={{ fontSize: '0.9375rem', lineHeight: 1.75, color: 'var(--text-2)', marginBottom: 16 }}>{hl}</p>
            <p className="body">{pattern.desc}</p>
          </div>
        </div>
      </div>

      {/* Depth hero */}
      <div style={{ width: '100%', background: 'var(--bg)', padding: '48px 0' }}>
        <div className="container">
          <div className="depth-hero fade-up">
            <span className="label-tag">🔍 深度・解像度 — このアプリの核心軸</span>
            <div className="score-number" style={{ fontSize: '5rem' }}>{scores.depth}</div>
            <div style={{ fontSize: '1rem', opacity: 0.8, marginTop: 8, marginBottom: 20 }}>/ 100 — {depthLevel}</div>
            <p style={{ fontSize: '0.9375rem', lineHeight: 1.75, opacity: 0.85, maxWidth: 480, margin: '0 auto' }}>
              「何をしたか」より「どう言語化できるか」。深度スコアは、経験を面接の言葉に変える力を測ります。
            </p>
          </div>
        </div>
      </div>

      {/* Share actions */}
      <ShareActions scores={scores} patternId={patternId} grade={basicInfo.grade} />

      {/* All axes */}
      <div style={{ width: '100%', padding: '48px 0' }}>
        <div className="container">
          <h2 className="title" style={{ marginBottom: 24 }}>5軸スコア</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {AXES.map((axis) => {
              const score = scores[axis]
              const meta = AXIS_META[axis]
              const isDepth = axis === 'depth'
              return (
                <div key={axis} style={{
                  background: isDepth ? 'var(--depth)' : 'var(--surface)',
                  border: isDepth ? 'none' : '1px solid var(--border)',
                  borderRadius: 'var(--r)', padding: '20px 24px',
                  color: isDepth ? '#fff' : 'inherit',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{isDepth && '⭐ '}{meta.label}</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>{score}</span>
                  </div>
                  <div style={{ height: 6, background: isDepth ? 'rgba(255,255,255,0.2)' : 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${score}%`, background: isDepth ? '#fff' : meta.color, borderRadius: 99, transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Radar */}
      <div style={{ width: '100%', background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '48px 0' }}>
        <div className="container">
          <h2 className="title" style={{ marginBottom: 8 }}>レーダーチャート</h2>
          <p className="small" style={{ marginBottom: 24 }}>5軸のバランスを一目で確認できます</p>
          <RadarChart scores={scores} />
        </div>
      </div>

      {/* Depth map */}
      <div style={{ width: '100%', padding: '48px 0' }}>
        <div className="container container--wide">
          <h2 className="title" style={{ marginBottom: 8 }}>現在地マップ</h2>
          <p className="small" style={{ marginBottom: 24 }}>X軸＝自己理解、Y軸＝社会探索、高さ＝<strong>深度・解像度</strong></p>
          <DepthMap scores={scores} recommendedAxis={recAxis} />
        </div>
      </div>

      {/* Strengths / next steps */}
      <div style={{ width: '100%', background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '48px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: 40 }}>
            <div className="card">
              <h3 className="title" style={{ marginBottom: 16 }}>面接で語れそうな経験テーマ</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pattern.strengths.map(s => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{ background: 'var(--accent-bg)', borderColor: 'rgba(37,99,235,0.15)' }}>
              <h3 className="title" style={{ marginBottom: 12 }}>面接ヒント</h3>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.75, color: 'var(--text-2)' }}>{pattern.tip}</p>
            </div>
          </div>

          {pattern.cautions.map((c, i) => (
            <div key={i} style={{ padding: '16px 20px', borderLeft: '3px solid var(--border-md)', marginBottom: 32, fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--text-2)' }}>{c}</div>
          ))}

          <h3 className="title" style={{ marginBottom: 16 }}>次の一歩</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pattern.nextSteps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '16px 20px', background: 'var(--bg)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--text)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: '0.9375rem', lineHeight: 1.65 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="no-print" style={{ width: '100%', padding: '48px 0', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="headline" style={{ marginBottom: 12 }}>さらに詳しく知る</h2>
          <p className="body" style={{ marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
            25問の詳細診断で、就活の傾向と強みをより深く分析します。
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <button className="btn btn--primary" style={{ minWidth: 280, height: 52 }} onClick={() => dispatch({ type: 'GO', screen: 'detailQuiz' })}>
              詳細診断に進む（25問）
            </button>
            <button className="btn btn--ghost" onClick={() => dispatch({ type: 'RESET' })}>はじめからやり直す</button>
          </div>
        </div>
      </div>

    </div>
  )
}
