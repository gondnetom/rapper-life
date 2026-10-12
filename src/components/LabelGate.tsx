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
        <p className="lede">이름은 있다. 레이블을 직접 차리거나, 지금 노선에 남을 수 있다.</p>
        <div className="stack">
          <button className="choice" type="button" onClick={() => dispatch({ type: 'found-label' })}>
            <strong>{state.rapName} 레코드</strong>
            <em>직접 차린다 · 보증금 6만 · 이후 정산은 내 간판</em>
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
          이름값은 {state.reputation}이다. {offers.length ? '이름이 닿는 곳만 계약서를 들고 온다.' : '아직 전화는 없다. 무명으로 본다.'}
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
          {offers.length ? '거절하고 인디로 간다' : '인디로 전성기에 들어간다'}
        </button>
      </div>
      {state.signedLabel && <p className="note">이미 {wa(state.labelName ?? '레이블')} 계약 중이다. 다른 간판을 고르면 이적한다.</p>}
    </section>
  )
}
