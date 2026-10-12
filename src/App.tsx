import { useEffect, useReducer, useRef } from 'react'
import { BeatEngine } from './audio/beatEngine'
import { beatById } from './audio/beats'
import { EngineContext } from './audio/EngineContext'
import { playClick } from './audio/uiSound'
import { AlbumList, LogView } from './components/Library'
import { NameScreen } from './components/NameScreen'
import { OriginSelect } from './components/OriginSelect'
import { Reaction } from './components/Reaction'
import { Retirement } from './components/Retirement'
import { Shell } from './components/Shell'
import { Smtm } from './components/Smtm'
import { Stage } from './components/Stage'
import { LabelGate } from './components/LabelGate'
import { EventSheet, Training } from './components/Training'
import { Writer } from './components/Writer'
import { reducer, type Action } from './game/reducer'
import { isAcapellaScreen } from './game/smtm'
import { clearGame, loadOrFresh, saveGame } from './game/storage'
import type { GameState } from './game/types'

const LIVE = ['write', 'stage', 'smtmWrite', 'smtmStage']

function screenOf(state: GameState, dispatch: (action: Action) => void) {
  switch (state.screen) {
    case 'name':
      return <NameScreen dispatch={dispatch} />
    case 'origin':
    case 'story':
      return <OriginSelect state={state} dispatch={dispatch} />
    case 'train':
      return <Training state={state} dispatch={dispatch} />
    case 'write':
      return <Writer state={state} dispatch={dispatch} mode="release" />
    case 'stage':
      return <Stage state={state} dispatch={dispatch} mode="release" />
    case 'reaction':
      return <Reaction state={state} dispatch={dispatch} />
    case 'labelPick':
    case 'labelFuture':
      return <LabelGate state={state} dispatch={dispatch} />
    case 'smtmOffer':
    case 'smtmTeam':
    case 'smtmYoutube':
      return <Smtm state={state} dispatch={dispatch} />
    case 'smtmWrite':
      return <Writer state={state} dispatch={dispatch} mode="smtm" />
    case 'smtmStage':
      return <Stage state={state} dispatch={dispatch} mode="smtm" />
    case 'retire':
      return <Retirement state={state} dispatch={dispatch} />
    default:
      return null
  }
}

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadOrFresh)
  const engineRef = useRef<BeatEngine | null>(null)
  if (!engineRef.current) engineRef.current = new BeatEngine()

  function send(action: Action) {
    if (action.type === 'restart') clearGame()
    dispatch(action)
  }

  useEffect(() => {
    if (!state.rapName) return
    saveGame(state)
  }, [state])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (target instanceof Element && target.closest('button')) playClick()
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine || !state.genre) return
    const acapella = isAcapellaScreen(state.screen, state.smtmRound)
    const live = state.beatOn && state.tab === 'now' && LIVE.includes(state.screen) && !acapella
    engine.setBeat(beatById(state.beatId, state.genre))
    if (live) engine.start()
    else engine.stop()
  }, [state.beatOn, state.beatId, state.genre, state.screen, state.smtmRound, state.tab])

  const intro = state.screen === 'name' || state.screen === 'origin' || state.screen === 'story'
  const body = !intro && state.tab === 'album'
    ? <AlbumList state={state} />
    : !intro && state.tab === 'log'
      ? <LogView state={state} dispatch={send} />
      : screenOf(state, send)

  return (
    <EngineContext.Provider value={engineRef.current}>
      <Shell state={state} dispatch={send}>
        {body}
      </Shell>
      {state.modal && <EventSheet state={state} dispatch={send} />}
    </EngineContext.Provider>
  )
}
