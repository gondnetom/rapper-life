import { GENRES, GENRE_LABEL, PHASES, TRAIN_ACTIONS } from '../game/content'
import { euro, statLabel } from '../game/format'
import type { GameState, StatKey } from '../game/types'
import type { Dispatch } from '../game/reducer'

const STATS: StatKey[] = ['lyric', 'compose', 'flow', 'club', 'pr']

export function Training({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const phase = PHASES[state.phase]
  return (
    <section>
      <div className="phase-head">
        <div>
          <h1 className="screen-title">{phase.name}</h1>
          <p className="lede">{phase.desc}</p>
        </div>
        <div className="actions-left">
          <b>{state.actionsLeft}</b>
          <span>남은 행동</span>
        </div>
      </div>
      <div className="stats">
        {STATS.map((key) => (
          <div className="stat" key={key}>
            <span>{statLabel(key)}</span>
            <div className="bar">
              <i style={{ width: `${state.stats[key]}%` }} />
            </div>
            <span>{state.stats[key]}/100</span>
          </div>
        ))}
      </div>
      <div className="actions">
        {TRAIN_ACTIONS.map((action) => (
          <button
            className={action.id === 'tonic' ? 'action risk' : 'action'}
            key={action.id}
            type="button"
            disabled={Boolean(state.modal)}
            onClick={() => dispatch({ type: 'train', id: action.id })}
          >
            <b>
              {action.label}
              {action.id === 'tonic' && <i className="risk-mark">위험</i>}
            </b>
            <span>{action.id === 'tonic' ? action.detail : `${action.detail} · ${statLabel(action.stat)}`}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export function EventSheet({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const modal = state.modal
  if (!modal) return null
  return (
    <div className="sheet-back">
      <div className="sheet" role="dialog" aria-modal="true">
        {state.notice && <p className="sheet-note">{state.notice}</p>}
        <h2>{modal.title}</h2>
        <p>{modal.body}</p>
        <div className="stack">
          {modal.kind === 'shift' && state.genre && (
            <>
              {GENRES.filter((genre) => genre !== state.genre).map((genre) => (
                <button key={genre} className="btn btn-wide" type="button" onClick={() => dispatch({ type: 'resolve-event', choice: genre })}>
                  {euro(GENRE_LABEL[genre])} 바꾼다
                </button>
              ))}
              <button className="btn-secondary btn-wide" type="button" onClick={() => dispatch({ type: 'resolve-event', choice: 'keep' })}>
                하던 장르 유지
              </button>
            </>
          )}
          {modal.kind === 'label' && (
            <>
              <button className="btn btn-wide" type="button" onClick={() => dispatch({ type: 'resolve-event', choice: 'sign' })}>
                사인한다
              </button>
              <button className="btn-secondary btn-wide" type="button" onClick={() => dispatch({ type: 'resolve-event', choice: 'pass' })}>
                인디로 버틴다
              </button>
            </>
          )}
          {modal.kind === 'feature' && (
            <>
              <button className="btn btn-wide" type="button" onClick={() => dispatch({ type: 'resolve-event', choice: 'accept' })}>
                피처 받는다
              </button>
              <button className="btn-secondary btn-wide" type="button" onClick={() => dispatch({ type: 'resolve-event', choice: 'pass' })}>
                피처 거절
              </button>
            </>
          )}
          {modal.kind === 'diss' && (
            <>
              <button className="btn btn-wide" type="button" onClick={() => dispatch({ type: 'resolve-event', choice: 'fight' })}>
                맞장 받는다
              </button>
              <button className="btn-secondary btn-wide" type="button" onClick={() => dispatch({ type: 'resolve-event', choice: 'pass' })}>
                겁나서 피한다
              </button>
            </>
          )}
          {modal.kind === 'snake' && (
            <button className="btn btn-wide" type="button" onClick={() => dispatch({ type: 'resolve-event', choice: 'ok' })}>
              캡처를 봤다
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
