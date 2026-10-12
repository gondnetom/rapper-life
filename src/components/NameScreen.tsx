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
      <p className="lede">닉을 정하면 지망생으로 입갤한다. 동네가 본캐 장르를 잠근다.</p>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault()
          const next = name.trim()
          if (!isRapName(next)) {
            setError('닉은 한글, 영문, 숫자 2자에서 12자.')
            return
          }
          dispatch({ type: 'set-name', name: next })
        }}
      >
        <label className="field">
          <span>랩네임</span>
          <input
            value={name}
            maxLength={12}
            autoComplete="off"
            placeholder="예: 야간버스"
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-wide" type="submit">
          입갤
        </button>
      </form>
    </section>
  )
}
