import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { DQ, SCALE_LABELS } from '../data/questions'
import { generateOpenAIReport } from '../api/index'

export default function DetailQuiz() {
  const { state, dispatch } = useApp()
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(false)
  const answers = state.detailAnswers

  const total = DQ.length
  const q = DQ[current]
  const selected = answers[current]

  async function select(val: number) {
    dispatch({ type: 'SET_DETAIL_ANSWER', idx: current, value: val })

    if (current < total - 1) {
      setTimeout(() => setCurrent(current + 1), 180)
    } else {
      // last question — generate report
      setLoading(true)
      try {
        const report = await generateOpenAIReport(state.scores!, state.basicInfo)
        dispatch({ type: 'SET_REPORT', report })
        dispatch({ type: 'GO', screen: 'report' })
      } catch {
        dispatch({ type: 'SET_REPORT', report: 'フィードバックの生成中にエラーが発生しました。' })
        dispatch({ type: 'GO', screen: 'report' })
      } finally {
        setLoading(false)
      }
    }
  }

  function goBack() {
    if (current > 0) setCurrent(current - 1)
    else dispatch({ type: 'GO', screen: 'results' })
  }

  const progress = (current / total) * 100

  if (loading) {
    return (
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" style={{ margin: '0 auto 20px' }} />
          <p className="body">フィードバックを生成しています...</p>
        </div>
      </div>
    )
  }

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
              詳細診断 {current + 1} / {total}
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
          <h2 style={{
            fontSize: 'clamp(1.1rem, 3.5vw, 1.375rem)',
            fontWeight: 700,
            lineHeight: 1.45,
            marginBottom: 36,
            letterSpacing: '-0.01em',
          }}>
            {q.text}
          </h2>

          {q.type === 'ab' ? (
            <div className="ab-grid">
              <button
                className={`ab-btn${selected === 1 ? ' selected' : ''}`}
                onClick={() => select(1)}
              >
                {q.a}
              </button>
              <button
                className={`ab-btn${selected === 2 ? ' selected' : ''}`}
                onClick={() => select(2)}
              >
                {q.b}
              </button>
            </div>
          ) : (
            <div>
              <div className="scale-row" style={{ marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    className={`scale-btn${selected === val ? ' selected' : ''}`}
                    onClick={() => select(val)}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="micro">{SCALE_LABELS[0]}</span>
                <span className="micro">{SCALE_LABELS[4]}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
