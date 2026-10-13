import { useEffect, useRef, useState, type ReactNode } from 'react'
import { beatCredit } from '../audio/beats'
import { playNotice } from '../audio/uiSound'
import { GENRE_LABEL, PHASES } from '../game/content'
import { isAcapellaScreen } from '../game/smtm'
import { formatRep, formatWon } from '../game/format'
import type { GameState } from '../game/types'
import type { Dispatch } from '../game/reducer'
import { PlayerBar } from './PlayerBar'

const LIVE = new Set(['write', 'stage', 'smtmWrite', 'smtmStage'])

function Alarm({ notice, tick, lift }: { notice: string | null; tick: number; lift: boolean }) {
  const [shown, setShown] = useState<string | null>(null)
  const skip = useRef(true)
  useEffect(() => {
    if (skip.current) {
      skip.current = false
      return
    }
    if (!notice || tick <= 0) return
    setShown(notice)
    playNotice()
    const id = window.setTimeout(() => setShown(null), 3400)
    return () => window.clearTimeout(id)
  }, [notice, tick])
  if (!shown) return null
  return (
    <button className={lift ? 'alarm lift' : 'alarm'} type="button" onClick={() => setShown(null)}>
      <small>알림</small>
      <strong>{shown}</strong>
    </button>
  )
}

export function Shell({
  state,
  dispatch,
  children,
}: {
  state: GameState
  dispatch: Dispatch
  children: ReactNode
}) {
  const intro = state.screen === 'name' || state.screen === 'origin' || state.screen === 'story'
  const showPlayer =
    !intro &&
    state.tab === 'now' &&
    LIVE.has(state.screen) &&
    Boolean(state.genre) &&
    !isAcapellaScreen(state.screen, state.smtmRound)
  return (
    <div className="app">
      {!intro && (
        <header className="top">
          <div className="top-row">
            <div>
              <p className="kicker">{state.screen === 'retire' ? '은퇴' : PHASES[state.phase]?.name}</p>
              <h1 className="rap-name">
                {state.snakeTag ? <span className="snake-mark">뱀새끼</span> : null}
                {state.rapName}
              </h1>
            </div>
          </div>
          <p className="top-meta">
            잔고 {formatWon(state.money)} · 이름값 {formatRep(state.reputation)}
            {state.genre ? ` · ${GENRE_LABEL[state.genre]}` : ''}
          </p>
          <div className="badges">
            {state.signedLabel && <span className="badge">{state.labelName ?? '레이블'}</span>}
            {state.snakeTag && <span className="badge warn">뱀새끼</span>}
            {state.pendingShift && <span className="badge">노선 변경 대기</span>}
          </div>
        </header>
      )}
      <main className={showPlayer ? 'main with-player' : 'main'}>{children}</main>
      {!intro && <Alarm notice={state.notice} tick={state.noticeTick} lift={showPlayer} />}
      {showPlayer && state.genre && (
        <PlayerBar
          genre={GENRE_LABEL[state.genre]}
          credit={state.genre ? beatCredit(state.beatId, state.genre) : ''}
          title={state.draftTitle || '작업 중'}
          on={state.beatOn}
          dispatch={dispatch}
        />
      )}
      {!intro && (
        <nav className="nav">
          <button className={state.tab === 'now' ? 'on' : ''} onClick={() => dispatch({ type: 'set-tab', tab: 'now' })} type="button">
            지금
          </button>
          <button className={state.tab === 'album' ? 'on' : ''} onClick={() => dispatch({ type: 'set-tab', tab: 'album' })} type="button">
            앨범
          </button>
          <button className={state.tab === 'log' ? 'on' : ''} onClick={() => dispatch({ type: 'set-tab', tab: 'log' })} type="button">
            기록
          </button>
        </nav>
      )}
    </div>
  )
}
