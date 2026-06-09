import { useApp } from '../context/AppContext'

export default function Landing() {
  const { dispatch } = useApp()

  return (
    <div className="page" style={{ justifyContent: 'center' }}>
      <div className="container" style={{ paddingTop: 64, paddingBottom: 80 }}>

        <div className="fade-up" style={{ marginBottom: 64 }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-3)', textTransform: 'uppercase' }}>
            Career Compass
          </span>
        </div>

        <div className="fade-up fade-up-1">
          <h1 className="display" style={{ marginBottom: 24 }}>
            まだ決めなくていい。<br />
            でも、今どこにいるかは、<br />
            見えていた方がいい。
          </h1>
        </div>

        <div className="fade-up fade-up-2" style={{ marginBottom: 48 }}>
          <p style={{ fontSize: '1.0625rem', lineHeight: 1.8, color: 'var(--text-2)', maxWidth: 520 }}>
            性格診断でも、企業検索でもない。<br />
            あなたの就活に向けた「現在地」と「次の一歩」を、5つの軸で見える化します。
          </p>
        </div>

        <div className="fade-up fade-up-3" style={{ marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 18px', background: 'var(--depth)', color: '#fff', borderRadius: 'var(--r)', fontSize: '0.875rem', fontWeight: 600 }}>
            <span>🔍</span> このアプリの軸：深度・解像度
          </div>
          <p style={{ marginTop: 12, fontSize: '0.9rem', color: 'var(--text-2)', lineHeight: 1.7 }}>
            経験の「量」より「どう言語化できるか」。面接を変える深さを測ります。
          </p>
        </div>

        <div className="fade-up fade-up-3" style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              { label: '自己理解',     color: '#7C3AED', depth: false },
              { label: '社会探索',     color: '#059669', depth: false },
              { label: '行動性',       color: '#D97706', depth: false },
              { label: '意思決定',     color: '#DC2626', depth: false },
              { label: '深度・解像度', color: '',         depth: true  },
            ].map(({ label, color, depth }) => (
              <span key={label} style={{
                padding: '5px 14px', borderRadius: 99, fontSize: '0.8125rem',
                fontWeight: depth ? 700 : 500,
                color: depth ? '#fff' : color,
                background: depth ? 'var(--depth)' : 'transparent',
                border: depth ? 'none' : `1.5px solid ${color}`,
              }}>{label}</span>
            ))}
          </div>
        </div>

        <div className="fade-up fade-up-4" style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
          <button
            className="btn btn--primary btn--full"
            style={{ height: 52, fontSize: '1rem' }}
            onClick={() => dispatch({ type: 'GO', screen: 'basicInfo' })}
          >
            現在地を確認する（約5分）
          </button>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', textAlign: 'center' }}>
            氏名・連絡先などの個人情報は取得しません
          </p>
        </div>

        <div className="fade-up fade-up-5" style={{ marginTop: 80 }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>20問・約5分 ／ 詳細診断は25問追加</p>
        </div>

      </div>
    </div>
  )
}
