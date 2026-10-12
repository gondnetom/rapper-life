import type { StatKey, Stats } from './types'

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

export const capStat = (n: number) => clamp(Math.round(n), 0, 100)

export const capRep = (n: number) => clamp(Math.round(n), 0, 100)

export function rhythmMark(writingScore: number): number {
  const score = clamp(writingScore, 0, 100)
  const curved = score < 90 ? (score / 90) * 3.5 : 3.5 + ((score - 90) / 10) * 1.5
  return clamp(Math.round(curved * 2) / 2, 0, 5)
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
  return `${Math.round(rep)}/100 ${repLabel(rep)}`
}

export function repLabel(rep: number): string {
  if (rep >= 72) return '국힙'
  if (rep >= 48) return '네임드'
  if (rep >= 24) return '입갤'
  if (rep >= 8) return '언더'
  return '지망'
}

export function isRapName(name: string): boolean {
  return /^[0-9A-Za-z가-힣]{2,12}$/.test(name)
}

export function topStat(stats: Stats): StatKey {
  const keys: StatKey[] = ['lyric', 'compose', 'flow', 'club', 'pr']
  return keys.reduce((best, key) => (stats[key] > stats[best] ? key : best))
}

export function avgStat(stats: Stats): number {
  return (stats.lyric + stats.compose + stats.flow + stats.club + stats.pr) / 5
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

function hasBatchim(word: string): boolean {
  const last = word.charCodeAt(word.length - 1)
  return last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0
}

export function euro(word: string): string {
  return `${word}${hasBatchim(word) ? '으로' : '로'}`
}

export function eul(word: string): string {
  return `${word}${hasBatchim(word) ? '을' : '를'}`
}

export function wa(word: string): string {
  return `${word}${hasBatchim(word) ? '과' : '와'}`
}
