import { DISS_OPPONENTS, GENRE_LABEL, ORIGINS, PHASES, PRODUCERS, TRAIN_ACTIONS, hipgalLines, labelOffers, rhythmLines, trainNotice, trashReactions } from './content'
import { releasePayout } from './economy'
import { forcedEvent, rollTrainingEvent, shiftModal, shiftSwing } from './events'
import { capRep, capStat, eul, euro, formatWon, isRapName, rhythmMark, statLabel, uid, wa } from './format'
import { scoreLyrics } from './lyricsScore'
import { freshState } from './storage'
import { SMTM_ROUNDS, buildYoutube, rivalPower, roundPassed, smtmSeasonLabel } from './smtm'
import { pickBeat } from '../audio/beats'
import type { GameState, Genre, PerformResult, StatKey, TimelineItem, TrainId } from './types'

export type Dispatch = (action: Action) => void

export type Action =
  | { type: 'set-name'; name: string }
  | { type: 'pick-origin'; id: string }
  | { type: 'ack-story' }
  | { type: 'train'; id: TrainId }
  | { type: 'resolve-event'; choice: string }
  | { type: 'set-draft'; title?: string; lyrics?: string; coverId?: string | null }
  | { type: 'submit-release' }
  | { type: 'finish-release'; result: PerformResult; audioId: string | null }
  | { type: 'ack-reaction' }
  | { type: 'pick-label'; name: string | null }
  | { type: 'found-label' }
  | { type: 'stay-label' }
  | { type: 'smtm-join' }
  | { type: 'smtm-skip' }
  | { type: 'smtm-trash' }
  | { type: 'smtm-team'; id: string }
  | { type: 'submit-smtm' }
  | { type: 'finish-smtm'; result: PerformResult }
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
    perform = Math.max(20, Math.min(74, state.stats.flow * 0.45 + state.stats.club * 0.35 + 10))
    note = '마이크가 안 열림. 포켓이랑 라이브로 공연 점수 때움.'
  }
  const score = Math.max(0, Math.min(100, writing * 0.45 + perform * 0.55))
  return { writing, perform, score, note }
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
      const origin = ORIGINS.find((item) => item.id === action.id)
      if (!origin) return state
      return {
        ...state,
        originId: origin.id,
        genre: origin.genre,
        stats: { ...origin.stats },
        money: 40_000,
        reputation: 8,
        screen: 'story',
        originStory: origin.story.replaceAll('{name}', state.rapName),
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
      const spec = TRAIN_ACTIONS.find((item) => item.id === action.id)
      if (!spec) return state
      if (action.id === 'tonic') {
        const hit = Math.random() < 0.5
        if (!hit) {
          return endCareer(state, trainNotice('tonic', false), '보약', '보약이 먼저 컷. 커리어 삭제.')
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
          timeline: [...state.timeline, line(state, '보약', '스탯 올킬. 보약이 먹힘.')],
        }
        return afterTrain(next)
      }
      const primary = action.id === 'throat' ? (state.stats.flow + state.stats.club) / 2 : state.stats[spec.stat]
      const chance = action.id === 'throat' ? 0.8 : Math.max(0.36, Math.min(0.9, 0.4 + primary / 230))
      const ok = Math.random() < chance
      const stats = { ...state.stats }
      let money = state.money
      let reputation = state.reputation
      if (ok && action.id === 'throat') {
        stats.flow = capStat(stats.flow + 4)
        stats.club = capStat(stats.club + 3)
      } else if (ok && action.id === 'insta') {
        stats.pr = capStat(stats.pr + 8 + Math.floor(Math.random() * 4))
        money += Math.round(8_000 * (1 + state.phase) * (1 + stats.pr / 140) * state.buzz)
        reputation = capRep(reputation + 1)
      } else if (ok && action.id === 'club') {
        stats.club = capStat(stats.club + 6 + Math.floor(Math.random() * 4))
        money += Math.round(14_000 * (1 + state.phase) * (1 + stats.club / 120) * state.buzz)
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
        notice: [trainNotice(action.id, ok), resultLine(state, stats, money, reputation)].filter(Boolean).join('\n'),
        timeline: [
          ...state.timeline,
          line(state, spec.label, [trainNotice(action.id, ok), resultLine(state, stats, money, reputation)].filter(Boolean).join(' ')),
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
    case 'finish-release': {
      if (!state.genre) return state
      const judged = performScore(state, state.draftLyrics, 4, action.result)
      const payout = releasePayout({
        phase: state.phase,
        score: judged.score,
        pr: state.stats.pr,
        signed: state.signedLabel,
        reputation: state.reputation,
        shift: state.pendingShift,
        buzz: state.buzz,
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
      }
      const shiftDetail =
        shift === 'boom' ? '노선 변경 개추.' : shift === 'bust' ? '노선 변경 비추.' : '곡을 발매함.'
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
        timeline: [...state.timeline, line(state, track.title, `${shiftDetail} 공개 점수 ${track.score}.`)],
      }
    }
    case 'ack-reaction':
      if (state.phase >= 1) return { ...state, screen: 'smtmOffer', tab: 'now' }
      return finishPhase(state)
    case 'pick-label': {
      if (state.screen !== 'labelPick') return state
      if (!action.name) {
        return beginPhase(
          {
            ...state,
            signedLabel: false,
            ownLabel: false,
            labelName: null,
            notice: '계약 거절. 인디로 전성기 진입.',
            timeline: [...state.timeline, line(state, '인디', '신입 끝나고 소속 없이 감.')],
          },
          1,
        )
      }
      if (state.signedLabel && action.name === state.labelName) {
        return beginPhase(
          {
            ...state,
            notice: `${state.labelName} 잔류.`,
            timeline: [...state.timeline, line(state, '잔류', `${state.labelName} 계약 유지.`)],
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
          notice: `${wa(offer.name)} 사인. 선급 ${formatWon(offer.advance)}.`,
          timeline: [...state.timeline, line(state, '레이블 계약', `${offer.name} 선급 ${formatWon(offer.advance)}.`)],
        },
        1,
      )
    }
    case 'found-label': {
      if (state.screen !== 'labelFuture') return state
      const cost = state.money >= 60_000 ? 60_000 : 0
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
            ? `${name} 창립. 보증금 ${formatWon(cost)}. 이후 정산은 내 간판.`
            : `${name}를 연습실 한 칸으로 차림. 이후 정산은 내 간판.`,
          timeline: [...state.timeline, line(state, '레이블 창립', name)],
        },
        2,
      )
    }
    case 'stay-label': {
      if (state.screen !== 'labelFuture') return state
      const notice = state.ownLabel
        ? `${state.labelName} 간판 유지.`
        : state.signedLabel
          ? `${state.labelName} 잔류. 황혼기는 그 간판.`
          : '인디 잔류. 황혼기는 혼자.'
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
        notice: '쇼미 불참. 꼬리표 없음.',
        timeline: [...state.timeline, line(state, '쇼미 불참', '출연 거절. 꼬리표 없음.')],
      })
    case 'smtm-trash':
      return finishPhase({
        ...state,
        smtmTrashTalk: true,
        notice: trashReactions(state.rapName),
        timeline: [...state.timeline, line(state, '쇼미 쓰레기 발언', '안 나가면서 쇼미를 깎음. 캡처각.')],
      })
    case 'smtm-join': {
      let timeline = state.timeline
      let notice: string | null = null
      let snake = state.snakeTag
      if (state.smtmTrashTalk && !state.snakeTag) {
        snake = true
        notice = '과거 발언이 붙음. 이제 뱀새끼.'
        timeline = [...timeline, line(state, '뱀새끼', '까놓고 출연함. 말머리에 뱀새끼 박힘.')]
      }
      return openRound(
        {
          ...state,
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
      const gig = Math.round(round.gig * state.buzz)
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
      return {
        ...state,
        smtmTeam: producer.id,
        buzz: state.buzz + round.ripple,
        money: state.money + gig,
        reputation: capRep(state.reputation + 1),
        smtmEarned: earned,
        smtmClearsThisSeason: state.smtmRound + 1,
        lastYoutube: { ...youtube, producer: producer.name, producerLine: `${producer.team}. ${producer.meme}` },
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
      const judged = performScore(state, state.draftLyrics, 2, action.result)
      let judgement = judged.score
      if (round.kind === 'acapella') {
        judgement = action.result.micMissing
          ? judged.writing * 0.6 + judged.perform * 0.4
          : judged.writing * 0.55 + action.result.energy * 0.45
      }
      judgement -= state.snakeTag ? 4 : 0
      const rival = round.kind === 'diss' ? rivalPower(state.phase) : null
      const passed = roundPassed(state.smtmRound, judgement, rival ?? 0)
      const gig = passed ? Math.round(round.gig * state.buzz) : 0
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
      })
      return {
        ...state,
        money: state.money + gig + prize,
        buzz: state.buzz + (passed ? round.ripple : 0),
        reputation,
        smtmEarned: earned,
        smtmClearsThisSeason: clears,
        lastYoutube: youtube,
        lastPerformNote: judged.note,
        screen: 'smtmYoutube',
        tab: 'now',
        timeline:
          round.kind === 'diss' && state.smtmOpponent
            ? [
                ...state.timeline,
                line(state, '디스전', `${wa(state.smtmOpponent)} 맞장. ${passed ? '이김.' : '밀림.'}`),
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
      const rippleText = `파급효과로 잡힌 라이브·앨범 ${formatWon(rippleMoney)}`
      const prizeText = won ? `상금 ${formatWon(prize)}. ` : ''
      return finishPhase({
        ...state,
        smtmBestClears: Math.max(state.smtmBestClears, clears),
        smtmWins: state.smtmWins + (won ? 1 : 0),
        notice: won ? `파이널 우승. ${prizeText}${rippleText}. 다음 곡 정산이 커짐.` : `${label}. ${rippleText}.`,
        timeline: [
          ...state.timeline,
          line(
            state,
            won ? '쇼미 우승' : '쇼미 탈락',
            `${PHASES[state.phase].name} 시즌 ${label}. ${state.snakeTag ? '말머리에 뱀새끼. ' : ''}${prizeText}${rippleText}.`,
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
        notice: '노선 유지. 본캐 고수.',
        timeline: [...state.timeline, line(state, '본캐 유지', `${state.genre ? GENRE_LABEL[state.genre] : '지금 장르'} 본캐 유지.`)],
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
      notice: `${euro(GENRE_LABEL[nextGenre])} 노선 변경. 다음 곡에서 개추인지 비추인지 갈림.`,
      timeline: [
        ...state.timeline,
        line(state, '노선 변경', `${GENRE_LABEL[state.genre]}에서 ${GENRE_LABEL[nextGenre]}로 옮김.`),
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
        notice: `${wa(name)} 사인. 선급 ${formatWon(advance)}. 이후 앨범·라이브 정산이 늘어남.`,
        timeline: [...state.timeline, line(state, '레이블 계약', `${name} 선급 ${formatWon(advance)}.`)],
      }
    }
    return {
      ...state,
      modal: null,
      reputation: capRep(state.reputation + 1),
      notice: '계약서 거절. 인디 잔류.',
      timeline: [...state.timeline, line(state, '인디', '레이블 제안 거절.')],
    }
  }
  if (modal.kind === 'feature') {
    if (choice !== 'accept') {
      return {
        ...state,
        modal: null,
        notice: '피처 거절.',
        timeline: [...state.timeline, line(state, '피처 거절', '요청 무시.')],
      }
    }
    const power = (state.stats.lyric + state.stats.flow) / 2 + Math.random() * 25
    const ok = power > 42
    const pay = ok ? Math.round(35_000 * (state.phase + 1) * (1 + state.stats.pr / 140) * state.buzz) : 0
    return {
      ...state,
      modal: null,
      money: state.money + pay,
      reputation: capRep(state.reputation + (ok ? 3 : -1)),
      notice: ok ? `피처가 라이브로 이어짐. ${formatWon(pay)}.` : '벌스가 묻힘. 네임드 깎임.',
      timeline: [...state.timeline, line(state, ok ? '피처' : '묻힌 피처', ok ? `라이브 제의 ${formatWon(pay)}.` : '스킬이 피처를 못 받침.')],
    }
  }
  if (modal.kind === 'diss') {
    if (choice !== 'fight') {
      return {
        ...state,
        modal: null,
        reputation: capRep(state.reputation - 1),
        notice: '맞장 회피. 쫄보 소문 남.',
        timeline: [...state.timeline, line(state, '맞장 회피', `${state.rivalName} 콜 무시. 쫄았다는 글 올라옴.`)],
      }
    }
    const power = (state.stats.flow + state.stats.lyric) / 2 + Math.random() * 22
    const rival = 38 + state.phase * 6
    const win = power > rival
    const pay = win ? Math.round(25_000 * (state.phase + 1) * state.buzz) : 0
    return {
      ...state,
      modal: null,
      money: state.money + pay,
      reputation: capRep(state.reputation + (win ? 4 : -3)),
      notice: win ? `${eul(state.rivalName)} 누름. 뒤풀이 라이브 ${formatWon(pay)}.` : `${state.rivalName}에게 밀림.`,
        timeline: [
          ...state.timeline,
          line(
            state,
            win ? `${state.rivalName} 맞장 승` : `${state.rivalName} 맞장 패`,
            win ? `${eul(state.rivalName)} 누름. 뒤풀이 라이브 ${formatWon(pay)}.` : `${state.rivalName}에게 밀림.`,
          ),
        ],
    }
  }
  return { ...state, modal: null }
}
