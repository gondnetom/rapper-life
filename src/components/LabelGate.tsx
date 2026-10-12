import { labelOffers } from '../game/content'
import { formatWon, wa } from '../game/format'
import type { GameState } from '../game/types'
import type { Dispatch } from '../game/reducer'

export function LabelGate({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  if (state.screen === 'labelFuture') {
    const stay = state.signedLabel ? `${state.labelName} 잔류` : '인디 잔류'
    return (
      <section>
        <p className="kicker">전성기 끝</p>
        <h1 className="screen-title">간판</h1>
        <p className="lede">닉은 있음. 레이블을 직접 차리거나 지금 노선에 남는다.</p>
        <div className="stack">
          <button className="choice" type="button" onClick={() => dispatch({ type: 'found-label' })}>
            <strong>{state.rapName} 레코드</strong>
            <em>직접 차림 · 보증금 6만 · 이후 정산은 내 간판</em>
          </button>
          <button className="btn-secondary btn-wide" type="button" onClick={() => dispatch({ type: 'stay-label' })}>
            {stay}
          </button>
        </div>
      </section>
    )
  }

  const offers = labelOffers(state.reputation)
  return (
    <section>
        <p className="kicker">신입 끝</p>
        <h1 className="screen-title">레이블 계약서</h1>
        <p className="lede">
          네임드 {state.reputation}. {offers.length ? '이름 닿는 곳만 계약서를 들고 옴.' : '아직 전화 없음. 하꼬 취급.'}
        </p>
      <div className="stack">
        {offers.map((offer) => (
          <button className="choice" key={offer.name} type="button" onClick={() => dispatch({ type: 'pick-label', name: offer.name })}>
            <strong>{offer.name}</strong>
            <em>
              선급 {formatWon(offer.advance)} · {offer.line}
            </em>
          </button>
        ))}
        {state.signedLabel && state.labelName && (
          <button className="btn btn-wide" type="button" onClick={() => dispatch({ type: 'pick-label', name: state.labelName })}>
            {state.labelName} 잔류
          </button>
        )}
        <button className="btn-secondary btn-wide" type="button" onClick={() => dispatch({ type: 'pick-label', name: null })}>
          {offers.length ? '거절하고 인디로 감' : '인디로 전성기 진입'}
        </button>
      </div>
      {state.signedLabel && <p className="note">이미 {wa(state.labelName ?? '레이블')} 계약 중. 다른 간판 고르면 이적.</p>}
    </section>
  )
}
