import { useEffect } from 'react'
import type { GameState } from '../game/types'
import { formatWon } from '../game/format'
import type { Dispatch } from '../game/reducer'
import { requestCritique } from '../lib/ai/critique'

export function Reaction({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const track = state.lastRelease
  useEffect(() => {
    if (!track || !state.genre) return
    void requestCritique({
      rapName: state.rapName,
      genre: state.genre,
      lyrics: track.lyrics,
      score: track.score,
    })
  }, [track, state.genre, state.rapName])
  if (!track) return null
  const up = state.lastRepDelta >= 0
  return (
    <section>
      <p className="kicker">갤 점수</p>
      <div className="score-hero">
        <b>{track.score}</b>
        <small>/100</small>
      </div>
      <div className="split">
        <div className="mini">
          <b>{track.writingScore}</b>
          <span>라임</span>
        </div>
        <div className="mini">
          <b>{track.performScore}</b>
          <span>스킬</span>
        </div>
      </div>
      <div className="critic">
        <h2>리드머 {track.rhythmMark.toFixed(1)}/5</h2>
        {track.rhythm.map((line) => (
          <p className="comment" key={line}>
            {line}
          </p>
        ))}
      </div>
      <div className="forum">
        <h2>힙갤</h2>
        {track.hipgal.map((line) => (
          <p className="comment" key={line}>
            <span className="nick">ㅇㅇ</span>
            {line}
          </p>
        ))}
      </div>
      {track.shift === 'boom' && <div className="banner">노선 변경 개추. 본캐 찾음.</div>}
      {track.shift === 'bust' && <div className="banner bust">노선 변경 비추. 유행만 쫓음.</div>}
      {state.lastPerformNote && <p className="note">{state.lastPerformNote}</p>}
      <p className={up ? 'delta' : 'delta down'}>
        정산 · 네임드 {up ? '+' : ''}
        {state.lastRepDelta} · 앨범 {formatWon(track.money)}
      </p>
      <button className="btn btn-wide" style={{ marginTop: 16 }} type="button" onClick={() => dispatch({ type: 'ack-reaction' })}>
        {state.phase >= 1 ? '쇼미 나갈지 고민' : '다음으로'}
      </button>
    </section>
  )
}
