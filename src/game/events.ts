import { DISS_OPPONENTS, GENRE_LABEL, LABELS, SNAKE_EVENTS, genreDistance } from './content'
import { prEventChance } from './economy'
import { iga, uid } from './format'
import type { GameState, Genre, ModalEvent, Stats } from './types'

export function shiftSwing(stats: Stats, from: Genre, to: Genre, reputation: number): {
  outcome: 'boom' | 'bust'
  magnitude: number
} {
  const skill = (stats.compose + stats.lyric) / 2
  const roll = Math.random() * 30
  const swing = skill + roll - genreDistance(from, to) * 12
  return {
    outcome: swing >= 32 ? 'boom' : 'bust',
    magnitude: 1 + reputation / 140,
  }
}

function labelEvent(): ModalEvent {
  const label = LABELS[Math.floor(Math.random() * LABELS.length)]
  return {
    id: uid(),
    kind: 'label',
    title: `${label.name} 계약서`,
    body: label.line,
    rep: 0,
    money: 0,
    labelName: label.name,
  }
}

function featureEvent(state: GameState): ModalEvent {
  const host = DISS_OPPONENTS[Math.floor(Math.random() * DISS_OPPONENTS.length)]
  return {
    id: uid(),
    kind: 'feature',
    title: '피처링 요청',
    body: `${iga(host.name)} ${state.rapName}에게 피처링을 요청했다. 받으면 라이브 제의가 오고, 벌스가 약하면 묻힌다.`,
    rep: 0,
    money: 0,
    rivalName: host.name,
  }
}

function dissEvent(): ModalEvent {
  const foe = DISS_OPPONENTS[Math.floor(Math.random() * DISS_OPPONENTS.length)]
  return {
    id: uid(),
    kind: 'diss',
    title: `${foe.name} 맞장`,
    body: `${foe.name}의 말이다. "${foe.line}" 받으면 맞장이고, 피하면 겁먹었다는 글이 남는다.`,
    rep: 0,
    money: 0,
    rivalName: foe.name,
  }
}

export function rollTrainingEvent(state: GameState): ModalEvent | null {
  if (state.snakeTag && Math.random() < 0.22) {
    const event = SNAKE_EVENTS[Math.floor(Math.random() * SNAKE_EVENTS.length)]
    return {
      id: uid(),
      kind: 'snake',
      title: event.title,
      body: event.body,
      rep: event.rep,
      money: event.money,
    }
  }
  const pr = state.stats.pr
  if (state.phase > 0 && !state.signedLabel && state.reputation >= 8 && Math.random() < prEventChance(0.2, pr)) return labelEvent()
  if (state.reputation >= 8 && Math.random() < prEventChance(0.22, pr)) return featureEvent(state)
  if (state.reputation >= 4 && Math.random() < prEventChance(0.28, pr)) return dissEvent()
  return null
}

export function forcedEvent(state: GameState): ModalEvent {
  if (state.phase > 0 && !state.signedLabel && Math.random() < 0.5) return labelEvent()
  if (Math.random() < 0.5) return featureEvent(state)
  return dissEvent()
}

export function shiftModal(genre: Genre): ModalEvent {
  return {
    id: uid(),
    kind: 'shift',
    title: '노선 변경',
    body: `${GENRE_LABEL[genre]}에 질렸다. 노선을 바꾸면 다음 곡 반응이 좋거나 별로다. 이름이 클수록 차이가 크고, 하던 장르를 유지할 수도 있다.`,
    rep: 0,
    money: 0,
  }
}
