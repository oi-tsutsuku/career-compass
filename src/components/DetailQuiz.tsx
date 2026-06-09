import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { DQ, SCALE_LABELS } from '../data/questions'
import { generateReport, saveResponse, buildSavePayload } from '../api/index'
import { recommendStrategy, gradeToNum } from '../utils/scoring'
import type { FreeText } from '../types'

type Phase = 'quiz' | 'freetext' | 'loading'

const FREE_TEXT_QUESTIONS = [
  {
    key: 'growth' as const,
    label: '最近、自分が少し成長したかもしれないと思った経験を教えてください。',
    placeholder: '小さなことでも構いません。気づきや変化を自由に書いてください。',
  },
  {
    key: 'concern' as const,
    label: '就活や将来について、今いちばん引っかかっていることは何ですか？',
    placeholder: '不安・疑問・迷っていることなど、正直に書いてください。',
  },
  {
    key: 'interview' as const,
    label: '面接で話せそうだけど、うまく言葉にできていない経験はありますか？',
    placeholder: '「なんとなく印象に残っているけど説明しにくい」経験でも大丈夫です。',
  },
]

export default function DetailQuiz() {
  const { state, dispatch } = useApp()
  const [phase, setPhase] = useState<Phase>('quiz')
  const [current, setCurrent] = useState(0)
  const [freeText, setFreeText] = useState<FreeText>(state.freeText)
  const answers = state.detailAnswers
  const total = DQ.length
  const q = DQ[current]
  const selected = answers[current]

  async function finishAndGenerate(ft: FreeText) {
    setPhase('loading')
    dispatch({ type: 'SET_FREE_TEXT', freeText: ft })

    const scores = state.scores!
    const gradeNum = gradeToNum(state.basicInfo.grade)
    const { axis: recAxis } = recommendStrategy(scores, gradeNum)

    let report = ''
    try {
      report = await generateReport({
        grade: state.basicInfo.grade,
        status: state.basicInfo.status,
        scores,
        freeText: ft,
      })
      dispatch({ type: 'SET_REPORT', report })
    } catch {
      report = 'フィードバックの生成中にエラーが発生しました。'
      dispatch({ type: 'SET_REPORT', report })
    }

    // Save to Sheets (non-blocking, only if consented)
    if (state.consentResearch) {
      const payload = buildSavePayload(
        state.basicInfo,
        state.consentResearch,
        state.lightAnswers,
        state.detailAnswers,
        ft,
        scores,
        recAxis,
        report,
      )
      saveResponse(payload) // fire-and-forget
    }

    dispatch({ type: 'GO', screen: 'report' })
  }

  async function selectAnswer(val: number) {
    dispatch({ type: 'SET_DETAIL_ANSWER', idx: current, value: val })
    if (current < total - 1) {
      setTimeout(() => setCurrent(current + 1), 180)
    } else {
      // Move to free text phase
      setPhase('freetext')
    }
  }

  function goBack() {
    if (phase === 'freetext') {
      setPhase('quiz')
      setCurrent(total - 1)
      return
    }
    if (current > 0) setCurrent(current - 1)
    else dispatch({ type: 'GO', screen: 'results' })
  }

  if (phase === 'loading') {
    return (
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" style={{ margin: '0 auto 20px' }} />
          <p className="body">フィードバックを生成しています...</p>
        </div>
      </div>
    )
  }

  if (phase === 'freetext') {
    return (
      <div className="page">
        <div style={{ width: '100%', background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: 680, margin: '0 auto', padding: '14px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <button className="btn btn--ghost" style={{ padding: '0 8px', height: 'auto', fontSize: '0.875rem' }} onClick={goBack}>← 戻る</button>
              <span className="small" style={{ color: 'var(--text-3)' }}>自由記述 — あと少しです</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar__fill" style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 48, paddingBottom: 80, flex: 1 }}>
          <div className="fade-in">
            <span className="caption" style={{ display: 'block', marginBottom: 8, color: 'var(--text-3)' }}>自由記述（任意）</span>
            <p className="body" style={{ marginBottom: 36 }}>
              以下の3問は任意です。回答することで、あなた専用の個別フィードバックが大幅に精度が上がります。スキップしてもレポートは生成されます。
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {FREE_TEXT_QUESTIONS.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.5, marginBottom: 10 }}>{label}</label>
                  <textarea
                    rows={4}
                    placeholder={placeholder}
                    value={freeText[key]}
                    onChange={e => setFreeText(prev => ({ ...prev, [key]: e.target.value }))}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px 14px',
                      fontSize: '0.9375rem',
                      lineHeight: 1.7,
                      border: '1.5px solid var(--border)',
                      borderRadius: 'var(--r)',
                      background: 'var(--bg)',
                      color: 'var(--text)',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                  />
                </div>
              ))}
            </div>

            <button
              className="btn btn--primary btn--full"
              style={{ height: 52, marginTop: 40 }}
              onClick={() => finishAndGenerate(freeText)}
            >
              フィードバックを生成する
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div style={{ width: '100%', background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '14px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button className="btn btn--ghost" style={{ padding: '0 8px', height: 'auto', fontSize: '0.875rem' }} onClick={goBack}>← 戻る</button>
            <span className="small" style={{ color: 'var(--text-3)' }}>詳細診断 {current + 1} / {total}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${(current / total) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 48, paddingBottom: 80, flex: 1 }}>
        <div className="fade-in" key={current}>
          <h2 style={{ fontSize: 'clamp(1.1rem,3.5vw,1.375rem)', fontWeight: 700, lineHeight: 1.45, marginBottom: 36, letterSpacing: '-0.01em' }}>
            {q.text}
          </h2>

          {q.type === 'ab' ? (
            <div className="ab-grid">
              <button className={`ab-btn${selected === 1 ? ' selected' : ''}`} onClick={() => selectAnswer(1)}>{q.a}</button>
              <button className={`ab-btn${selected === 2 ? ' selected' : ''}`} onClick={() => selectAnswer(2)}>{q.b}</button>
            </div>
          ) : (
            <div>
              <div className="scale-row" style={{ marginBottom: 12 }}>
                {[1,2,3,4,5].map(val => (
                  <button key={val} className={`scale-btn${selected === val ? ' selected' : ''}`} onClick={() => selectAnswer(val)}>{val}</button>
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
