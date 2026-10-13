import { PRODUCERS, producerNames, youtubeComments } from './content'
import { clamp } from './format'
import type { YoutubeResult } from './types'

export type RoundKind = 'bar' | 'acapella' | 'team' | 'diss'

export const SMTM_ROUNDS: { name: string; kind: RoundKind; bar: number; ripple: number; gig: number; prize: number }[] = [
  { name: '참가 영상', kind: 'bar', bar: 42, ripple: 0.08, gig: 80_000, prize: 0 },
  { name: '무반주 심사', kind: 'acapella', bar: 46, ripple: 0.1, gig: 140_000, prize: 0 },
  { name: '불구덩이', kind: 'bar', bar: 52, ripple: 0.14, gig: 280_000, prize: 0 },
  { name: '팀 선택', kind: 'team', bar: 0, ripple: 0.06, gig: 60_000, prize: 0 },
  { name: '디스전', kind: 'diss', bar: 0, ripple: 0.18, gig: 520_000, prize: 0 },
  { name: '본선', kind: 'bar', bar: 64, ripple: 0.22, gig: 1_200_000, prize: 0 },
  { name: '파이널', kind: 'bar', bar: 74, ripple: 0.35, gig: 3_600_000, prize: 1_000_000_000 },
]

const VIEW_BASE = [8_000, 22_000, 60_000, 40_000, 180_000, 420_000, 900_000]

export function isAcapellaScreen(screen: string, roundIndex: number): boolean {
  if (screen !== 'smtmWrite' && screen !== 'smtmStage') return false
  return SMTM_ROUNDS[roundIndex]?.kind === 'acapella'
}

export function rivalPower(phase: number): number {
  return 48 + phase * 6 + Math.floor(Math.random() * 8)
}

export function roundPassed(roundIndex: number, judgement: number, rival: number): boolean {
  const round = SMTM_ROUNDS[roundIndex]
  if (round.kind === 'team') return true
  if (round.kind === 'diss') return judgement > rival
  return judgement >= round.bar
}

export function smtmSeasonLabel(clears: number): string {
  if (clears >= SMTM_ROUNDS.length) return '파이널 우승'
  return `${SMTM_ROUNDS[clears].name} 탈락`
}

export function smtmCareerLabel(bestClears: number, trash: boolean): string {
  if (bestClears < 0 && trash) return '뱀새끼 발언'
  if (bestClears < 0) return '불참'
  return smtmSeasonLabel(bestClears)
}

export function producerFor(roundIndex: number, teamId: string | null) {
  if (teamId) {
    const picked = PRODUCERS.find((item) => item.id === teamId)
    if (picked) return picked
  }
  return PRODUCERS[roundIndex % PRODUCERS.length]
}

export function buildYoutube(opts: {
  roundIndex: number
  score: number
  judgement: number
  passed: boolean
  pr: number
  snake: boolean
  rivalScore: number | null
  rivalName: string | null
  seasonEarned: number
  rapName: string
  teamId: string | null
  gig: number
  ripple: number
  prize: number
}): YoutubeResult {
  const round = SMTM_ROUNDS[opts.roundIndex]
  const producer = producerFor(opts.roundIndex, opts.teamId)
  let views = VIEW_BASE[opts.roundIndex] * (opts.score / 65) * (1 + opts.pr / 80)
  if (opts.snake) views *= 1.45
  if (!opts.passed) views *= 0.55
  views = Math.round(Math.max(800, views))
  const likeRate = clamp(0.04 + opts.score / 2200 - (opts.snake ? 0.01 : 0), 0.02, 0.14)
  return {
    roundIndex: opts.roundIndex,
    roundName: round.name,
    views,
    likes: Math.round(views * likeRate),
    comments: youtubeComments(opts.rapName, opts.passed, opts.snake, round.name, opts.rivalName ?? undefined),
    passed: opts.passed,
    gig: opts.gig,
    ripple: opts.ripple,
    prize: opts.prize,
    score: opts.score,
    judgement: opts.judgement,
    rivalScore: opts.rivalScore,
    rivalName: opts.rivalName,
    producer: producerNames(producer),
    producerLine: producer.meme,
    seasonEarned: opts.seasonEarned,
  }
}
