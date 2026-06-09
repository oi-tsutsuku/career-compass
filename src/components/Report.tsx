import { useApp } from '../context/AppContext'
import { PATTERNS } from '../data/patterns'
import { AXIS_META } from '../data/questions'

const AXES = ['depth', 'self', 'social', 'action', 'decision'] as const

export default function Report() {
  const { state, dispatch } = useApp()
  const { scores, pattern: patternId, report, basicInfo } = state
  if (!scores || !patternId) return null
  const pattern = PATTERNS[patternId]

  return (
    <div className="page">
      <div style={{ width: '100%', background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '20px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="btn btn--ghost" style={{ padding: '0 8px', fontSize: '0.875rem' }} onClick={() => dispatch({ type: 'GO', screen: 'results' })}>← 診断結果へ</button>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>詳細レポート</span>
        </div>
      </div>

      <div style={{ width: '100%', background: 'var(--bg)', padding: '40px 0' }}>
        <div className="container">
          <div className="fade-in">
            <span className="caption" style={{ display: 'block', marginBottom: 12 }}>就活現在地レポート</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: '2rem' }}>{pattern.emoji}</span>
              <h1 className="headline">{pattern.name}</h1>
            </div>
            <p className="small" style={{ color: 'var(--text-3)' }}>{basicInfo.grade} ／ {basicInfo.status}</p>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', padding: '40px 0' }}>
        <div className="container">
          <div className="depth-hero fade-up">
            <span className="label-tag">深度・解像度スコア</span>
            <div className="score-number" style={{ fontSize: '5rem' }}>{scores.depth}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: 6 }}>/ 100</div>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '40px 0' }}>
        <div className="container">
          <h2 className="title" style={{ marginBottom: 20 }}>スコアサマリー</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {AXES.map(axis => {
              const meta = AXIS_META[axis]
              const score = scores[axis]
              const isDepth = axis === 'depth'
              return (
                <div key={axis} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ width: 88, fontSize: '0.8125rem', fontWeight: isDepth ? 700 : 500, color: isDepth ? 'var(--depth)' : 'var(--text-2)', flexShrink: 0 }}>
                    {isDepth ? '⭐ ' : ''}{meta.label}
                  </span>
                  <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${score}%`, background: meta.color, borderRadius: 99 }} />
                  </div>
                  <span style={{ width: 36, textAlign: 'right', fontSize: '0.875rem', fontWeight: 700 }}>{score}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {report && (
        <div style={{ width: '100%', padding: '40px 0' }}>
          <div className="container">
            <h2 className="title" style={{ marginBottom: 16 }}>個別フィードバック</h2>
            <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.85, whiteSpace: 'pre-line' }}>{report}</p>
            </div>
          </div>
        </div>
      )}

      <div style={{ width: '100%', background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '40px 0' }}>
        <div className="container">
          <h2 className="title" style={{ marginBottom: 20 }}>タイプ詳細：{pattern.name}</h2>
          <div style={{ display: 'grid', gap: 20 }}>
            <div className="card card--sm">
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>強み</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {pattern.strengths.map(s => (
                  <span key={s} className="tag" style={{ fontWeight: 600, color: 'var(--text)' }}>{s}</span>
                ))}
              </div>
            </div>
            <div className="card card--sm" style={{ background: 'var(--accent-bg)', borderColor: 'rgba(37,99,235,0.15)' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 10, color: 'var(--accent)' }}>面接ヒント</h3>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.75, color: 'var(--text-2)' }}>{pattern.tip}</p>
            </div>
            {pattern.cautions.map((c, i) => (
              <div key={i} style={{ padding: '14px 18px', borderLeft: '3px solid var(--border-md)', fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--text-2)' }}>{c}</div>
            ))}
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 14, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>次の一歩</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pattern.nextSteps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 18px', background: 'var(--bg)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--text)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: '0.9375rem', lineHeight: 1.65 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', padding: '40px 0', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <button className="btn btn--outline" onClick={() => dispatch({ type: 'RESET' })}>はじめからやり直す</button>
        </div>
      </div>
    </div>
  )
}
