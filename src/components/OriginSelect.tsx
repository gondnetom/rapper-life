import { GENRE_LABEL, GENRE_STARTS, genreStart } from '../game/content'
import type { GameState } from '../game/types'
import type { Dispatch } from '../game/reducer'

export function OriginSelect({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  if (state.screen === 'story') {
    const start = genreStart(state.originId ?? state.genre)
    if (!start) return null
    return (
      <section>
        <h1 className="screen-title">{start.place}</h1>
        <div className="story">
          {state.originStory}
          <div className="genre-pill">{GENRE_LABEL[start.genre]}</div>
        </div>
        <button className="btn btn-wide" style={{ marginTop: 16 }} type="button" onClick={() => dispatch({ type: 'ack-story' })}>
          여기서 시작
        </button>
      </section>
    )
  }

  return (
    <section>
      <h1 className="screen-title">{state.rapName}</h1>
      <p className="lede">어디서 시작할지 고른다. 나중에 노선을 바꿀 수도 있다.</p>
      <div className="stack">
        {GENRE_STARTS.map((start) => (
          <button className="choice" key={start.genre} type="button" onClick={() => dispatch({ type: 'pick-origin', id: start.genre })}>
            <strong>{start.place}</strong>
            <em>
              {GENRE_LABEL[start.genre]} · {start.entry}
            </em>
          </button>
        ))}
      </div>
    </section>
  )
}
