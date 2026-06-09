// ─────────────────────────────────────────────────────────────
// scoring.js  —  スコア計算・パターン判定・学年メッセージ
// ─────────────────────────────────────────────────────────────
import { LQ } from './data.js'

/**
 * 20問の回答（1-5）からスコアを算出する
 * 逆転項目（LQ[i].rev === true）は 6-v で反転
 * 各軸 0-100 の整数で返す
 */
export function calcScores(answers) {
  const a = answers.map((v, i) => (LQ[i].rev ? 6 - v : v))
  const avg = arr => arr.reduce((s, x) => s + x, 0) / arr.length
  return {
    self:     Math.round(avg([a[0],  a[1],  a[2],  a[3]])  * 20),
    social:   Math.round(avg([a[4],  a[5],  a[6],  a[7]])  * 20),
    action:   Math.round(avg([a[8],  a[9],  a[10], a[11]]) * 20),
    decision: Math.round(avg([a[12], a[13], a[14], a[15]]) * 20),
    depth:    Math.round(avg([a[16], a[17], a[18], a[19]]) * 20),
  }
}

/** 学年文字列 → 数値（1-5） */
export function gradeNum(grade) {
  if (!grade) return 3
  if (grade.includes('1年')) return 1
  if (grade.includes('2年')) return 2
  if (grade.includes('3年')) return 3
  if (grade.includes('4年')) return 4
  if (grade.includes('修士')) return 5
  return 3
}

/** スコアからパターンキーを返す */
export function determinePattern(sc) {
  const { self: s, social: e, action: a, decision: d, depth: dep } = sc
  const mean = [s, e, a, d, dep].reduce((x, y) => x + y, 0) / 5
  if (mean >= 72)             return 'advanced'
  if (e >= 68 && dep < 52)    return 'explorer'
  if (dep >= 68 && e < 52)    return 'deepdiver'
  if (a >= 68 && dep < 52)    return 'actioner'
  if (s >= 65 && d >= 65 && a < 48) return 'thinker'
  if (s >= 60 && e >= 60 && a >= 58 && dep >= 58 && d < 52) return 'predecision'
  if (s >= 65 && e < 48)      return 'selffocused'
  return 'balanced'
}

/** 学年別メッセージ（キーは gradeNum の返り値） */
export const GRADE_MSGS = {
  1: 'まだ決めきる必要はありません。今は選択肢を広げることが、将来の納得感につながる可能性があります。',
  2: 'まだ決めきる必要はありません。いろいろな世界を見ておくことで、将来の選択肢が増える可能性があります。',
  3: '探索を広げる時期から、経験を意味づける時期に入り始めています。気になる企業や経験を、面接で話せる言葉に変えていくことが次の一歩になりそうです。',
  4: '選択肢を比較するだけでなく、自分なりの判断基準を言語化することが重要になりやすい時期です。深度を高めることで、志望動機や自己PRに説得力が出やすくなります。',
  5: '修士での研究経験や専門性は、それ自体が強みになる可能性があります。研究と職業の接点をどう言語化するかが鍵になりそうです。',
}

/**
 * 軸ごとのスコア説明文
 * @param {'self'|'social'|'action'|'decision'|'depth'} axis
 * @param {number} val 0-100
 */
export function scoreDesc(axis, val) {
  const map = {
    self: [
      [80, '自分の強みと価値観が、言葉として整理されている傾向があります'],
      [55, '自己理解が育ちつつある段階かもしれません'],
      [0,  '自分の強みを言語化するプロセスの途中にある可能性があります'],
    ],
    social: [
      [80, '多様な業界・企業との接点を積極的に広げている傾向があります'],
      [55, '業界探索が少しずつ広がっている段階かもしれません'],
      [0,  'まずは気になる業界を1つ、深く見てみることが次の一歩になりそうです'],
    ],
    action: [
      [80, '就活に向けた行動量が多く、経験を積んでいる傾向があります'],
      [55, '行動への意識が高まってきている段階かもしれません'],
      [0,  '小さな一歩でも行動に移すことで、見えてくるものがあるかもしれません'],
    ],
    decision: [
      [80, '自分なりの判断基準が育ってきている傾向があります'],
      [55, '判断の軸を模索している段階かもしれません'],
      [0,  'まず「何を大切にしたいか」を言葉にする作業が次の一歩になりそうです'],
    ],
    depth: [
      [80, '経験を面接で伝えられるレベルまで意味づけできている傾向があります'],
      [55, '経験の言語化が少しずつ進んでいる段階かもしれません'],
      [0,  '経験を「なぜそう感じたか」まで掘り下げると、面接での説得力が高まります'],
    ],
  }
  for (const [thresh, text] of map[axis]) {
    if (val >= thresh) return text
  }
}

/** 結果画面「そう見える理由」を3件以内で返す */
export function reasonTexts(sc) {
  const { self: s, social: e, action: a, decision: d, depth: dep } = sc
  const r = []
  if (e  >= 65) r.push('複数の業界や企業に関心を持ち、広く情報を集める傾向があります')
  if (s  >= 65) r.push('自分の強みや価値観をある程度言語化できている傾向があります')
  if (a  >= 65) r.push('情報収集だけでなく、行動に移す意識が高い傾向があります')
  if (dep >= 65) r.push('経験を「なぜそう感じたか」まで掘り下げて考える傾向があります')
  if (d  < 50)  r.push('複数の選択肢から一つに絞る判断プロセスに、まだ課題を感じている可能性があります')
  if (dep < 50) r.push('経験を面接用に意味づけする余地がまだありそうです')
  if (r.length === 0) r.push('全体的にバランスよく就活の準備が進んでいる傾向があります')
  return r.slice(0, 3)
}
