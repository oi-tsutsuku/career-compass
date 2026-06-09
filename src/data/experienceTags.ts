export interface TagCategory {
  key: string
  label: string
  tags: string[]
  otherKey: string | null  // tag label that triggers custom input, or null
}

export const TAG_CATEGORIES: TagCategory[] = [
  {
    key: 'campus',
    label: '🎓 学内活動',
    otherKey: 'その他学内活動',
    tags: [
      'ゼミ・研究',
      '学園祭運営',
      '学生団体',
      '部活動',
      'サークル',
      '留学',
      '卒業研究',
      '授業内プロジェクト',
      'その他学内活動',
    ],
  },
  {
    key: 'work',
    label: '💼 アルバイト・仕事',
    otherKey: 'その他アルバイト・仕事',
    tags: [
      '飲食',
      '接客',
      '販売',
      '塾講師',
      '家庭教師',
      '事務',
      '長期アルバイト',
      '短期アルバイト',
      'インターン',
      '新人教育',
      'リーダー経験',
      'その他アルバイト・仕事',
    ],
  },
  {
    key: 'relation',
    label: '🤝 人との関わり',
    otherKey: 'その他人との関わり',
    tags: [
      'チーム運営',
      'リーダー',
      '副リーダー',
      '意見調整',
      '後輩指導',
      'メンバー育成',
      '相談に乗った経験',
      '初対面の人との関係づくり',
      'その他人との関わり',
    ],
  },
  {
    key: 'challenge',
    label: '🚀 挑戦経験',
    otherKey: 'その他挑戦経験',
    tags: [
      'イベント企画',
      'SNS運営',
      '動画制作',
      'プログラミング',
      '起業活動',
      '副業',
      'ボランティア',
      'コンテスト参加',
      '資格取得',
      '海外経験',
      'その他挑戦経験',
    ],
  },
  {
    key: 'personal',
    label: '🌱 個人的経験',
    otherKey: 'その他個人的経験',
    tags: [
      '受験経験',
      'スポーツ継続',
      '趣味継続',
      '大きな挫折経験',
      '大きな成功経験',
      '家族のサポート',
      '地域活動',
      'その他個人的経験',
    ],
  },
]

/** All "その他" tag labels that trigger a custom text input */
export const OTHER_TAGS = new Set(
  TAG_CATEGORIES
    .map(c => c.otherKey)
    .filter((k): k is string => k !== null),
)
