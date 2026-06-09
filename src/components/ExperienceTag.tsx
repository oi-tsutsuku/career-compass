import { useState } from 'react'
import { TAG_CATEGORIES, OTHER_TAGS } from '../data/experienceTags'
import type { ExperienceTags, CustomExperiences } from '../types'

interface Props {
  initialTags: ExperienceTags
  initialCustom: CustomExperiences
  onNext: (tags: ExperienceTags, custom: CustomExperiences) => void
  onBack: () => void
}

export default function ExperienceTagScreen({ initialTags, initialCustom, onNext, onBack }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialTags))
  const [custom, setCustom] = useState<CustomExperiences>(initialCustom)

  function toggle(tag: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  function handleNext() {
    const tags = Array.from(selected)
    // Remove custom entries for deselected "その他" tags
    const cleanCustom: CustomExperiences = {}
    for (const [k, v] of Object.entries(custom)) {
      if (selected.has(k)) cleanCustom[k] = v
    }
    onNext(tags, cleanCustom)
  }

  const count = selected.size

  return (
    <div className="page">
      {/* Header */}
      <div style={{
        width: '100%',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '14px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button
              className="btn btn--ghost"
              style={{ padding: '0 8px', height: 'auto', fontSize: '0.875rem' }}
              onClick={onBack}
            >← 戻る</button>
            <span className="small" style={{ color: 'var(--text-3)' }}>
              経験タグ
              {count > 0 && <span style={{ marginLeft: 6, color: 'var(--accent)', fontWeight: 700 }}>{count}個選択中</span>}
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: '90%' }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ paddingTop: 40, paddingBottom: 100, flex: 1 }}>
        <div className="fade-in">
          <h2 style={{ fontSize: 'clamp(1.1rem,3.5vw,1.375rem)', fontWeight: 700, lineHeight: 1.4, marginBottom: 10 }}>
            面接で話せそうな経験を選んでください
          </h2>
          <p className="body" style={{ marginBottom: 36, color: 'var(--text-2)' }}>
            まだうまく言葉にできていなくても大丈夫です。経験を選ぶことで、あなたらしい面接テーマを見つけやすくなります。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {TAG_CATEGORIES.map(category => (
              <div key={category.key}>
                <p style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: 'var(--text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 12,
                }}>{category.label}</p>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}>
                  {category.tags.map(tag => {
                    const isSelected = selected.has(tag)
                    const isOther = OTHER_TAGS.has(tag)
                    return (
                      <button
                        key={tag}
                        onClick={() => toggle(tag)}
                        style={{
                          padding: '9px 16px',
                          borderRadius: 999,
                          fontSize: '0.875rem',
                          fontWeight: isSelected ? 700 : 500,
                          border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                          background: isSelected ? 'var(--accent-bg)' : 'var(--surface)',
                          color: isSelected ? 'var(--accent)' : 'var(--text-2)',
                          cursor: 'pointer',
                          transition: 'all 0.12s',
                          minWidth: 'fit-content',
                          fontStyle: isOther ? 'italic' : 'normal',
                        }}
                      >
                        {isSelected ? '✓ ' : ''}{tag}
                      </button>
                    )
                  })}
                </div>

                {/* Custom input for selected "その他" tags in this category */}
                {category.otherKey && selected.has(category.otherKey) && (
                  <div style={{ marginTop: 12 }}>
                    <input
                      type="text"
                      placeholder={
                        category.key === 'work'
                          ? '例: コンビニ夜勤、ホテル清掃、コールセンター、農作業 など'
                          : '具体的に教えてください'
                      }
                      value={custom[category.otherKey] ?? ''}
                      onChange={e => setCustom(prev => ({ ...prev, [category.otherKey!]: e.target.value }))}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 14px',
                        fontSize: '0.9rem',
                        border: '1.5px solid var(--accent)',
                        borderRadius: 'var(--r)',
                        background: 'var(--accent-bg)',
                        color: 'var(--text)',
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA — sticky */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        width: '100%',
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        padding: '16px 24px',
        zIndex: 10,
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <button
            className="btn btn--primary btn--full"
            style={{ height: 52 }}
            onClick={handleNext}
          >
            {count === 0 ? '選択せずに次へ' : `${count}個の経験で次へ進む`}
          </button>
        </div>
      </div>
    </div>
  )
}
