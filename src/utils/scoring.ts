import type { Scores, PatternId } from '../types'
import { LQ } from '../data/questions'

export function calcScores(answers: number[]): Scores {
  const a = answers.map((v, i) => (LQ[i].rev ? 6 - v : v))
  const avg = (arr: number[]) => arr.reduce((s, x) => s + x, 0) / arr.length

  return {
    self:     Math.round(avg([a[0], a[1], a[2],  a[3]])  * 20),
    social:   Math.round(avg([a[4], a[5], a[6],  a[7]])  * 20),
    action:   Math.round(avg([a[8], a[9], a[10], a[11]]) * 20),
    decision: Math.round(avg([a[12],a[13],a[14], a[15]]) * 20),
    depth:    Math.round(avg([a[16],a[17],a[18], a[19]]) * 20),
  }
}

export function determinePattern(sc: Scores): PatternId {
  const { self: s, social: e, action: a, decision: d, depth: dep } = sc
  const mean = [s, e, a, d, dep].reduce((x, y) => x + y, 0) / 5

  if (mean >= 72)                               return 'advanced'
  if (e >= 68 && dep < 52)                      return 'explorer'
  if (dep >= 68 && e < 52)                      return 'deepdiver'
  if (a >= 68 && dep < 52)                      return 'actioner'
  if (s >= 65 && d >= 65 && a < 48)             return 'thinker'
  if (s >= 60 && e >= 60 && a >= 58 && dep >= 58 && d < 52) return 'predecision'
  if (s >= 65 && e < 48)                        return 'selffocused'
  return 'balanced'
}

export function gradeToNum(grade: string): number {
  const map: Record<string, number> = {
    '大学1年生': 1, '大学2年生': 2, '大学3年生': 3, '大学4年生': 4,
    '修士1年生': 5, '修士2年生': 6,
  }
  return map[grade] ?? 3
}

export function scoreLevel(score: number): string {
  if (score >= 80) return '高'
  if (score >= 55) return '中'
  return '低'
}
