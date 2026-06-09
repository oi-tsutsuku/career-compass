export type Screen =
  | 'landing'
  | 'basicInfo'
  | 'lightQuiz'
  | 'results'
  | 'detailQuiz'
  | 'report'

export type Axis = 'self' | 'social' | 'action' | 'decision' | 'depth'

export type PatternId =
  | 'explorer'
  | 'deepdiver'
  | 'actioner'
  | 'thinker'
  | 'advanced'
  | 'predecision'
  | 'selffocused'
  | 'balanced'

export interface Scores {
  self: number
  social: number
  action: number
  decision: number
  depth: number
}

export interface BasicInfo {
  grade: string
  status: string
  area: string
}

export interface LightQuestion {
  text: string
  axis: Axis
  rev?: boolean
}

export interface DetailQuestion {
  text: string
  type: 'ab' | 'scale'
  a?: string
  b?: string
  axis?: Axis
}

export interface Pattern {
  id: PatternId
  name: string
  emoji: string
  hl: (grade: number) => string
  desc: string
  strengths: string[]
  tip: string
  cautions: string[]
  nextSteps: string[]
}

export interface AppState {
  screen: Screen
  basicInfo: BasicInfo
  lightAnswers: number[]
  detailAnswers: (number | null)[]
  scores: Scores | null
  pattern: PatternId | null
  report: string
  consent: boolean
}
