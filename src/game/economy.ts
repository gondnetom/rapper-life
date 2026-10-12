import type { PendingShift } from './types'
import { capRep } from './format'

const PHASE_BASE = [45_000, 160_000, 380_000]

export function releasePayout(opts: {
  phase: number
  score: number
  pr: number
  signed: boolean
  reputation: number
  shift: PendingShift | null
  buzz: number
}): { moneyGain: number; repDelta: number; reputation: number } {
  const base = PHASE_BASE[opts.phase] ?? PHASE_BASE[0]
  let moneyGain = base * (opts.score / 70) * (opts.signed ? 1.28 : 1) * (1 + opts.pr / 160) * opts.buzz
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
