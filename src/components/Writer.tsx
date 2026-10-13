import { useEffect, useState } from 'react'
import { loadCover, saveCover, squareCover } from '../audio/covers'
import { uid } from '../game/format'
import { lastVowel, syllableCount } from '../game/lyricsScore'
import { SMTM_ROUNDS } from '../game/smtm'
import type { GameState } from '../game/types'
import type { Dispatch } from '../game/reducer'

function CoverField({ coverId, dispatch }: { coverId: string | null; dispatch: Dispatch }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let current = ''
    let alive = true
    if (!coverId) {
      setUrl('')
      return
    }
    void loadCover(coverId).then((blob) => {
      if (!alive || !blob) return
      current = URL.createObjectURL(blob)
      setUrl(current)
    })
    return () => {
      alive = false
      if (current) URL.revokeObjectURL(current)
    }
  }, [coverId])

  async function pick(file: File | undefined) {
    if (!file) return
    setError('')
    try {
      const blob = await squareCover(file)
      const id = uid()
      await saveCover(id, blob)
      dispatch({ type: 'set-draft', coverId: id })
    } catch {
      setError('이미지를 열지 못했다.')
    }
  }

  return (
    <div className="field">
      <span>앨범 커버</span>
      <label className="cover-pick">
        {url ? <img src={url} alt="" /> : <em>사진을 고르면 커버가 된다. 없어도 낼 수 있다.</em>}
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            void pick(file)
          }}
        />
      </label>
      {error && <p className="error">{error}</p>}
    </div>
  )
}

function iga(word: string): string {
  const last = word.charCodeAt(word.length - 1)
  const batchim = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0
  return `${word}${batchim ? '이' : '가'}`
}

export function Writer({
  state,
  dispatch,
  mode,
}: {
  state: GameState
  dispatch: Dispatch
  mode: 'release' | 'smtm'
}) {
  const round = mode === 'smtm' ? SMTM_ROUNDS[state.smtmRound] : null
  const target = mode === 'smtm' ? 2 : 4
  const acapella = round?.kind === 'acapella'
  const dissName = round?.kind === 'diss' ? state.smtmOpponent : null
  const lines = state.draftLyrics.split('\n')
  const filled = lines.map((line) => line.trim()).filter(Boolean).length
  const ready = state.draftTitle.trim().length > 0 && /[가-힣]/.test(state.draftLyrics)
  const smtmReady = /[가-힣]/.test(state.draftLyrics)
  return (
    <section>
      <h1 className="screen-title">{mode === 'smtm' ? state.draftTitle || '쇼미' : '가사'}</h1>
      <p className="lede">
        {dissName
          ? `${iga(dissName)} 이름을 불러라. ${target}줄로 받아치면 된다.`
          : acapella
            ? `무반주 심사는 비트 없이 ${target}줄이다. 발음이 전부다.`
            : mode === 'smtm'
              ? `짧은 벌스 ${target}줄이다. 줄 끝 모음을 맞추면 라임 점수가 오른다.`
              : `한 곡은 ${target}줄이다. 음절은 고르게, 줄 끝 모음은 맞춰라.`}
      </p>
      {mode === 'smtm' && <p className="note">표지는 쇼미 스타일로 붙는다.</p>}
      <div className="stack">
        {mode === 'release' && (
          <>
            <CoverField coverId={state.draftCoverId} dispatch={dispatch} />
            <label className="field">
              <span>곡 제목</span>
              <input
                value={state.draftTitle}
                maxLength={24}
                placeholder="곡 제목"
                onChange={(event) => dispatch({ type: 'set-draft', title: event.target.value })}
              />
            </label>
          </>
        )}
        <label className="field">
          <span>
            가사 {filled}/{target}
          </span>
          <textarea
            value={state.draftLyrics}
            placeholder={'한 줄에 한 마디\n모음이 이어지게'}
            onChange={(event) => dispatch({ type: 'set-draft', lyrics: event.target.value })}
          />
        </label>
        <div className="lines">
          {lines.slice(0, 12).map((line, index) => (
            <div className="line-meta" key={`${index}-${line}`}>
              <span>{index + 1}</span>
              <span>{syllableCount(line)}음절</span>
              <span>{lastVowel(line) ?? '-'}</span>
            </div>
          ))}
        </div>
        <button
          className="btn btn-wide"
          type="button"
          disabled={mode === 'release' ? !ready : !smtmReady}
          onClick={() => dispatch({ type: mode === 'release' ? 'submit-release' : 'submit-smtm' })}
        >
          {acapella ? '무반주로' : '비트 위로'}
        </button>
      </div>
    </section>
  )
}
