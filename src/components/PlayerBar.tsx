import { useEngine } from '../audio/EngineContext'
import type { Dispatch } from '../game/reducer'

export function PlayerBar({
  genre,
  credit,
  title,
  on,
  dispatch,
}: {
  genre: string
  credit: string
  title: string
  on: boolean
  dispatch: Dispatch
}) {
  const engine = useEngine()
  return (
    <div className="player">
      <button
        className="play"
        type="button"
        onClick={() => {
          if (!engine) return
          if (on && engine.playingNow) {
            engine.stop()
            dispatch({ type: 'set-beat', on: false })
            return
          }
          engine.start()
          dispatch({ type: 'set-beat', on: true })
        }}
      >
        {on ? '‖' : '▶'}
      </button>
      <div>
        <b>{title}</b>
        <span>
          {genre} · {credit}
        </span>
      </div>
    </div>
  )
}
