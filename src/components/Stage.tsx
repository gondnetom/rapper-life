import { useEffect, useRef, useState } from 'react'
import { useEngine } from '../audio/EngineContext'
import { beatById } from '../audio/beats'
import { startRecording } from '../audio/perform'
import { saveTake } from '../audio/takes'
import { uid } from '../game/format'
import { SMTM_ROUNDS } from '../game/smtm'
import type { GameState, PerformResult } from '../game/types'
import type { Dispatch } from '../game/reducer'

export function Stage({
  state,
  dispatch,
  mode,
}: {
  state: GameState
  dispatch: Dispatch
  mode: 'release' | 'smtm'
}) {
  const engine = useEngine()
  const acapella = mode === 'smtm' && SMTM_ROUNDS[state.smtmRound]?.kind === 'acapella'
  const [elapsed, setElapsed] = useState(0)
  const [level, setLevel] = useState(0)
  const [recording, setRecording] = useState(false)
  const session = useRef<ReturnType<typeof startRecording> | null>(null)
  const done = useRef(false)
  const discarded = useRef(false)

  useEffect(() => {
    discarded.current = false
    return () => {
      discarded.current = true
      session.current?.stop()
    }
  }, [])

  function finish(result: PerformResult) {
    if (done.current || discarded.current) return
    done.current = true
    if (mode === 'smtm') {
      dispatch({ type: 'finish-smtm', result })
      return
    }
    const audioId = result.blob ? uid() : null
    if (audioId && result.blob) {
      void saveTake(audioId, result.blob).finally(() => {
        dispatch({ type: 'finish-release', result, audioId })
      })
      return
    }
    dispatch({ type: 'finish-release', result, audioId: null })
  }

  function begin() {
    if (!engine || !state.genre || recording) return
    engine.setBeat(beatById(state.beatId, state.genre))
    if (acapella) engine.stop()
    else engine.start()
    setRecording(true)
    setElapsed(0)
    const rec = startRecording({
      lyrics: state.draftLyrics,
      flow: state.stats.flow,
      club: state.stats.club,
      getAccents: () => engine.accents,
      audioContext: engine.ensure(),
      onTick: ({ elapsed: next, level: nextLevel }) => {
        setLevel(nextLevel)
        setElapsed(next)
      },
    })
    session.current = rec
    void rec.done.then(finish)
  }

  const seconds = Math.floor(elapsed / 1000)
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

  return (
    <section className="stage">
      <h1 className="screen-title">{state.draftTitle}</h1>
      <p className="lede">
        {acapella
          ? '무반주다. 시작을 누르면 뱉고, 종료를 누르면 끝난다.'
          : '시작을 누르면 비트가 깔리고, 종료를 누르면 끝난다.'}
      </p>
      <div className="timer">{clock}</div>
      <div className="level" aria-hidden="true">
        <i style={{ width: `${Math.min(100, level * 420)}%` }} />
      </div>
      {!recording ? (
        <button className="record" type="button" onClick={begin}>
          시작
        </button>
      ) : (
        <button className="record stop" type="button" onClick={() => session.current?.stop()}>
          종료
        </button>
      )}
      <pre className="lyrics-preview">{state.draftLyrics}</pre>
    </section>
  )
}
