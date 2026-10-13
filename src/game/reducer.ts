import { DISS_OPPONENTS, GENRE_LABEL, PHASES, PRODUCERS, genreStart, hipgalLines, labelOffers, rhythmLines, trainActions, trainNotice, trashReactions } from './content'
import { payScale, releasePayout } from './economy'
import { forcedEvent, rollTrainingEvent, shiftModal, shiftSwing } from './events'
import { capRep, capStat, eul, eun, euro, formatWon, isRapName, rhythmMark, statLabel, uid, wa } from './format'
import { scoreLyrics } from './lyricsScore'
import { freshState } from './storage'
import { SMTM_ROUNDS, buildYoutube, nepotismPass, rivalPower, roundPassed, smtmSeasonLabel } from './smtm'
import { pickBeat } from '../audio/beats'
import type { GameState, Genre, PerformResult, StatKey, TimelineItem, TrainId, YoutubeResult } from './types'

export type Dispatch = (action: Action) => void

export type Action =
  | { type: 'set-name'; name: string }
  | { type: 'pick-origin'; id: string }
  | { type: 'ack-story' }
  | { type: 'train'; id: TrainId }
  | { type: 'resolve-event'; choice: string }
  | { type: 'set-draft'; title?: string; lyrics?: string; coverId?: string | null }
  | { type: 'submit-release' }
  | { type: 'skip-stage' }
  | { type: 'finish-release'; result: PerformResult; audioId: string | null; skipped?: boolean }
  | { type: 'ack-reaction' }
  | { type: 'pick-label'; name: string | null }
  | { type: 'found-label' }
  | { type: 'stay-label' }
  | { type: 'smtm-join' }
  | { type: 'smtm-skip' }
  | { type: 'smtm-trash' }
  | { type: 'smtm-team'; id: string }
  | { type: 'submit-smtm' }
  | { type: 'finish-smtm'; result: PerformResult; skipped?: boolean; audioId?: string | null }
  | { type: 'ack-youtube' }
  | { type: 'set-tab'; tab: GameState['tab'] }
  | { type: 'set-beat'; on: boolean }
  | { type: 'restart' }

function line(state: GameState, title: string, detail: string): TimelineItem {
  return { id: uid(), phase: state.phase, title, detail }
}

function performScore(state: GameState, lyrics: string, target: number, result: PerformResult) {
  const writing = scoreLyrics(lyrics, target, state.stats.lyric)
  let perform = result.score
  let note = ''
  if (result.micMissing) {
    perform = Math.max(20, Math.min(74, state.stats.lyric * 0.45 + state.stats.club * 0.35 + 10))
    note = '마이크가 안 열려서, 라임이랑 라이브로 공연 점수를 메웠다.'
  }
  const score = Math.max(0, Math.min(100, writing * 0.45 + perform * 0.55))
  return { writing, perform, score, note }
}

function skipPerform(state: GameState, lyrics: string, target: number) {
  const writing = scoreLyrics(lyrics, target, state.stats.lyric)
  const perform = Math.max(38, Math.min(68, 42 + state.stats.lyric * 0.12 + state.stats.club * 0.1))
  const score = Math.max(0, Math.min(100, writing * 0.45 + perform * 0.55))
  return { writing, perform, score, note: '녹음을 넘겼다. 가사랑 실력으로 중간 점수를 받았다.' }
}

function emptySkip(): PerformResult {
  return {
    micMissing: true,
    recognitionFailed: true,
    transcript: '',
    overlap: 0,
    timing: 0,
    energy: 0,
    score: 0,
    blob: null,
  }
}

function scalePay(state: GameState, amount: number): number {
  return Math.round(amount * payScale({
    reputation: state.reputation,
    phase: state.phase,
    smtmBestClears: state.smtmBestClears,
    buzz: state.buzz,
  }))
}

function assignBeat(state: GameState): GameState {
  if (!state.genre) return state
  const beat = pickBeat(state.genre, state.usedBeats)
  return { ...state, beatId: beat.id, usedBeats: [...state.usedBeats, beat.id] }
}

function beginPhase(state: GameState, phase: number): GameState {
  const next: GameState = {
    ...state,
    phase,
    actionsLeft: 5,
    screen: 'train',
    tab: 'now',
    draftTitle: '',
    draftLyrics: '',
    draftCoverId: null,
    smtmRound: 0,
    smtmEarned: 0,
    smtmClearsThisSeason: 0,
    smtmOpponent: null,
    lastYoutube: null,
    modal: null,
    phaseEventFired: false,
  }
  if (phase > 0 && state.genre) next.modal = shiftModal(state.genre)
  return next
}

function endCareer(state: GameState, notice: string, title: string, detail: string): GameState {
  return {
    ...state,
    history: [
      ...state.history,
      { phase: state.phase, money: state.money, reputation: state.reputation, stats: { ...state.stats }, genre: state.genre },
    ],
    modal: null,
    screen: 'retire',
    tab: 'now',
    tonicEnd: true,
    actionsLeft: 0,
    notice,
    draftLyrics: '',
    draftTitle: '',
    draftCoverId: null,
    timeline: [...state.timeline, line(state, title, detail)],
  }
}

function finishPhase(state: GameState): GameState {
  const history = [
    ...state.history,
    {
      phase: state.phase,
      money: state.money,
      reputation: state.reputation,
      stats: { ...state.stats },
      genre: state.genre,
    },
  ]
  const withHistory = { ...state, history, modal: null }
  if (state.phase === 0) return { ...withHistory, screen: 'labelPick', tab: 'now' }
  if (state.phase === 1) return { ...withHistory, screen: 'labelFuture', tab: 'now' }
  if (state.phase >= 2) {
    return {
      ...withHistory,
      screen: 'retire',
      tab: 'now',
      draftLyrics: '',
      draftTitle: '',
      draftCoverId: null,
    }
  }
  return beginPhase(withHistory, state.phase + 1)
}

function afterTrain(state: GameState): GameState {
  if (state.modal) return state
  if (state.actionsLeft <= 0) return assignBeat({ ...state, screen: 'write', tab: 'now' })
  return state
}

function pushSmtm(state: GameState, result: YoutubeResult) {
  return [...(state.smtmLog ?? []), { phase: state.phase, result }]
}

function openRound(state: GameState, roundIndex: number): GameState {
  const round = SMTM_ROUNDS[roundIndex]
  const base: GameState = {
    ...state,
    smtmRound: roundIndex,
    draftLyrics: '',
    draftTitle: round.name,
    lastYoutube: null,
    tab: 'now',
  }
  if (round.kind === 'team') return { ...base, screen: 'smtmTeam' }
  if (round.kind === 'diss') {
    const foe = DISS_OPPONENTS[Math.floor(Math.random() * DISS_OPPONENTS.length)]
    return assignBeat({ ...base, screen: 'smtmWrite', smtmOpponent: foe.name, rivalName: foe.name })
  }
  if (round.kind === 'acapella') return { ...base, screen: 'smtmWrite' }
  return assignBeat({ ...base, screen: 'smtmWrite' })
}

function resultLine(before: GameState, stats: GameState['stats'], money: number, reputation: number): string {
  const keys: StatKey[] = ['lyric', 'compose', 'flow', 'club', 'pr']
  const bits: string[] = []
  for (const key of keys) {
    const delta = stats[key] - before.stats[key]
    if (delta) bits.push(`${statLabel(key)} ${delta > 0 ? '+' : ''}${delta}`)
  }
  const repDelta = reputation - before.reputation
  const moneyDelta = money - before.money
  if (repDelta) bits.push(`이름값 ${repDelta > 0 ? '+' : ''}${repDelta}`)
  if (moneyDelta) bits.push(formatWon(moneyDelta))
  return bits.join(' · ')
}

function reduce(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'restart':
      return freshState()
    case 'set-tab':
      if (state.screen === 'name' || state.screen === 'origin' || state.screen === 'story') return state
      return { ...state, tab: action.tab }
    case 'set-beat':
      return { ...state, beatOn: action.on }
    case 'set-name': {
      const name = action.name.trim()
      if (!isRapName(name)) return state
      return { ...state, rapName: name, screen: 'origin' }
    }
    case 'pick-origin': {
      const start = genreStart(action.id)
      if (!start) return state
      return {
        ...state,
        originId: start.genre,
        genre: start.genre,
        stats: { ...start.stats },
        money: 40_000,
        reputation: 8,
        screen: 'story',
        originStory: start.story.replaceAll('{name}', eun(state.rapName)),
        timeline: [],
      }
    }
    case 'ack-story': {
      const story = state.originStory.trim()
      if (!story) return state
      return beginPhase(
        {
          ...state,
          originStory: story,
          timeline: [line(state, '입문', story)],
        },
        0,
      )
    }
    case 'set-draft':
      return {
        ...state,
        draftTitle: action.title ?? state.draftTitle,
        draftLyrics: action.lyrics ?? state.draftLyrics,
        draftCoverId: action.coverId === undefined ? state.draftCoverId : action.coverId,
      }
    case 'train': {
      if (state.modal || state.screen !== 'train' || state.actionsLeft <= 0) return state
      const spec = trainActions(state.phase).find((item) => item.id === action.id)
      if (!spec) return state
      if (action.id === 'tonic') {
        const hit = Math.random() < 0.6
        if (!hit) {
          const detail = trainNotice('tonic', false)
          return endCareer(state, detail, '보약', detail)
        }
        const stats = { ...state.stats }
        const keys: StatKey[] = ['lyric', 'compose', 'flow', 'club', 'pr']
        for (const key of keys) stats[key] = capStat(stats[key] + 26)
        const reputation = capRep(state.reputation + 8)
        const next: GameState = {
          ...state,
          stats,
          reputation,
          actionsLeft: state.actionsLeft - 1,
          notice: [trainNotice('tonic', true), resultLine(state, stats, state.money, reputation)].join('\n'),
          timeline: [...state.timeline, line(state, '보약', trainNotice('tonic', true))],
        }
        return afterTrain(next)
      }
      const primary = state.stats[spec.stat]
      const chance = action.id === 'throat' ? 0.8 : Math.max(0.36, Math.min(0.9, 0.4 + primary / 230))
      const ok = Math.random() < chance
      const stats = { ...state.stats }
      let money = state.money
      let reputation = state.reputation
      if (ok && action.id === 'throat') {
        stats.club = capStat(stats.club + 5)
      } else if (ok && action.id === 'insta') {
        stats.pr = capStat(stats.pr + 8 + Math.floor(Math.random() * 4))
        money += scalePay({ ...state, stats }, 28_000 * (1 + stats.pr / 90))
        reputation = capRep(reputation + 1)
      } else if (ok && action.id === 'club') {
        stats.club = capStat(stats.club + 6 + Math.floor(Math.random() * 4))
        money += scalePay({ ...state, stats }, 48_000 * (1 + stats.club / 80))
        reputation = capRep(reputation + 1)
      } else if (ok) {
        stats[spec.stat] = capStat(stats[spec.stat] + 6 + Math.floor(Math.random() * 4))
        reputation = capRep(reputation + 1)
      } else if (action.id === 'insta') {
        reputation = capRep(reputation - 2)
      } else {
        stats[spec.stat] = capStat(stats[spec.stat] + 1)
      }
      const next: GameState = {
        ...state,
        stats,
        money,
        reputation,
        actionsLeft: state.actionsLeft - 1,
        notice: [trainNotice(action.id, ok, state.phase), resultLine(state, stats, money, reputation)].filter(Boolean).join('\n'),
        timeline: [
          ...state.timeline,
          line(state, spec.label, [trainNotice(action.id, ok, state.phase), resultLine(state, stats, money, reputation)].filter(Boolean).join(' ')),
        ],
      }
      let event = rollTrainingEvent(next)
      if (!event && !next.phaseEventFired && next.actionsLeft === 3) event = forcedEvent(next)
      if (!event) return afterTrain(next)
      return afterTrain({
        ...next,
        modal: event,
        phaseEventFired: true,
        rivalName: event.rivalName ?? next.rivalName,
      })
    }
    case 'resolve-event':
      return afterTrain(resolveEvent(state, action.choice))
    case 'submit-release': {
      const title = state.draftTitle.trim()
      const lyrics = state.draftLyrics
      if (!title || !/[가-힣]/.test(lyrics)) return state
      return { ...state, draftTitle: title, screen: 'stage', tab: 'now' }
    }
    case 'skip-stage': {
      const skipped = skipPerform(state, state.draftLyrics, state.screen === 'smtmStage' ? 2 : 4)
      const result: PerformResult = { ...emptySkip(), score: skipped.perform }
      if (state.screen === 'smtmStage') return reduce(state, { type: 'finish-smtm', result, skipped: true })
      if (state.screen === 'stage') return reduce(state, { type: 'finish-release', result, audioId: null, skipped: true })
      return state
    }
    case 'finish-release': {
      if (!state.genre) return state
      const judged = action.skipped
        ? skipPerform(state, state.draftLyrics, 4)
        : performScore(state, state.draftLyrics, 4, action.result)
      const payout = releasePayout({
        phase: state.phase,
        score: judged.score,
        pr: state.stats.pr,
        signed: state.signedLabel,
        reputation: state.reputation,
        shift: state.pendingShift,
        buzz: state.buzz,
        smtmBestClears: state.smtmBestClears,
      })
      const shift = state.pendingShift?.outcome ?? null
      const track = {
        id: uid(),
        phase: state.phase,
        title: state.draftTitle.trim(),
        lyrics: state.draftLyrics.trim(),
        genre: state.genre,
        score: Math.round(judged.score),
        writingScore: Math.round(judged.writing),
        performScore: Math.round(judged.perform),
        hipgal: hipgalLines(state.rapName, judged.score, shift, state.snakeTag, state.genre),
        rhythm: rhythmLines(judged.writing, shift),
        rhythmMark: rhythmMark(judged.writing),
        audioId: action.audioId,
        beatId: state.beatId,
        coverId: state.draftCoverId,
        money: payout.moneyGain,
        shift,
        source: 'release' as const,
      }
      const shiftDetail =
        shift === 'boom' ? '노선을 바꿨더니 반응이 좋았다.' : shift === 'bust' ? '노선을 바꿨더니 반응이 별로였다.' : '곡을 냈다.'
      return {
        ...state,
        money: state.money + payout.moneyGain,
        reputation: payout.reputation,
        tracks: [...state.tracks, track],
        lastRelease: track,
        lastRepDelta: payout.repDelta,
        lastPerformNote: judged.note,
        pendingShift: null,
        draftCoverId: null,
        screen: 'reaction',
        tab: 'now',
        timeline: [...state.timeline, line(state, track.title, `${shiftDetail} 공개 점수는 ${track.score}점이다.`)],
      }
    }
    case 'ack-reaction':
      return { ...state, screen: 'smtmOffer', tab: 'now' }
    case 'pick-label': {
      if (state.screen !== 'labelPick') return state
      if (!action.name) {
        return beginPhase(
          {
            ...state,
            signedLabel: false,
            ownLabel: false,
            labelName: null,
            notice: '계약을 거절하고, 인디로 전성기에 들어갔다.',
            timeline: [...state.timeline, line(state, '인디', '초창기가 끝나고 소속 없이 넘어갔다.')],
          },
          1,
        )
      }
      if (state.signedLabel && action.name === state.labelName) {
        return beginPhase(
          {
            ...state,
            notice: `${state.labelName}에 남았다.`,
            timeline: [...state.timeline, line(state, '잔류', `${state.labelName} 계약을 유지했다.`)],
          },
          1,
        )
      }
      const offer = labelOffers(state.reputation).find((item) => item.name === action.name)
      if (!offer) return state
      return beginPhase(
        {
          ...state,
          signedLabel: true,
          ownLabel: false,
          labelName: offer.name,
          money: state.money + offer.advance,
          reputation: capRep(state.reputation + 2),
          notice: `${wa(offer.name)} 계약했다. 선급은 ${formatWon(offer.advance)}이다.`,
          timeline: [...state.timeline, line(state, '레이블 계약', `${wa(offer.name)} 계약했다. 선급은 ${formatWon(offer.advance)}이다.`)],
        },
        1,
      )
    }
    case 'found-label': {
      if (state.screen !== 'labelFuture') return state
      const cost = state.money >= 180_000 ? 180_000 : 0
      const name = `${state.rapName} 레코드`
      return beginPhase(
        {
          ...state,
          signedLabel: true,
          ownLabel: true,
          labelName: name,
          money: state.money - cost,
          buzz: state.buzz + 0.15,
          reputation: capRep(state.reputation + 3),
          notice: cost
            ? `${eul(name)} 차렸다. 보증금은 ${formatWon(cost)}이고, 이후 정산은 내 간판으로 받는다.`
            : `${eul(name)} 연습실 한 칸으로 차렸다. 이후 정산은 내 간판으로 받는다.`,
          timeline: [...state.timeline, line(state, '레이블 창립', name)],
        },
        2,
      )
    }
    case 'stay-label': {
      if (state.screen !== 'labelFuture') return state
      const notice = state.ownLabel
        ? `${state.labelName} 간판을 유지했다.`
        : state.signedLabel
          ? `${state.labelName}에 남았다. 황혼기도 그 간판으로 간다.`
          : '인디로 남았다. 황혼기는 혼자 간다.'
      return beginPhase(
        {
          ...state,
          notice,
          timeline: [...state.timeline, line(state, '잔류', notice)],
        },
        2,
      )
    }
    case 'smtm-skip':
      return finishPhase({
        ...state,
        smtmSeasons: [...(state.smtmSeasons ?? []).filter((item) => item.phase !== state.phase), { phase: state.phase, label: '불참' }],
        notice: '쇼미에는 나가지 않았다. 꼬리표는 없다.',
        timeline: [...state.timeline, line(state, '쇼미 불참', '출연을 거절했다. 꼬리표는 없다.')],
      })
    case 'smtm-trash': {
      const appeared = state.smtmAppeared
      return finishPhase({
        ...state,
        smtmTrashTalk: true,
        snakeTag: state.snakeTag || appeared,
        smtmSeasons: [...(state.smtmSeasons ?? []).filter((item) => item.phase !== state.phase), { phase: state.phase, label: '뱀새끼 발언' }],
        notice: trashReactions(state.rapName, appeared),
        timeline: [
          ...state.timeline,
          line(
            state,
            '뱀새끼 발언',
            appeared
              ? '쇼미에 나갔다가, 나가면 구리다고 욕했다. 그 표시가 레이블 옆에 붙었다.'
              : '쇼미 나가면 구리다고 욕했다. 나중에 출연하면 그 표시가 레이블 옆에 붙는다.',
          ),
        ],
      })
    }
    case 'smtm-join': {
      let timeline = state.timeline
      let notice: string | null = null
      let snake = state.snakeTag
      if (state.smtmTrashTalk && !state.snakeTag) {
        snake = true
        notice = '욕부터 하고 출연했다. 뱀새끼가 레이블 옆에 붙었다.'
        timeline = [...timeline, line(state, '뱀새끼', '쇼미를 욕하고 나서 출연했다. 그 표시가 레이블 옆에 붙었다.')]
      }
      return openRound(
        {
          ...state,
          smtmAppeared: true,
          snakeTag: snake,
          timeline,
          notice,
          smtmEarned: 0,
          smtmClearsThisSeason: 0,
        },
        0,
      )
    }
    case 'smtm-team': {
      const producer = PRODUCERS.find((item) => item.id === action.id) ?? PRODUCERS[0]
      const round = SMTM_ROUNDS[state.smtmRound]
      const gig = scalePay(state, round.gig)
      const earned = state.smtmEarned + gig
      const youtube = buildYoutube({
        roundIndex: state.smtmRound,
        score: 72,
        judgement: 72,
        passed: true,
        pr: state.stats.pr,
        snake: state.snakeTag,
        rivalScore: null,
        rivalName: null,
        seasonEarned: earned,
        rapName: state.rapName,
        teamId: producer.id,
        gig,
        ripple: round.ripple,
        prize: 0,
      })
      const clip = { ...youtube, producer: `${producer.team} · ${producer.names.join(', ')}`, producerLine: producer.meme }
      return {
        ...state,
        smtmTeam: producer.id,
        buzz: state.buzz + round.ripple,
        money: state.money + gig,
        reputation: capRep(state.reputation + 1),
        smtmEarned: earned,
        smtmClearsThisSeason: state.smtmRound + 1,
        lastYoutube: clip,
        smtmLog: pushSmtm(state, clip),
        screen: 'smtmYoutube',
        tab: 'now',
        notice: `${producer.team}에 들어갔다.`,
      }
    }
    case 'submit-smtm':
      if (!/[가-힣]/.test(state.draftLyrics)) return state
      return { ...state, screen: 'smtmStage', tab: 'now', draftTitle: SMTM_ROUNDS[state.smtmRound].name }
    case 'finish-smtm': {
      const round = SMTM_ROUNDS[state.smtmRound]
      const judged = action.skipped
        ? skipPerform(state, state.draftLyrics, 2)
        : performScore(state, state.draftLyrics, 2, action.result)
      let judgement = judged.score
      if (!action.skipped && round.kind === 'acapella') {
        judgement = action.result.micMissing
          ? judged.writing * 0.6 + judged.perform * 0.4
          : judged.writing * 0.55 + action.result.energy * 0.45
      }
      judgement -= state.snakeTag ? 4 : 0
      const rival = round.kind === 'diss' ? rivalPower(state.phase) : null
      const passed = roundPassed(state.smtmRound, judgement, rival ?? 0, state.reputation)
      const nepotism = passed && nepotismPass(state.smtmRound, judgement, rival ?? 0, state.reputation)
      const gig = passed ? scalePay(state, round.gig) : 0
      const prize = passed ? round.prize : 0
      const earned = state.smtmEarned + gig + prize
      let reputation = state.reputation
      if (passed) reputation = capRep(reputation + 2)
      else reputation = capRep(reputation - (state.snakeTag ? 4 : 2))
      if (passed && state.smtmRound === SMTM_ROUNDS.length - 1) reputation = Math.max(reputation, 72)
      const clears = passed ? state.smtmRound + 1 : state.smtmClearsThisSeason
      const youtube = buildYoutube({
        roundIndex: state.smtmRound,
        score: judged.score,
        judgement,
        passed,
        pr: state.stats.pr,
        snake: state.snakeTag,
        rivalScore: rival,
        rivalName: round.kind === 'diss' ? state.smtmOpponent : null,
        seasonEarned: earned,
        rapName: state.rapName,
        teamId: state.smtmTeam,
        gig,
        ripple: passed ? round.ripple : 0,
        prize,
        nepotism,
      })
      const lyrics = state.draftLyrics.trim()
      const smtmTrack = lyrics && /[가-힣]/.test(lyrics) && state.genre
        ? {
            id: uid(),
            phase: state.phase,
            title: `${PHASES[state.phase]?.name ?? ''} ${round.name}`.trim(),
            lyrics,
            genre: state.genre,
            score: Math.round(judged.score),
            writingScore: Math.round(judged.writing),
            performScore: Math.round(judged.perform),
            hipgal: hipgalLines(state.rapName, judged.score, null, state.snakeTag, state.genre),
            rhythm: rhythmLines(judged.writing, null),
            rhythmMark: rhythmMark(judged.writing),
            audioId: action.audioId ?? null,
            beatId: state.beatId,
            coverId: null,
            money: gig + prize,
            shift: null,
            source: 'smtm' as const,
          }
        : null
      return {
        ...state,
        money: state.money + gig + prize,
        buzz: state.buzz + (passed ? round.ripple : 0),
        reputation,
        smtmEarned: earned,
        smtmClearsThisSeason: clears,
        lastYoutube: youtube,
        smtmLog: pushSmtm(state, youtube),
        lastPerformNote: judged.note,
        nepotismTag: state.nepotismTag || nepotism,
        tracks: smtmTrack ? [...state.tracks, smtmTrack] : state.tracks,
        screen: 'smtmYoutube',
        tab: 'now',
        timeline:
          round.kind === 'diss' && state.smtmOpponent
            ? [
                ...state.timeline,
                line(state, '디스전', `${wa(state.smtmOpponent)} 디스를 했다. ${passed ? '이겼다.' : '밀렸다.'}`),
              ]
            : state.timeline,
      }
    }
    case 'ack-youtube': {
      const clip = state.lastYoutube
      if (!clip) return state
      if (clip.passed && state.smtmRound < SMTM_ROUNDS.length - 1) return openRound(state, state.smtmRound + 1)
      const clears = state.smtmClearsThisSeason
      const won = clears >= SMTM_ROUNDS.length
      const label = smtmSeasonLabel(clears)
      const prize = won ? SMTM_ROUNDS[SMTM_ROUNDS.length - 1].prize : 0
      const rippleMoney = Math.max(0, state.smtmEarned - prize)
      const rippleText = `라이브랑 앨범으로 들어온 돈은 ${formatWon(rippleMoney)}이다`
      const prizeText = won ? `상금은 ${formatWon(prize)}이다. ` : ''
      return finishPhase({
        ...state,
        smtmBestClears: Math.max(state.smtmBestClears, clears),
        smtmWins: state.smtmWins + (won ? 1 : 0),
        smtmSeasons: [...(state.smtmSeasons ?? []).filter((item) => item.phase !== state.phase), { phase: state.phase, label }],
        notice: won
          ? `파이널에서 우승했다. ${prizeText}${rippleText}. 이름값이 다음 라운드를 밀어 준다.`
          : `${label}이다. ${rippleText}. 인맥 힙합이라 이름값이 높으면 다음이 쉽다.`,
        timeline: [
          ...state.timeline,
          line(
            state,
            won ? '쇼미 우승' : '쇼미 탈락',
            `${PHASES[state.phase].name} 시즌은 ${label}이다. ${state.snakeTag ? '그 표시는 레이블 옆에 붙었다. ' : ''}${prizeText}${rippleText}.`,
          ),
        ],
      })
    }
    default:
      return state
  }
}

export function reducer(state: GameState, action: Action): GameState {
  const next = reduce(state, action)
  if (next.notice && next.notice !== state.notice) return { ...next, noticeTick: state.noticeTick + 1 }
  return next
}

function resolveEvent(state: GameState, choice: string): GameState {
  const modal = state.modal
  if (!modal) return state
  if (modal.kind === 'snake') {
    return {
      ...state,
      modal: null,
      reputation: capRep(state.reputation + modal.rep),
      money: Math.max(0, state.money + modal.money),
      timeline: [...state.timeline, line(state, modal.title, modal.body)],
      notice: modal.title,
    }
  }
  if (modal.kind === 'shift') {
    if (choice === 'keep' || choice === state.genre) {
      return {
        ...state,
        modal: null,
        shiftUsed: true,
        notice: '노선은 그대로 뒀다. 하던 장르를 유지한다.',
        timeline: [...state.timeline, line(state, '장르 유지', `${eul(state.genre ? GENRE_LABEL[state.genre] : '지금 장르')} 주력으로 유지했다.`)],
      }
    }
    const nextGenre = choice as Genre
    if (!state.genre || !GENRE_LABEL[nextGenre] || nextGenre === state.genre) {
      return { ...state, modal: null, shiftUsed: true }
    }
    const swing = shiftSwing(state.stats, state.genre, nextGenre, state.reputation)
    return {
      ...state,
      modal: null,
      shiftUsed: true,
      genre: nextGenre,
      pendingShift: { from: state.genre, to: nextGenre, outcome: swing.outcome, magnitude: swing.magnitude },
      notice: `${euro(GENRE_LABEL[nextGenre])} 노선을 바꿨다. 다음 곡에서 반응이 갈린다.`,
      timeline: [
        ...state.timeline,
        line(state, '노선 변경', `${GENRE_LABEL[state.genre]}에서 ${euro(GENRE_LABEL[nextGenre])} 옮겼다.`),
      ],
    }
  }
  if (modal.kind === 'label') {
    if (choice === 'sign') {
      const advance = 180_000 * (state.phase + 1)
      const name = modal.labelName ?? '레이블'
      return {
        ...state,
        modal: null,
        signedLabel: true,
        labelName: name,
        money: state.money + advance,
        reputation: capRep(state.reputation + 3),
        notice: `${wa(name)} 계약했다. 선급은 ${formatWon(advance)}이다. 이후 앨범이랑 라이브 정산이 늘어난다.`,
        timeline: [...state.timeline, line(state, '레이블 계약', `${wa(name)} 계약했다. 선급은 ${formatWon(advance)}이다.`)],
      }
    }
    return {
      ...state,
      modal: null,
      reputation: capRep(state.reputation + 1),
      notice: '계약서를 거절하고 인디로 남았다.',
      timeline: [...state.timeline, line(state, '인디', '레이블 제안을 거절했다.')],
    }
  }
  if (modal.kind === 'feature') {
    if (choice !== 'accept') {
      return {
        ...state,
        modal: null,
        notice: '피처링을 거절했다.',
        timeline: [...state.timeline, line(state, '피처링 거절', '요청을 무시했다.')],
      }
    }
    const power = (state.stats.lyric + state.stats.club) / 2 + Math.random() * 25
    const ok = power > 42
    const pay = ok ? scalePay(state, 180_000 * (1 + state.stats.pr / 90)) : 0
    return {
      ...state,
      modal: null,
      money: state.money + pay,
      reputation: capRep(state.reputation + (ok ? 3 : -1)),
      notice: ok
        ? `${state.rivalName} 피처링이 라이브로 이어졌다. ${formatWon(pay)}을 받았다.`
        : `${state.rivalName} 피처링에서 벌스가 묻혀서 이름이 깎였다.`,
      timeline: [
        ...state.timeline,
        line(
          state,
          ok ? `${state.rivalName} 피처링` : `${state.rivalName} 묻힌 피처링`,
          ok ? `라이브 제의로 ${formatWon(pay)}을 받았다.` : '실력이 피처링을 받쳐 주지 못했다.',
        ),
      ],
    }
  }
  if (modal.kind === 'diss') {
    if (choice !== 'fight') {
      return {
        ...state,
        modal: null,
        reputation: capRep(state.reputation - 1),
        notice: '디스를 피했다. 겁먹었다는 소문이 남았다.',
        timeline: [...state.timeline, line(state, '디스 회피', `${state.rivalName}의 콜을 무시했다. 겁먹었다는 글이 올라왔다.`)],
      }
    }
    const power = (state.stats.lyric + state.stats.club) / 2 + Math.random() * 22
    const rival = 38 + state.phase * 6
    const win = power > rival
    const pay = win ? scalePay(state, 160_000) : 0
    return {
      ...state,
      modal: null,
      money: state.money + pay,
      reputation: capRep(state.reputation + (win ? 4 : -3)),
      notice: win ? `${eul(state.rivalName)} 눌렀다. 뒤풀이 라이브로 ${formatWon(pay)}을 받았다.` : `${state.rivalName}에게 밀렸다.`,
        timeline: [
          ...state.timeline,
          line(
            state,
            win ? `${state.rivalName} 디스 승` : `${state.rivalName} 디스 패`,
            win ? `${eul(state.rivalName)} 눌렀다. 뒤풀이 라이브로 ${formatWon(pay)}을 받았다.` : `${state.rivalName}에게 밀렸다.`,
          ),
        ],
    }
  }
  return { ...state, modal: null }
}
