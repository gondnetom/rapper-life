import { GENRE_LABEL, ORIGINS } from '../game/content'
import type { GameState } from '../game/types'
import type { Dispatch } from '../game/reducer'

export function OriginSelect({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  if (state.screen === 'story') {
    const origin = ORIGINS.find((item) => item.id === state.originId)
    if (!origin) return null
    return (
      <section>
        <h1 className="screen-title">{origin.place}</h1>
        <div className="story">
          {state.originStory}
          <div className="genre-pill">{GENRE_LABEL[origin.genre]}</div>
        </div>
        <button className="btn btn-wide" style={{ marginTop: 16 }} type="button" onClick={() => dispatch({ type: 'ack-story' })}>
          이 동네에서 시작
        </button>
      </section>
    )
  }

  return (
    <section>
      <h1 className="screen-title">{state.rapName}</h1>
      <p className="lede">어느 동네에서 시작했는가. 그게 주력 장르가 된다.</p>
      <div className="stack">
        {ORIGINS.map((origin) => (
          <button className="choice" key={origin.id} type="button" onClick={() => dispatch({ type: 'pick-origin', id: origin.id })}>
            <strong>{origin.place}</strong>
            <em>{origin.entry} → {GENRE_LABEL[origin.genre]}</em>
          </button>
        ))}
      </div>
    </section>
  )
}
