import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { GRADES, STATUSES, AREAS } from '../data/questions'
import type { BasicInfo } from '../types'

export default function BasicInfoScreen() {
  const { state, dispatch } = useApp()
  const [info, setInfo] = useState<BasicInfo>(state.basicInfo)
  const [consent, setConsent] = useState(state.consent)

  const valid = info.grade && info.status && info.area && consent

  function handleSubmit() {
    if (!valid) return
    dispatch({ type: 'SET_BASIC', info })
    dispatch({ type: 'SET_CONSENT', value: consent })
    dispatch({ type: 'GO', screen: 'lightQuiz' })
  }

  return (
    <div className="page">
      {/* Nav */}
      <nav className="nav" style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
        <button
          className="btn btn--ghost"
          style={{ padding: '0 8px', fontSize: '0.875rem' }}
          onClick={() => dispatch({ type: 'GO', screen: 'landing' })}
        >
          ← 戻る
        </button>
        <span className="nav__logo">Career Compass</span>
      </nav>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 80 }}>
        <div className="fade-in">
          <h1 className="headline" style={{ marginBottom: 8 }}>基本情報</h1>
          <p className="body" style={{ marginBottom: 40 }}>
            診断の精度を高めるために、現在の状況を教えてください。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Grade */}
            <div className="field">
              <label className="label" htmlFor="grade">学年</label>
              <div className="select-wrap">
                <select
                  id="grade"
                  className="select"
                  value={info.grade}
                  onChange={(e) => setInfo({ ...info, grade: e.target.value })}
                >
                  <option value="">選択してください</option>
                  {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {/* Status */}
            <div className="field">
              <label className="label" htmlFor="status">就活の状況</label>
              <div className="select-wrap">
                <select
                  id="status"
                  className="select"
                  value={info.status}
                  onChange={(e) => setInfo({ ...info, status: e.target.value })}
                >
                  <option value="">選択してください</option>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Area */}
            <div className="field">
              <label className="label" htmlFor="area">居住エリア</label>
              <div className="select-wrap">
                <select
                  id="area"
                  className="select"
                  value={info.area}
                  onChange={(e) => setInfo({ ...info, area: e.target.value })}
                >
                  <option value="">選択してください</option>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {/* Privacy notice */}
            <div className="card card--sm" style={{ background: 'var(--bg)' }}>
              <p className="small" style={{ color: 'var(--text-2)', marginBottom: 12 }}>
                <strong style={{ color: 'var(--text)' }}>プライバシーについて</strong><br />
                氏名・メールアドレス・学籍番号などの個人を特定できる情報は一切取得しません。
                回答データは就活支援の改善目的にのみ使用し、第三者に提供しません。
              </p>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>上記のプライバシーポリシーに同意します</span>
              </label>
            </div>

            <button
              className="btn btn--primary btn--full"
              style={{ height: 52, marginTop: 8 }}
              disabled={!valid}
              onClick={handleSubmit}
            >
              診断を始める
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
