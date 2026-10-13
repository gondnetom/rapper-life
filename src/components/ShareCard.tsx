import { useState } from 'react'
import { loadCover } from '../audio/covers'
import { paintAlbumCard } from '../lib/albumShare'
import { describeCareer, smtmCareerLabel } from '../game/archetype'
import { BRIEF_ACTIONS, GENRE_LABEL, ORIGINS, PHASES, groupTimeline } from '../game/content'
import { euro, formatRep, formatWon, statLabel, topStat } from '../game/format'
import { signatureLine } from '../game/lyricsScore'
import type { GameState, Genre } from '../game/types'

const GENRE_COLOR: Record<string, string> = {
  boomBap: '#c4a574',
  trap: '#1db954',
  mumble: '#8d7cff',
  rage: '#ff4d4d',
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lineHeight: number) {
  let line = ''
  let cursor = y
  for (const ch of text) {
    const next = line + ch
    if (ctx.measureText(next).width > max && line) {
      ctx.fillText(line, x, cursor)
      line = ch
      cursor += lineHeight
    } else {
      line = next
    }
  }
  if (line) ctx.fillText(line, x, cursor)
  return cursor + lineHeight
}

function careerGroups(state: GameState) {
  return groupTimeline(state.timeline)
    .map((group) => ({
      ...group,
      items: state.originStory.trim() ? group.items.filter((item) => item.title !== '입문') : group.items,
    }))
    .filter((group) => group.items.length > 0)
}

function phaseStyles(state: GameState): { phase: number; name: string; genre: Genre }[] {
  const last = Math.min(PHASES.length - 1, Math.max(0, state.phase))
  const rows: { phase: number; name: string; genre: Genre }[] = []
  for (let phase = 0; phase <= last; phase += 1) {
    const track = [...state.tracks].reverse().find((item) => item.phase === phase)
    const snap = [...state.history].reverse().find((item) => item.phase === phase)
    const genre = track?.genre ?? snap?.genre ?? (phase === state.phase ? state.genre : null)
    if (!genre) continue
    rows.push({ phase, name: PHASES[phase]?.name ?? '기록', genre })
  }
  return rows
}

function showMeLine(state: GameState): string {
  if (state.smtmBestClears < 0 && state.smtmTrashTalk) return '쇼미에는 나가지 않고 욕만 했다.'
  if (state.smtmBestClears < 0) return '쇼미에는 나가지 않았다.'
  if (state.smtmBestClears >= 7) return '쇼미는 파이널에서 우승했다.'
  return `쇼미는 ${euro(smtmCareerLabel(state.smtmBestClears, state.smtmTrashTalk))} 끝났다.`
}

function smtmSeasonCards(state: GameState): { name: string; label: string }[] {
  return PHASES.flatMap((phase, index) => {
    const row = (state.smtmSeasons ?? []).find((item) => item.phase === index)
    if (!row?.label) return []
    return [{ name: phase.name, label: row.label }]
  })
}

function isDissTitle(title: string) {
  return title.includes('맞장') || title.includes('디스')
}

function dissLabel(title: string) {
  return title.split('맞장').join('디스')
}

function affiliation(state: GameState) {
  if (state.signedLabel || state.ownLabel) return state.labelName ?? '레이블'
  return '인디'
}

function biography(state: GameState): string[] {
  const origin = ORIGINS.find((item) => item.id === state.originId)
  const lines: string[] = []
  if (state.originStory.trim()) lines.push(state.originStory.trim())
  else if (origin && state.genre) {
    lines.push(`${origin.place}에서 시작했다. 주력 장르는 ${GENRE_LABEL[origin.genre]}이다.`)
  }
  if (state.ownLabel) lines.push(`${state.labelName ?? '자기 레이블'} 간판은 직접 달았다.`)
  else if (state.signedLabel) lines.push(`${state.labelName ?? '레이블'} 소속이다.`)
  else lines.push('소속사 없이 인디로 활동했다.')
  lines.push(
    `${showMeLine(state)} 통장에는 ${formatWon(state.money)}이 있고, 이름값은 ${formatRep(state.reputation)}이다. 제일 잘한 건 ${statLabel(topStat(state.stats))}이다.`,
  )
  if (state.snakeTag) lines.push('쇼미 출연과 그 욕이 같이 남아서, 레이블 옆에 뱀새끼가 붙었다.')
  return lines
}

function cropCanvas(scratch: HTMLCanvasElement, y: number, footerReserve: number) {
  const height = Math.max(1680, y + footerReserve)
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = height
  const out = canvas.getContext('2d')
  if (!out) return null
  out.fillStyle = '#101010'
  out.fillRect(0, 0, 1080, height)
  const drawn = Math.min(y, scratch.height)
  out.drawImage(scratch, 0, 0, 1080, drawn, 0, 0, 1080, drawn)
  return canvas
}

function paintHistory(
  ctx: CanvasRenderingContext2D,
  history: ReturnType<typeof careerGroups>,
  color: string,
  start: number,
) {
  let y = start
  for (const group of history) {
    ctx.fillStyle = color
    ctx.font = '800 30px Pretendard, Malgun Gothic, sans-serif'
    ctx.fillText(group.name, 72, y + 28)
    y += 48
    const brief = group.items.filter((item) => BRIEF_ACTIONS.has(item.title))
    const disses = group.items.filter((item) => isDissTitle(item.title))
    const full = group.items.filter((item) => !BRIEF_ACTIONS.has(item.title) && !isDissTitle(item.title))
    if (brief.length) {
      ctx.fillStyle = '#d7d7d7'
      ctx.font = '500 26px Pretendard, Malgun Gothic, sans-serif'
      y = wrap(ctx, brief.map((item) => item.title).join(' · '), 96, y + 8, 900, 40)
    }
    if (disses.length) {
      ctx.fillStyle = '#b3b3b3'
      ctx.font = '500 24px Pretendard, Malgun Gothic, sans-serif'
      y = wrap(ctx, disses.map((item) => dissLabel(item.title)).join(' · '), 96, y + 8, 900, 36)
    }
    for (const item of full) {
      ctx.fillStyle = '#1b1b1b'
      ctx.fillRect(96, y, 912, 70)
      ctx.fillStyle = '#ffffff'
      ctx.font = '700 24px Pretendard, Malgun Gothic, sans-serif'
      ctx.fillText(item.title, 116, y + 28)
      ctx.fillStyle = '#9a9a9a'
      ctx.font = '400 20px Pretendard, Malgun Gothic, sans-serif'
      ctx.fillText(item.detail.length > 46 ? `${item.detail.slice(0, 46)}…` : item.detail, 116, y + 54)
      y += 80
    }
  }
  return y
}

function paintPoster(state: GameState) {
  const career = describeCareer(state)
  const origin = ORIGINS.find((item) => item.id === state.originId)
  const styles = phaseStyles(state)
  const footerReserve = 72
  const scratch = document.createElement('canvas')
  scratch.width = 1080
  scratch.height = 7200
  const ctx = scratch.getContext('2d')
  if (!ctx) return null
  const color = state.genre ? GENRE_COLOR[state.genre] : '#1db954'
  ctx.fillStyle = '#101010'
  ctx.fillRect(0, 0, 1080, scratch.height)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1080, 18)
  ctx.font = '700 28px Pretendard, Malgun Gothic, sans-serif'
  ctx.fillText('한국 래퍼의 삶', 72, 110)
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 84px Pretendard, Malgun Gothic, sans-serif'
  let y = wrap(ctx, state.rapName, 72, 220, 936, 96)
  ctx.fillStyle = color
  ctx.font = '800 42px Pretendard, Malgun Gothic, sans-serif'
  ctx.fillText(career.title, 72, y + 20)
  y += 78
  ctx.fillStyle = '#d0d0d0'
  ctx.font = '400 32px Pretendard, Malgun Gothic, sans-serif'
  y = wrap(ctx, career.blurb, 72, y, 936, 46)
  const chips = [
    state.genre ? GENRE_LABEL[state.genre] : '',
    origin?.place ?? '',
    affiliation(state),
    state.snakeTag ? '뱀새끼' : '',
    `잔고 ${formatWon(state.money)}`,
    `이름값 ${formatRep(state.reputation)}`,
    smtmCareerLabel(state.smtmBestClears, state.smtmTrashTalk),
  ].filter(Boolean)
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 28px Pretendard, Malgun Gothic, sans-serif'
  y = wrap(ctx, chips.join('  ·  '), 72, y + 8, 936, 42)

  ctx.fillStyle = color
  ctx.font = '800 28px Pretendard, Malgun Gothic, sans-serif'
  ctx.fillText('커리어', 72, y + 20)
  y += 64
  ctx.fillStyle = '#d7d7d7'
  ctx.font = '400 30px Pretendard, Malgun Gothic, sans-serif'
  for (const line of biography(state)) y = wrap(ctx, line, 72, y, 936, 44)
  y += 8

  ctx.fillStyle = color
  ctx.font = '800 28px Pretendard, Malgun Gothic, sans-serif'
  ctx.fillText('주력', 72, y + 28)
  y += 52
  for (const row of styles) {
    ctx.fillStyle = '#1b1b1b'
    ctx.fillRect(72, y, 936, 56)
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 26px Pretendard, Malgun Gothic, sans-serif'
    ctx.fillText(row.name, 96, y + 36)
    ctx.fillStyle = color
    ctx.font = '800 26px Pretendard, Malgun Gothic, sans-serif'
    const label = GENRE_LABEL[row.genre]
    ctx.fillText(label, 984 - ctx.measureText(label).width, y + 36)
    y += 68
  }
  y += 8

  ctx.fillStyle = color
  ctx.font = '800 28px Pretendard, Malgun Gothic, sans-serif'
  ctx.fillText('대표 가사', 72, y + 28)
  y += 52
  state.tracks.forEach((track, index) => {
    const quote = signatureLine(track.lyrics)
    ctx.fillStyle = '#1b1b1b'
    ctx.fillRect(72, y, 936, 150)
    ctx.fillStyle = color
    ctx.fillRect(72, y, 12, 150)
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 32px Pretendard, Malgun Gothic, sans-serif'
    ctx.fillText(`${index + 1}  ${track.title}`, 104, y + 42)
    ctx.fillStyle = '#9a9a9a'
    ctx.font = '400 24px Pretendard, Malgun Gothic, sans-serif'
    ctx.fillText(
      `${PHASES[track.phase]?.name ?? ''} · ${GENRE_LABEL[track.genre]} · ${track.score}점 · 리드머 ${track.rhythmMark.toFixed(1)}/5.0`,
      104,
      y + 78,
    )
    ctx.fillStyle = '#ffffff'
    ctx.font = '500 26px Pretendard, Malgun Gothic, sans-serif'
    ctx.fillText(quote ? `“${quote.length > 28 ? `${quote.slice(0, 28)}…` : quote}”` : '', 104, y + 118)
    y += 166
  })

  const seasons = smtmSeasonCards(state)
  if (seasons.length) {
    ctx.fillStyle = color
    ctx.font = '800 28px Pretendard, Malgun Gothic, sans-serif'
    ctx.fillText('쇼미', 72, y + 28)
    y += 52
    for (const row of seasons) {
      ctx.fillStyle = '#1b1b1b'
      ctx.fillRect(72, y, 936, 108)
      ctx.fillStyle = color
      ctx.fillRect(72, y, 10, 108)
      ctx.font = '800 24px Pretendard, Malgun Gothic, sans-serif'
      ctx.fillText(row.name, 104, y + 40)
      ctx.fillStyle = '#ffffff'
      ctx.font = '700 32px Pretendard, Malgun Gothic, sans-serif'
      ctx.fillText(row.label, 104, y + 80)
      y += 122
    }
    y += 8
  }

  return cropCanvas(scratch, y, footerReserve)
}

function paintLog(state: GameState) {
  const history = careerGroups(state)
  if (!history.length) return null
  const footerReserve = 72
  const scratch = document.createElement('canvas')
  scratch.width = 1080
  scratch.height = 7200
  const ctx = scratch.getContext('2d')
  if (!ctx) return null
  const color = state.genre ? GENRE_COLOR[state.genre] : '#1db954'
  ctx.fillStyle = '#101010'
  ctx.fillRect(0, 0, 1080, scratch.height)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1080, 18)
  ctx.font = '700 28px Pretendard, Malgun Gothic, sans-serif'
  ctx.fillText('한국 래퍼의 삶', 72, 110)
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 72px Pretendard, Malgun Gothic, sans-serif'
  ctx.fillText('약력', 72, 210)
  ctx.fillStyle = '#d0d0d0'
  ctx.font = '500 32px Pretendard, Malgun Gothic, sans-serif'
  const y = paintHistory(ctx, history, color, wrap(ctx, state.rapName, 72, 268, 936, 44) + 12)
  return cropCanvas(scratch, y, footerReserve)
}

function blobOf(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob((file) => resolve(file), 'image/png'))
}

function safePart(value: string) {
  const raw = value.replace(/[\\/:*?"<>|]/g, '').trim()
  return raw.slice(0, 40) || 'image'
}

function downloadFiles(files: File[]) {
  const urls: string[] = []
  for (const file of files) {
    const url = URL.createObjectURL(file)
    urls.push(url)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    link.remove()
  }
  window.setTimeout(() => {
    for (const url of urls) URL.revokeObjectURL(url)
  }, 4000)
}

function saveStatus(parts: string[], shared: boolean) {
  const list = parts.join(', ')
  return shared ? `${list}을 공유 창에 올렸다.` : `${list}을 저장했다.`
}

function PhaseLogs({
  history,
  color,
}: {
  history: ReturnType<typeof careerGroups>
  color: string
}) {
  return (
    <>
      {history.map((group) => {
        const brief = group.items.filter((item) => BRIEF_ACTIONS.has(item.title))
        const disses = group.items.filter((item) => isDissTitle(item.title))
        const full = group.items.filter((item) => !BRIEF_ACTIONS.has(item.title) && !isDissTitle(item.title))
        return (
          <div className="phase-log" key={`${group.phase}-${group.items[0]?.id}`}>
            <b style={{ color }}>{group.name}</b>
            {brief.length > 0 && <p className="action-brief">{brief.map((item) => item.title).join(' · ')}</p>}
            {disses.length > 0 && <p className="diss-brief">{disses.map((item) => dissLabel(item.title)).join(' · ')}</p>}
            {full.map((item) => (
              <div className="action-row" key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
            ))}
          </div>
        )
      })}
    </>
  )
}

export function ShareCard({ state }: { state: GameState }) {
  const career = describeCareer(state)
  const origin = ORIGINS.find((item) => item.id === state.originId)
  const [status, setStatus] = useState('')
  const bio = biography(state)
  const styles = phaseStyles(state)
  const history = careerGroups(state)

  async function save() {
    await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1200))])
    const files: File[] = []
    const parts: string[] = []
    const poster = paintPoster(state)
    const posterBlob = poster ? await blobOf(poster) : null
    if (posterBlob) {
      files.push(new File([posterBlob], `${safePart(state.rapName)}-결과표.png`, { type: 'image/png' }))
      parts.push('결과표')
    }
    const log = paintLog(state)
    const logBlob = log ? await blobOf(log) : null
    if (logBlob) {
      files.push(new File([logBlob], `${safePart(state.rapName)}-약력.png`, { type: 'image/png' }))
      parts.push('약력')
    }

    const used = new Set<string>()
    let trackCount = 0
    for (const track of state.tracks) {
      let cover: Blob | null = null
      if (track.coverId) {
        try {
          cover = await loadCover(track.coverId)
        } catch {
          cover = null
        }
      }
      const image = await paintAlbumCard({
        rapName: state.rapName,
        title: track.title,
        genre: track.genre,
        score: track.score,
        rhythmMark: track.rhythmMark,
        lyrics: track.lyrics,
        cover,
      })
      if (!image) continue
      let base = `${safePart(state.rapName)}-곡-${safePart(track.title)}`
      if (used.has(base)) {
        let n = 2
        while (used.has(`${base}-${n}`)) n += 1
        base = `${base}-${n}`
      }
      used.add(base)
      files.push(new File([image], `${base}.png`, { type: 'image/png' }))
      trackCount += 1
    }
    if (trackCount) parts.push(`곡 ${trackCount}장`)

    if (!files.length) return

    const shareData = { files, title: `${state.rapName}의 커리어` }
    if (navigator.canShare?.(shareData)) {
      try {
        await Promise.race([
          navigator.share(shareData),
          new Promise((_, reject) => setTimeout(() => reject(new Error('share-timeout')), 1500)),
        ])
        setStatus(saveStatus(parts, true))
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    downloadFiles(files)
    setStatus(saveStatus(parts, false))
  }

  const color = state.genre ? GENRE_COLOR[state.genre] : '#1db954'
  const labelText = affiliation(state)
  const chipHead = [state.genre ? GENRE_LABEL[state.genre] : '', origin?.place ?? '', labelText].filter(Boolean).join('  ·  ')
  const chipTail = [
    `잔고 ${formatWon(state.money)}`,
    `이름값 ${formatRep(state.reputation)}`,
    smtmCareerLabel(state.smtmBestClears, state.smtmTrashTalk),
  ].filter(Boolean).join('  ·  ')

  return (
    <section>
      <article className="share-card">
        <div className="poster-bar" style={{ background: color }} />
        <div className="poster-body">
          <div className="mark" style={{ color }}>
            한국 래퍼의 삶
          </div>
          <h2>{state.rapName}</h2>
          <div className="arch" style={{ color }}>
            {career.title}
          </div>
          <p className="blurb">{career.blurb}</p>
          <p className="chip-line">
            {chipHead}
            {state.snakeTag ? <span className="snake-mark">뱀새끼</span> : null}
            {chipTail ? `  ·  ${chipTail}` : ''}
          </p>
          <h3 style={{ color }}>커리어</h3>
          {bio.map((line) => (
            <p className="bio-line" key={line}>
              {line}
            </p>
          ))}
          <h3 style={{ color }}>주력</h3>
          {styles.map((row) => (
            <p className="style-line" key={row.phase}>
              <b>{row.name}</b>
              <span style={{ color }}>{GENRE_LABEL[row.genre]}</span>
            </p>
          ))}
          <h3 style={{ color }}>대표 가사</h3>
          {state.tracks.map((track, index) => (
            <div className="line-row" key={track.id} style={{ borderLeftColor: color }}>
              <strong>
                {index + 1} {track.title}
              </strong>
              <span>
                {PHASES[track.phase]?.name} · {GENRE_LABEL[track.genre]} · {track.score}점 · 리드머 {track.rhythmMark.toFixed(1)}/5.0
              </span>
              <em>“{signatureLine(track.lyrics)}”</em>
            </div>
          ))}
          {smtmSeasonCards(state).length > 0 && (
            <>
              <h3 style={{ color }}>쇼미</h3>
              <div className="smtm-cards">
                {smtmSeasonCards(state).map((row) => (
                  <div className="smtm-card" key={row.name} style={{ borderLeftColor: color }}>
                    <b>{row.name}</b>
                    <span>{row.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </article>
      {history.length > 0 && (
        <article className="share-card">
          <div className="poster-bar" style={{ background: color }} />
          <div className="poster-body">
            <div className="mark" style={{ color }}>
              한국 래퍼의 삶
            </div>
            <h2>약력</h2>
            <p className="blurb">{state.rapName}</p>
            <PhaseLogs history={history} color={color} />
          </div>
        </article>
      )}
      <button className="btn btn-wide" style={{ marginTop: 12 }} type="button" onClick={() => void save()}>
        이미지 저장
      </button>
      {status && <p className="note">{status}</p>}
    </section>
  )
}
