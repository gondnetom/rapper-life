import { RIVALS, readGenre } from './content'
import type { GameState, PendingShift, SmtmRoundRecord, SmtmSeason, Stats } from './types'

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
    smtmAppeared: false,
    snakeTag: false,
    nepotismTag: false,
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
    smtmSeasons: [],
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
    rows.push({
      phase: typeof row.phase === 'number' ? row.phase : 0,
      result: { ...result, nepotism: Boolean(result.nepotism) },
    })
  }
  return rows
}

function readShift(shift: PendingShift | null | undefined): PendingShift | null {
  if (!shift) return null
  const from = readGenre(shift.from)
  const to = readGenre(shift.to)
  if (!from || !to || from === to) return null
  return { ...shift, from, to }
}

function hadSmtmAppearance(data: Partial<GameState>): boolean {
  if (data.smtmAppeared) return true
  if (Array.isArray(data.smtmLog) && data.smtmLog.length > 0) return true
  if (typeof data.smtmBestClears === 'number' && data.smtmBestClears >= 0) return true
  if (typeof data.smtmWins === 'number' && data.smtmWins > 0) return true
  if (typeof data.smtmTeam === 'string' && data.smtmTeam) return true
  const seasons = Array.isArray(data.smtmSeasons) ? data.smtmSeasons : []
  return seasons.some((item) => item && item.label !== '불참' && item.label !== '뱀새끼 발언')
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as GameState
    if (!data || typeof data.rapName !== 'string' || !data.stats || !data.screen) return null
    const base = freshState()
    const smtmAppeared = hadSmtmAppearance(data)
    return {
      ...base,
      ...data,
      smtmAppeared,
      snakeTag: Boolean(data.snakeTag) || (Boolean(data.smtmTrashTalk) && smtmAppeared),
      nepotismTag: Boolean(data.nepotismTag) || readSmtmLog(data.smtmLog).some((row) => row.result.nepotism),
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
      smtmSeasons: Array.isArray(data.smtmSeasons)
        ? data.smtmSeasons.filter((item): item is SmtmSeason => Boolean(item && typeof item.phase === 'number' && typeof item.label === 'string'))
        : [],
      tab: data.tab === 'album' || data.tab === 'log' ? data.tab : 'now',
      genre: readGenre(data.genre),
      originId: readGenre(data.originId) ?? data.originId,
      pendingShift: readShift(data.pendingShift),
      lastRelease: data.lastRelease
        ? { ...data.lastRelease, genre: readGenre(data.lastRelease.genre) ?? 'trap' }
        : null,
      history: (data.history ?? []).map((item) => ({
        ...item,
        genre: readGenre(item.genre) ?? 'trap',
      })),
      beatId: typeof data.beatId === 'string' && data.beatId.startsWith('mumble') ? null : data.beatId ?? null,
      usedBeats: Array.isArray(data.usedBeats) ? data.usedBeats.filter((id) => !id.startsWith('mumble')) : [],
      draftCoverId: typeof data.draftCoverId === 'string' ? data.draftCoverId : null,
      tracks: (data.tracks ?? []).map((track) => ({
        ...track,
        genre: readGenre(track.genre) ?? 'trap',
        rhythmMark: track.rhythmMark ?? 0,
        audioId: track.audioId ?? null,
        beatId: typeof track.beatId === 'string' && track.beatId.startsWith('mumble') ? null : track.beatId ?? null,
        coverId: typeof track.coverId === 'string' ? track.coverId : null,
        source: track.source === 'smtm' ? 'smtm' : 'release',
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
