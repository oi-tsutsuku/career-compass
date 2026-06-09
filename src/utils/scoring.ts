import type { Scores, PatternId, Axis } from '../types'
import { LQ } from '../data/questions'

export function calcScores(answers: number[]): Scores {
  const a = answers.map((v, i) => (LQ[i].rev ? 6 - v : v))
  const avg = (arr: number[]) => arr.reduce((s, x) => s + x, 0) / arr.length
  return {
    self:     Math.round(avg([a[0], a[1],  a[2],  a[3]])  * 20),
    social:   Math.round(avg([a[4], a[5],  a[6],  a[7]])  * 20),
    action:   Math.round(avg([a[8], a[9],  a[10], a[11]]) * 20),
    decision: Math.round(avg([a[12], a[13], a[14], a[15]]) * 20),
    depth:    Math.round(avg([a[16], a[17], a[18], a[19]]) * 20),
  }
}

export function determinePattern(sc: Scores): PatternId {
  const { self: s, social: e, action: a, decision: d, depth: dep } = sc
  const mean = (s + e + a + d + dep) / 5
  if (mean >= 72)                                               return 'advanced'
  if (e >= 68 && dep < 52)                                      return 'explorer'
  if (dep >= 68 && e < 52)                                      return 'deepdiver'
  if (a >= 68 && dep < 52)                                      return 'actioner'
  if (s >= 65 && d >= 65 && a < 48)                             return 'thinker'
  if (s >= 60 && e >= 60 && a >= 58 && dep >= 58 && d < 52)    return 'predecision'
  if (s >= 65 && e < 48)                                        return 'selffocused'
  return 'balanced'
}

export function gradeToNum(grade: string): number {
  const map: Record<string, number> = {
    '大学1年生': 1, '大学2年生': 2, '大学3年生': 3, '大学4年生': 4,
    '修士1年生': 5, '修士2年生': 6,
  }
  return map[grade] ?? 3
}

// ─── Strategy ─────────────────────────────────────────────────────────────────

export type Mode = '広げる' | '深める' | '動く' | '決める'

export interface RecommendResult {
  axis: Axis
  mode: Mode
  reason: string
}

/**
 * Determines which of the four modes (広げる/深める/動く/決める) the user
 * should prioritize next, based on grade + all 5 axis scores.
 *
 * Priority rules (first match wins):
 * 1. 1〜2年生 + social < 60          → 広げる（社会探索）
 * 2. self >= 65 + social < 55        → 広げる（自己分析済み、外へ）
 * 3. depth >= 65 + social < 55       → 広げる（深掘りより選択肢を）
 * 4. action >= 65 + depth < 55       → 深める（動きっぱなし→振り返りを）
 * 5. grade >= 3 + social >= 55 + depth < 55 → 深める（探索済み→言語化を）
 * 6. self + social + depth >= 55 each + decision < 55 → 決める
 * 7. self + social + depth >= 55 each + action < 55  → 動く
 * 8. default: weakest axis
 */
export function recommendStrategy(scores: Scores, gradeNum: number): RecommendResult {
  const { self: s, social: e, action: a, decision: d, depth: dep } = scores
  const isEarly = gradeNum <= 2
  const isLate  = gradeNum >= 3

  // 1. Early grade + low social → 広げる
  if (isEarly && e < 60) {
    return {
      axis: 'social', mode: '広げる',
      reason: `${gradeNum <= 2 ? '1〜2年生' : '学年'}の今は、自己分析より先に社会探索を広げる時期。業界・職種・OB訪問など、外の世界に触れることで自己理解もより具体的になる。`,
    }
  }

  // 2. High self + low social → 広げる
  if (s >= 65 && e < 55) {
    return {
      axis: 'social', mode: '広げる',
      reason: '自己理解は十分できている。次は外の世界（業界・職種・人）と照らし合わせることが必要。自己分析をさらに深めても、比較対象がなければ選択肢は広がらない。',
    }
  }

  // 3. High depth + low social → 広げる
  if (dep >= 65 && e < 55) {
    return {
      axis: 'social', mode: '広げる',
      reason: '深度は高いが、社会探索が不足している。深掘りをさらに続けるより、選択肢を増やすことで今の深度が活きるようになる。',
    }
  }

  // 4. High action + low depth → 深める
  if (a >= 65 && dep < 55) {
    return {
      axis: 'depth', mode: '深める',
      reason: '行動量はあるが、経験の言語化・意味づけが追いついていない。動き続けるより、一度立ち止まって「その経験から何を学んだか」を言葉にすることで、面接での語りが根本から変わる。',
    }
  }

  // 5. Late grade + social OK + low depth → 深める
  if (isLate && e >= 55 && dep < 55) {
    return {
      axis: 'depth', mode: '深める',
      reason: '社会探索は進んでいる。3年生以降は「何をしたか」より「なぜそれを選んだか・何を学んだか」を語れる深度が問われる段階。',
    }
  }

  // 6. Info sufficient + low decision → 決める
  if (s >= 55 && e >= 55 && dep >= 55 && d < 55) {
    return {
      axis: 'decision', mode: '決める',
      reason: '情報は十分に揃っている。今足りないのは比較基準。「どう選ぶか」の軸を1つ決めることで、情報収集が目的化するループから抜け出せる。',
    }
  }

  // 7. Info + depth sufficient + low action → 動く
  if (s >= 55 && e >= 55 && dep >= 55 && a < 55) {
    return {
      axis: 'action', mode: '動く',
      reason: '理解・探索・言語化は揃っている。あとは実際に動いてフィードバックを得ることで、確信と修正の両方が生まれる。',
    }
  }

  // 8. Default: weakest axis
  const candidates: { axis: Axis; score: number; mode: Mode; reason: string }[] = [
    { axis: 'social',    score: e,   mode: '広げる', reason: '業界・職種・人への接点を増やすことで、自分に合う選択肢が見えてくる。' },
    { axis: 'depth',     score: dep, mode: '深める', reason: '経験を言語化する力を高めることが、面接での説得力に直結する。' },
    { axis: 'action',    score: a,   mode: '動く',   reason: '考えるより動いてみることで、自分の反応や向き不向きが分かる。' },
    { axis: 'decision',  score: d,   mode: '決める', reason: '選択基準を1つ決めることで、情報収集が目的化しなくなる。' },
    { axis: 'self',      score: s,   mode: '深める', reason: '自分の価値観や動機をもう一段深く掘り下げることが、一貫した軸の形成につながる。' },
  ]
  const weakest = candidates.reduce((min, x) => x.score < min.score ? x : min)
  return { axis: weakest.axis, mode: weakest.mode, reason: weakest.reason }
}

/** Convenience wrapper — returns just the axis (for DepthMap visualization). */
export function recommendNextAxis(scores: Scores, gradeNum = 3): Axis {
  return recommendStrategy(scores, gradeNum).axis
}
