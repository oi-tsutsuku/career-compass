import { useApp } from '../context/AppContext'
import { PATTERNS } from '../data/patterns'
import { AXIS_META } from '../data/questions'

const AXES = ['depth', 'self', 'social', 'action', 'decision'] as const

// ─── Feedback section parser ───────────────────────────────────────────────────

interface FeedbackSection {
  marker: string
  heading: string
  body: string
}

/** Split ①〜⑤ structured report into sections */
function parseSections(text: string): FeedbackSection[] {
  const markers = ['①', '②', '③', '④', '⑤']
  const sections: FeedbackSection[] = []

  for (let i = 0; i < markers.length; i++) {
    const start = text.indexOf(markers[i])
    if (start === -1) continue
    const end = i < markers.length - 1 ? text.indexOf(markers[i + 1]) : text.length
    const chunk = text.slice(start + markers[i].length, end === -1 ? text.length : end).trim()
    const nl = chunk.indexOf('\n')
    sections.push({
      marker: markers[i],
      heading: nl !== -1 ? chunk.slice(0, nl).trim() : chunk,
      body: nl !== -1 ? chunk.slice(nl + 1).trim() : '',
    })
  }

  if (sections.length === 0) return [{ marker: '', heading: '', body: text }]
  return sections
}

// ─── Experience theme card parser ─────────────────────────────────────────────

interface ExperienceTheme {
  title: string
  reason: string
  usage: string
}

/**
 * Parse the ③ section body into 3 structured theme cards.
 * Supports format:
 *   【テーマN】<title>
 *   なぜ語れるのか：<reason>
 *   面接での使い方：<usage>
 */
function parseThemes(body: string): ExperienceTheme[] {
  const themes: ExperienceTheme[] = []
  // Split on 【テーマ or 【テーマN】
  const parts = body.split(/(?=【テーマ\d*】)/)
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const titleMatch = trimmed.match(/^【テーマ\d*】(.*)/)
    if (!titleMatch) continue
    const rest = trimmed.slice(titleMatch[0].length).trim()
    const reasonMatch = rest.match(/なぜ語れるのか[：:]([\s\S]*?)(?=面接での使い方[：:]|$)/)
    const usageMatch  = rest.match(/面接での使い方[：:]([\s\S]*)/)
    themes.push({
      title:  titleMatch[1].trim(),
      reason: reasonMatch ? reasonMatch[1].trim() : '',
      usage:  usageMatch  ? usageMatch[1].trim()  : '',
    })
  }
  return themes
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const SECTION_COLORS = ['var(--depth)', 'var(--accent)', '#059669', '#d97706', '#7c3aed']
const THEME_COLORS   = ['#2563eb', '#059669', '#d97706']

// ─── Components ───────────────────────────────────────────────────────────────

function ThemeCard({ theme, index }: { theme: ExperienceTheme; index: number }) {
  const color = THEME_COLORS[index] ?? 'var(--accent)'
  return (
    <div style={{
      border: `1.5px solid ${color}22`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 'var(--r)',
      padding: '20px 20px 18px',
      background: 'var(--bg)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <span style={{
          minWidth: 24, height: 24, borderRadius: '50%',
          background: color, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, marginTop: 2,
        }}>{index + 1}</span>
        <p style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.45, color: 'var(--text)' }}>
          {theme.title}
        </p>
      </div>

      {theme.reason && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: color, marginBottom: 4, letterSpacing: '0.04em' }}>
            なぜ語れるのか
          </p>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.75, color: 'var(--text-2)', whiteSpace: 'pre-line' }}>
            {theme.reason}
          </p>
        </div>
      )}

      {theme.usage && (
        <div style={{
          padding: '10px 14px',
          background: `${color}0d`,
          borderRadius: 8,
          borderLeft: `3px solid ${color}55`,
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: color, marginBottom: 4, letterSpacing: '0.04em' }}>
            面接での使い方
          </p>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.75, color: 'var(--text-2)', whiteSpace: 'pre-line' }}>
            {theme.usage}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function Report() {
  const { state, dispatch } = useApp()
  const { scores, pattern: patternId, report, basicInfo } = state
  if (!scores || !patternId) return null
  const pattern = PATTERNS[patternId]
  const sections = parseSections(report)

  return (
    <div className="page">
      {/* Nav */}
      <div style={{ width: '100%', background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '20px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="btn btn--ghost" style={{ padding: '0 8px', fontSize: '0.875rem' }} onClick={() => dispatch({ type: 'GO', screen: 'results' })}>← 診断結果へ</button>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>詳細レポート</span>
        </div>
      </div>

      {/* Hero */}
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

      {/* Depth score */}
      <div style={{ width: '100%', padding: '40px 0' }}>
        <div className="container">
          <div className="depth-hero fade-up">
            <span className="label-tag">深度・解像度スコア</span>
            <div className="score-number" style={{ fontSize: '5rem' }}>{scores.depth}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: 6 }}>/ 100</div>
          </div>
        </div>
      </div>

      {/* Score summary */}
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

      {/* AI Feedback sections */}
      {report && (
        <div style={{ width: '100%', padding: '40px 0' }}>
          <div className="container">
            <h2 className="title" style={{ marginBottom: 20 }}>個別フィードバック</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {sections.map((sec, i) => {
                const color = SECTION_COLORS[i] ?? 'var(--border-md)'

                // ③ Experience themes — special card layout
                if (sec.marker === '③' && sec.body) {
                  const themes = parseThemes(sec.body)
                  return (
                    <div key={i}>
                      <div className="card" style={{ borderLeft: `3px solid ${color}`, marginBottom: 16 }}>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 700, color, marginBottom: 4, letterSpacing: '0.02em' }}>
                          {sec.marker}{sec.heading || '面接で語れそうな経験テーマ'}
                        </p>
                      </div>
                      {themes.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {themes.map((theme, ti) => <ThemeCard key={ti} theme={theme} index={ti} />)}
                        </div>
                      ) : (
                        /* Fallback: plain text if parse fails */
                        <div className="card" style={{ borderLeft: `3px solid ${color}` }}>
                          <p style={{ fontSize: '0.9375rem', lineHeight: 1.85, whiteSpace: 'pre-line' }}>{sec.body}</p>
                        </div>
                      )}
                    </div>
                  )
                }

                // Other sections
                return (
                  <div key={i} className="card" style={{ borderLeft: `3px solid ${color}` }}>
                    {sec.heading && (
                      <p style={{ fontSize: '0.8125rem', fontWeight: 700, color, marginBottom: 8, letterSpacing: '0.02em' }}>
                        {sec.marker}{sec.heading}
                      </p>
                    )}
                    {sec.body && (
                      <p style={{ fontSize: '0.9375rem', lineHeight: 1.85, whiteSpace: 'pre-line' }}>{sec.body}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Pattern detail */}
      <div style={{ width: '100%', background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '40px 0' }}>
        <div className="container">
          <h2 className="title" style={{ marginBottom: 20 }}>タイプ詳細：{pattern.name}</h2>
          <div style={{ display: 'grid', gap: 20 }}>
            <div className="card card--sm">
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>面接で語れそうな経験テーマ（タイプ別）</h3>
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

      {/* Reset */}
      <div style={{ width: '100%', padding: '40px 0', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <button className="btn btn--outline" onClick={() => dispatch({ type: 'RESET' })}>はじめからやり直す</button>
        </div>
      </div>
    </div>
  )
}
