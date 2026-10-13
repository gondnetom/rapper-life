import { useState } from 'react'
import { isRapName } from '../game/format'
import type { Dispatch } from '../game/reducer'

export function NameScreen({ dispatch }: { dispatch: Dispatch }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  return (
    <section>
      <p className="kicker">HIPHOP</p>
      <h1 className="screen-title">한국 래퍼의 삶</h1>
      <p className="lede">이름을 정하면 지망생으로 시작한다. 동네가 주력 장르를 정한다.</p>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault()
          const next = name.trim()
          if (!isRapName(next)) {
            setError('이름은 20자 이내로 정하면 된다.')
            return
          }
          dispatch({ type: 'set-name', name: next })
        }}
      >
        <label className="field">
          <span>랩네임</span>
          <input
            value={name}
            maxLength={20}
            autoComplete="off"
            placeholder="예: 야간버스"
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-wide" type="submit">
          시작
        </button>
      </form>
    </section>
  )
}
