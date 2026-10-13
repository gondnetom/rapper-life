import { useEffect, useState } from 'react'
import { loadCover } from '../audio/covers'
import { playTake, stopTake } from '../audio/takes'
import { shareAlbum } from '../lib/albumShare'
import { GENRE_LABEL, PHASES, groupTimeline } from '../game/content'
import { formatRep, formatWon, statLabel, VISIBLE_STATS } from '../game/format'
import type { GameState, TimelineItem, Track } from '../game/types'
import type { Dispatch } from '../game/reducer'

function CoverFace({ track, playing }: { track: Track; playing: boolean }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    let current = ''
    let alive = true
    if (!track.coverId) {
      setUrl('')
      return
    }
    void loadCover(track.coverId).then((blob) => {
      if (!alive || !blob) return
      current = URL.createObjectURL(blob)
      setUrl(current)
    })
    return () => {
      alive = false
      if (current) URL.revokeObjectURL(current)
    }
  }, [track.coverId])
  return (
    <>
      {url && <img src={url} alt="" />}
      <span className="cover-mark">{playing ? '‖' : '▶'}</span>
    </>
  )
}


export function CareerTimeline({ items }: { items: TimelineItem[] }) {
  const groups = groupTimeline(items)
  if (!groups.length) return <p className="empty">아직 기록이 없다.</p>
  return (
    <div className="timeline">
      {groups.map((group) => (
        <section className="phase-log" key={`${group.phase}-${group.items[0]?.id}`}>
          <h3>{group.name}</h3>
          {group.items.map((item) => (
            <div className="tl" key={item.id}>
              <i />
              <div>
                <b>{item.title}</b>
                <span>{item.detail}</span>
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}

export function AlbumList({ state }: { state: GameState }) {
  const [open, setOpen] = useState<string | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [shareNote, setShareNote] = useState<{ id: string; text: string } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => () => stopTake(), [])

  if (!state.tracks.length) return <p className="empty">아직 낸 곡이 없다.</p>
  return (
    <div>
      {state.tracks.map((track) => {
        const expanded = open === track.id
        return (
          <article className="track" key={track.id}>
            <button
              className={`cover genre-${track.genre}`}
              type="button"
              onClick={() => {
                void (async () => {
                  if (playing === track.id) {
                    stopTake()
                    setPlaying(null)
                    setNote('')
                    return
                  }
                  const mode = await playTake(track.genre, track.audioId, track.beatId)
                  setPlaying(track.id)
                  setOpen(track.id)
                  setNote(mode === 'full' ? '녹음본을 비트 위에 깔았다.' : '녹음이 없어서 비트만 깔았다.')
                })()
              }}
            >
              <CoverFace track={track} playing={playing === track.id} />
            </button>
            <button className="track-meta" type="button" onClick={() => setOpen(expanded ? null : track.id)}>
              <b>{track.title}</b>
              <span>
                {PHASES[track.phase]?.name} · {GENRE_LABEL[track.genre]} · 리드머 {track.rhythmMark.toFixed(1)}/5
                {track.shift === 'boom' ? ' · 노선 호평' : track.shift === 'bust' ? ' · 노선 혹평' : ''}
              </span>
            </button>
            <div className="track-side">
              <b>{track.score}</b>
              <button
                className="share-mini"
                type="button"
                disabled={busy === track.id}
                onClick={() => {
                  setOpen(track.id)
                  setBusy(track.id)
                  setShareNote({ id: track.id, text: '커버를 뽑는 중이다.' })
                  void shareAlbum(track, state.rapName).then((message) => {
                    setShareNote(message ? { id: track.id, text: message } : null)
                    setBusy(null)
                  })
                }}
              >
                공유
              </button>
            </div>
            {expanded && (
              <div className="track-body">
                <p>
                  {GENRE_LABEL[track.genre]} · 라임 {track.writingScore} · 스킬 {track.performScore} · {formatWon(track.money)}
                </p>
                {playing === track.id && note && <p className="note">{note}</p>}
                {shareNote?.id === track.id && shareNote.text && <p className="note">{shareNote.text}</p>}
                <pre>{track.lyrics}</pre>
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}

export function LogView({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  return (
    <section>
      <h1 className="screen-title">기록</h1>
      <div className="stats">
        {VISIBLE_STATS.map((key) => (
          <div className="stat" key={key}>
            <span>{statLabel(key)}</span>
            <div className="bar">
              <i style={{ width: `${state.stats[key]}%` }} />
            </div>
            <span>{state.stats[key]}/100</span>
          </div>
        ))}
      </div>
      <p className="lede">
        잔고 {formatWon(state.money)} · 이름값 {formatRep(state.reputation)}
        {state.buzz > 1 ? ` · 파급효과 ${Math.round(state.buzz * 100)}%` : ''}
      </p>
      <CareerTimeline items={state.timeline} />
      <button
        className="btn-secondary btn-wide"
        style={{ marginTop: 20 }}
        type="button"
        onClick={() => {
          if (window.confirm('이 커리어를 지우고 새로 시작할까요?')) dispatch({ type: 'restart' })
        }}
      >
        새 커리어
      </button>
    </section>
  )
}
