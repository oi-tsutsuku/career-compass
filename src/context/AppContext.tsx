import { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { AppState, Screen, BasicInfo, PatternId, Scores } from '../types'
import { LQ, DQ } from '../data/questions'

const initial: AppState = {
  screen: 'landing',
  basicInfo: { grade: '', status: '', area: '' },
  lightAnswers: Array(LQ.length).fill(0) as number[],
  detailAnswers: Array(DQ.length).fill(null) as (number | null)[],
  scores: null,
  pattern: null,
  report: '',
  consent: false,
}

type Action =
  | { type: 'GO'; screen: Screen }
  | { type: 'SET_BASIC'; info: BasicInfo }
  | { type: 'SET_CONSENT'; value: boolean }
  | { type: 'SET_LIGHT_ANSWER'; idx: number; value: number }
  | { type: 'SET_DETAIL_ANSWER'; idx: number; value: number }
  | { type: 'SET_RESULTS'; scores: Scores; pattern: PatternId }
  | { type: 'SET_REPORT'; report: string }
  | { type: 'RESET' }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'GO':
      return { ...state, screen: action.screen }
    case 'SET_BASIC':
      return { ...state, basicInfo: action.info }
    case 'SET_CONSENT':
      return { ...state, consent: action.value }
    case 'SET_LIGHT_ANSWER': {
      const lightAnswers = [...state.lightAnswers]
      lightAnswers[action.idx] = action.value
      return { ...state, lightAnswers }
    }
    case 'SET_DETAIL_ANSWER': {
      const detailAnswers = [...state.detailAnswers]
      detailAnswers[action.idx] = action.value
      return { ...state, detailAnswers }
    }
    case 'SET_RESULTS':
      return { ...state, scores: action.scores, pattern: action.pattern }
    case 'SET_REPORT':
      return { ...state, report: action.report }
    case 'RESET':
      return { ...initial }
    default:
      return state
  }
}

interface Ctx { state: AppState; dispatch: React.Dispatch<Action> }
const AppCtx = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial)
  return <AppCtx.Provider value={{ state, dispatch }}>{children}</AppCtx.Provider>
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
