import type { StatKey, Stats } from './types'

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

export const capStat = (n: number) => clamp(Math.round(n), 0, 100)

export const capRep = (n: number) => clamp(Math.round(n), 0, 100)

export function rhythmMark(writingScore: number): number {
  const score = clamp(writingScore, 0, 100)
  const curved = score < 90 ? (score / 90) * 3.5 : 3.5 + ((score - 90) / 10) * 1.5
  return clamp(Math.round(curved * 2) / 2, 0, 4.5)
}

export function formatRhythm(mark: number): string {
  return `리드머 ${mark.toFixed(1)}/5.0`
}

let seq = 0
export const uid = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`

export function formatWon(n: number): string {
  const sign = n < 0 ? '-' : ''
  const value = Math.abs(Math.round(n))
  const digits = (amount: number) => amount.toLocaleString('ko-KR')
  if (value >= 100_000_000) {
    const eok = Math.floor(value / 100_000_000)
    const rest = value % 100_000_000
    return rest ? `${sign}${digits(eok)}억 ${formatWon(rest)}` : `${sign}${digits(eok)}억`
  }
  if (value >= 10_000) {
    const man = Math.floor(value / 10_000)
    const rest = value % 10_000
    return rest ? `${sign}${digits(man)}만 ${digits(rest)}원` : `${sign}${digits(man)}만원`
  }
  return `${sign}${digits(value)}원`
}

export function formatCount(n: number): string {
  return Math.round(n).toLocaleString('ko-KR')
}

export function formatRep(rep: number): string {
  return `${Math.round(rep)}/100`
}

export function repLabel(rep: number): string {
  if (rep >= 72) return '국힙'
  if (rep >= 48) return '유명'
  if (rep >= 24) return '신인'
  if (rep >= 8) return '언더'
  return '지망'
}

export function isRapName(name: string): boolean {
  const next = name.trim()
  return next.length >= 1 && next.length <= 20
}

export const VISIBLE_STATS: StatKey[] = ['lyric', 'compose', 'club', 'pr']

export function topStat(stats: Stats): StatKey {
  return VISIBLE_STATS.reduce((best, key) => (stats[key] > stats[best] ? key : best))
}

export function avgStat(stats: Stats): number {
  const total = VISIBLE_STATS.reduce((sum, key) => sum + stats[key], 0)
  return total / VISIBLE_STATS.length
}

const STAT_LABEL: Record<StatKey, string> = {
  lyric: '라임',
  compose: '비트',
  flow: '포켓',
  club: '라이브',
  pr: '언플',
}

export function statLabel(key: StatKey): string {
  return STAT_LABEL[key]
}

function jongseong(word: string): number {
  const last = word.charCodeAt(word.length - 1)
  if (last < 0xac00 || last > 0xd7a3) return 0
  return (last - 0xac00) % 28
}

function hasBatchim(word: string): boolean {
  return jongseong(word) !== 0
}

export function euro(word: string): string {
  const j = jongseong(word)
  return `${word}${j === 0 || j === 8 ? '로' : '으로'}`
}

export function eul(word: string): string {
  return `${word}${hasBatchim(word) ? '을' : '를'}`
}

export function wa(word: string): string {
  return `${word}${hasBatchim(word) ? '과' : '와'}`
}

export function iga(word: string): string {
  return `${word}${hasBatchim(word) ? '이' : '가'}`
}

export function eun(word: string): string {
  return `${word}${hasBatchim(word) ? '은' : '는'}`
}
