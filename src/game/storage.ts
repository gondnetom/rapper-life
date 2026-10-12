import { RIVALS } from './content'
import type { GameState, SmtmRoundRecord, Stats } from './types'

const KEY = 'rapper-life-v2'

const emptyStats = (): Stats => ({ lyric: 10, compose: 10, flow: 10, club: 10, pr: 10 })

export function freshState(): GameState {
  return {
    rapName: '',
    originId: null,
    originStory: '',
    genre: null,
    phase: 0,
    screen: 'name',
    tab: 'now',
    stats: emptyStats(),
    money: 0,
    reputation: 0,
    actionsLeft: 5,
    signedLabel: false,
    ownLabel: false,
    labelName: null,
    buzz: 1,
    phaseEventFired: false,
    shiftUsed: false,
    pendingShift: null,
    smtmTrashTalk: false,
    snakeTag: false,
    tonicEnd: false,
    smtmBestClears: -1,
    smtmWins: 0,
    smtmClearsThisSeason: 0,
    tracks: [],
    timeline: [],
    history: [],
    rivalName: RIVALS[Math.floor(Math.random() * RIVALS.length)],
    draftTitle: '',
    draftLyrics: '',
    draftCoverId: null,
    smtmRound: 0,
    smtmEarned: 0,
    smtmTeam: null,
    smtmOpponent: null,
    lastRelease: null,
    lastRepDelta: 0,
    lastPerformNote: '',
    lastYoutube: null,
    smtmLog: [],
    modal: null,
    notice: null,
    noticeTick: 0,
    beatOn: true,
    beatId: null,
    usedBeats: [],
  }
}

function readSmtmLog(value: unknown): SmtmRoundRecord[] {
  if (!Array.isArray(value)) return []
  const rows: SmtmRoundRecord[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const row = item as SmtmRoundRecord
    const result = row.result
    if (!result || typeof result.roundName !== 'string' || typeof result.passed !== 'boolean') continue
    rows.push({ phase: typeof row.phase === 'number' ? row.phase : 0, result })
  }
  return rows
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as GameState
    if (!data || typeof data.rapName !== 'string' || !data.stats || !data.screen) return null
    const base = freshState()
    return {
      ...base,
      ...data,
      stats: { ...base.stats, ...data.stats },
      buzz: typeof data.buzz === 'number' ? data.buzz : 1,
      phaseEventFired: Boolean(data.phaseEventFired),
      labelName: data.labelName ?? null,
      ownLabel: Boolean(data.ownLabel),
      originStory: typeof data.originStory === 'string' ? data.originStory : '',
      tonicEnd: Boolean(data.tonicEnd),
      noticeTick: data.noticeTick ?? 0,
      smtmTeam: data.smtmTeam ?? null,
      smtmOpponent: data.smtmOpponent ?? null,
      smtmLog: readSmtmLog(data.smtmLog),
      beatId: data.beatId ?? null,
      usedBeats: Array.isArray(data.usedBeats) ? data.usedBeats : [],
      draftCoverId: typeof data.draftCoverId === 'string' ? data.draftCoverId : null,
      tracks: (data.tracks ?? []).map((track) => ({
        ...track,
        rhythmMark: track.rhythmMark ?? 0,
        audioId: track.audioId ?? null,
        beatId: track.beatId ?? null,
        coverId: typeof track.coverId === 'string' ? track.coverId : null,
      })),
    }
  } catch {
    return null
  }
}

export function saveGame(state: GameState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function clearGame() {
  localStorage.removeItem(KEY)
}

export function loadOrFresh(): GameState {
  return loadGame() ?? freshState()
}
