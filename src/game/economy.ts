import type { PendingShift } from './types'
import { capRep } from './format'

const PHASE_BASE = [180_000, 720_000, 2_400_000]

export function fameMult(reputation: number): number {
  return 1 + reputation / 28
}

export function careerMult(phase: number): number {
  return 1 + phase * 1.15
}

export function smtmMult(bestClears: number): number {
  if (bestClears >= 7) return 6.5
  if (bestClears >= 6) return 4.2
  if (bestClears >= 5) return 3.1
  if (bestClears >= 3) return 2.2
  if (bestClears >= 1) return 1.45
  return 1
}

export function payScale(opts: { reputation: number; phase: number; smtmBestClears: number; buzz: number }): number {
  return fameMult(opts.reputation) * careerMult(opts.phase) * smtmMult(opts.smtmBestClears) * Math.max(1, opts.buzz)
}

export function releasePayout(opts: {
  phase: number
  score: number
  pr: number
  signed: boolean
  reputation: number
  shift: PendingShift | null
  buzz: number
  smtmBestClears: number
}): { moneyGain: number; repDelta: number; reputation: number } {
  const base = PHASE_BASE[opts.phase] ?? PHASE_BASE[0]
  let moneyGain =
    base *
    (opts.score / 70) *
    (opts.signed ? 1.35 : 1) *
    (1 + opts.pr / 90) *
    payScale({ reputation: opts.reputation, phase: opts.phase, smtmBestClears: opts.smtmBestClears, buzz: opts.buzz })
  let repDelta = Math.round((opts.score - (52 + opts.phase * 4)) * 0.16)
  if (opts.shift?.outcome === 'boom') {
    moneyGain *= 1 + opts.shift.magnitude * 0.35
    repDelta += Math.round(4 * opts.shift.magnitude)
  } else if (opts.shift?.outcome === 'bust') {
    moneyGain *= Math.max(0.45, 0.92 - opts.shift.magnitude * 0.12)
    repDelta -= Math.round(4 * opts.shift.magnitude)
  }
  moneyGain = Math.max(0, Math.round(moneyGain))
  const reputation = capRep(opts.reputation + repDelta)
  return { moneyGain, repDelta: reputation - opts.reputation, reputation }
}

export function prEventChance(base: number, pr: number): number {
  return base * (1 + pr / 140)
}
