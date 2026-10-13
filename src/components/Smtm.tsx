import { PRODUCERS } from '../game/content'
import { formatCount, formatWon } from '../game/format'
import { SMTM_ROUNDS } from '../game/smtm'
import type { GameState } from '../game/types'
import type { Dispatch } from '../game/reducer'

export function Smtm({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  if (state.screen === 'smtmTeam') {
    return (
      <section>
        <p className="kicker">TEAM</p>
        <h1 className="screen-title">팀 선택</h1>
        <p className="lede">네 팀 중 하나를 고른다. 각 팀에 프로듀서가 두 명이다. 고르면 그 뒤로 파급이 붙는다.</p>
        <div className="stack">
          {PRODUCERS.map((producer) => (
            <button
              className="action"
              key={producer.id}
              type="button"
              onClick={() => dispatch({ type: 'smtm-team', id: producer.id })}
            >
              <b>
                {producer.team} · {producer.names.join(', ')}
              </b>
              <span>{producer.meme}</span>
            </button>
          ))}
        </div>
      </section>
    )
  }

  if (state.screen === 'smtmYoutube' && state.lastYoutube) {
    const clip = state.lastYoutube
    const round = SMTM_ROUNDS[clip.roundIndex]
    const ripple = Math.round(clip.ripple * 100)
    return (
      <section>
        <div className="youtube">
          <p className="kicker">{clip.passed ? 'PASS' : 'DROP'}</p>
          <h1 className="yt-title">
            {state.snakeTag ? `[뱀새끼] ` : ''}
            {state.rapName} {clip.roundName}
            {round.kind === 'diss' && clip.rivalName ? ` vs ${clip.rivalName}` : ''}
          </h1>
          <p className="producer">
            <b>{clip.producer}</b>
            <span>{clip.producerLine}</span>
          </p>
          <p className="views">
            조회수 {formatCount(clip.views)}
            <span>좋아요 {formatCount(clip.likes)}</span>
          </p>
          <p className="note">
            판정 {Math.round(clip.judgement)}
            {clip.rivalScore != null && clip.rivalName
              ? ` · ${clip.rivalName} ${clip.rivalScore}`
              : round.kind === 'team'
                ? ' · 팀 합류'
                : ` · 기준 ${round.bar}`}
            {state.snakeTag ? ' · 뱀새끼 -4' : ''}
          </p>
          {clip.comments.map((line) => (
            <p className="comment" key={line}>
              {line}
            </p>
          ))}
        </div>
        <p className={clip.passed ? 'delta' : 'delta down'} style={{ marginTop: 12 }}>
          {clip.passed
            ? [
                `통과했다 · 파급 +${ripple}%`,
                clip.gig ? `공연 제의 ${formatWon(clip.gig)}` : '',
                clip.prize ? `상금 ${formatWon(clip.prize)}` : '',
              ]
                .filter(Boolean)
                .join(' · ')
            : '탈락 · 파급은 여기서 멈춘다'}
          {' · '}이번 시즌 {formatWon(clip.seasonEarned)}
        </p>
        {state.lastPerformNote && <p className="note">{state.lastPerformNote}</p>}
        <button className="btn btn-wide" style={{ marginTop: 16 }} type="button" onClick={() => dispatch({ type: 'ack-youtube' })}>
          {clip.passed && clip.roundIndex < SMTM_ROUNDS.length - 1 ? '다음 라운드' : '시즌 마무리'}
        </button>
      </section>
    )
  }

  return (
    <section>
      <p className="kicker">SHOW ME THE MONEY</p>
      <h1 className="screen-title">쇼미더머니</h1>
      <p className="lede">
        {state.smtmTrashTalk
          ? '예전에 쇼미를 뱀새끼라고 깎아 놨다. 지금 나가면 그 말이 닉 앞에 붙는다.'
          : '파이널 상금은 10억이다. 라운드를 넘기면 파급이 붙고, 이름값이 높으면 다음 단계가 쉽다. 인맥 힙합이다.'}
      </p>
      <div className="stack">
        {SMTM_ROUNDS.map((round, index) => (
          <div className="line-meta" key={round.name}>
            <span>
              {index + 1}. {round.name}
              {round.kind === 'acapella' ? ' · 무반주' : ''}
              {round.kind === 'team' ? ' · 프로듀서' : ''}
              {round.kind === 'diss' ? ' · 상대 호명' : ''}
              {round.prize ? ` · 상금 ${formatWon(round.prize)}` : ''}
            </span>
            <b>파급효과 +{Math.round(round.ripple * 100)}%</b>
          </div>
        ))}
        <button className="btn btn-wide" type="button" onClick={() => dispatch({ type: 'smtm-join' })}>
          출연한다
        </button>
        <button className="btn-secondary btn-wide" type="button" onClick={() => dispatch({ type: 'smtm-skip' })}>
          나가지 않는다
        </button>
        {!state.smtmTrashTalk && (
          <button className="btn-ghost btn-wide" type="button" onClick={() => dispatch({ type: 'smtm-trash' })}>
            쇼미를 뱀새끼라고 말한다
          </button>
        )}
      </div>
    </section>
  )
}
