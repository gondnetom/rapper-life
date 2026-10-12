import { DISS_OPPONENTS, GENRE_LABEL, LABELS, SNAKE_EVENTS, genreDistance } from './content'
import { prEventChance } from './economy'
import { uid } from './format'
import type { GameState, Genre, ModalEvent, Stats } from './types'

export function shiftSwing(stats: Stats, from: Genre, to: Genre, reputation: number): {
  outcome: 'boom' | 'bust'
  magnitude: number
} {
  const skill = (stats.compose + stats.flow) / 2
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
    title: '피처 요청',
    body: `${host.name} 쪽에서 ${state.rapName} 피처 요청. 받으면 라이브 제의, 벌스 약하면 묻힘.`,
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
    body: `${foe.name}: "${foe.line}" 받으면 맞장, 피하면 쫄보 글이 남음.`,
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
    body: `${GENRE_LABEL[genre]}에 질림. 노선 바꾸면 다음 곡이 개추거나 비추. 네임드가 높을수록 폭이 큼. 본캐 유지도 가능.`,
    rep: 0,
    money: 0,
  }
}
