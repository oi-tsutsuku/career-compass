import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { LQ, SCALE_LABELS } from '../data/questions'
import { calcScores, determinePattern } from '../utils/scoring'

export default function LightQuiz() {
  const { state, dispatch } = useApp()
  const [current, setCurrent] = useState(0)
  const answers = state.lightAnswers

  const total = LQ.length
  const q = LQ[current]
  const selected = answers[current]

  function select(val: number) {
    dispatch({ type: 'SET_LIGHT_ANSWER', idx: current, value: val })
    // auto-advance after short delay
    setTimeout(() => {
      if (current < total - 1) {
        setCurrent(current + 1)
      } else {
        // all done — calculate scores
        const updated = [...answers]
        updated[current] = val
        const scores = calcScores(updated)
        const pattern = determinePattern(scores)
        dispatch({ type: 'SET_RESULTS', scores, pattern })
        dispatch({ type: 'GO', screen: 'results' })
      }
    }, 180)
  }

  function goBack() {
    if (current > 0) setCurrent(current - 1)
    else dispatch({ type: 'GO', screen: 'basicInfo' })
  }

  const progress = ((current) / total) * 100

  return (
    <div className="page">
      {/* Header */}
      <div style={{ width: '100%', background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '14px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button className="btn btn--ghost" style={{ padding: '0 8px', height: 'auto', fontSize: '0.875rem' }} onClick={goBack}>
              ← 戻る
            </button>
            <span className="small" style={{ color: 'var(--text-3)' }}>
              {current + 1} / {total}
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="container" style={{ paddingTop: 48, paddingBottom: 80, flex: 1 }}>
        <div className="fade-in" key={current}>

          {/* Axis badge */}
          <div style={{ marginBottom: 20 }}>
            <span style={{
              padding: '3px 12px',
              borderRadius: 99,
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              background: q.axis === 'depth' ? 'var(--depth)' : 'var(--border)',
              color: q.axis === 'depth' ? '#fff' : 'var(--text-2)',
            }}>
              {axisLabel(q.axis)}
            </span>
          </div>

          <h2 style={{
            fontSize: 'clamp(1.1rem, 3.5vw, 1.375rem)',
            fontWeight: 700,
            lineHeight: 1.45,
            marginBottom: 36,
            letterSpacing: '-0.01em',
          }}>
            {q.text}
          </h2>

          {/* 5-point scale */}
          <div className="answer-grid">
            {SCALE_LABELS.map((label, i) => {
              const val = i + 1
              return (
                <button
                  key={val}
                  className={`answer-btn${selected === val ? ' selected' : ''}`}
                  onClick={() => select(val)}
                >
                  <span className="dot" />
                  <span>{label}</span>
                </button>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}

function axisLabel(axis: string): string {
  const m: Record<string, string> = {
    self: '自己理解', social: '社会探索', action: '行動性',
    decision: '意思決定', depth: '深度・解像度',
  }
  return m[axis] ?? axis
}
