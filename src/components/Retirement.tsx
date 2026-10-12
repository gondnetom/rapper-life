import type { GameState } from '../game/types'
import type { Dispatch } from '../game/reducer'
import { ShareCard } from './ShareCard'

export function Retirement({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  return (
    <section>
      <ShareCard state={state} />
      <button
        className="btn-secondary btn-wide"
        style={{ marginTop: 10 }}
        type="button"
        onClick={() => {
          if (window.confirm('이 커리어 지우고 새로 입갤할까요?')) dispatch({ type: 'restart' })
        }}
      >
        새 커리어
      </button>
    </section>
  )
}
