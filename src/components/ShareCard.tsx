import { useState } from 'react'
import { describeCareer, smtmCareerLabel } from '../game/archetype'
import { GENRE_LABEL, ORIGINS, PHASES, BRIEF_ACTIONS, groupTimeline } from '../game/content'
import { formatRep, formatWon, statLabel, topStat } from '../game/format'
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

function biography(state: GameState): string[] {
  const origin = ORIGINS.find((item) => item.id === state.originId)
  const lines: string[] = []
  if (state.originStory.trim()) lines.push(state.originStory.trim())
  else if (origin && state.genre) {
    lines.push(`${origin.place} 출신. ${origin.entry}. 본캐는 ${GENRE_LABEL[origin.genre]}.`)
  }
  if (state.ownLabel) lines.push(`${state.labelName ?? '자기 레이블'} 간판을 직접 차림.`)
  else if (state.signedLabel) lines.push(`${state.labelName ?? '레이블'} 소속.`)
  else lines.push('소속 없이 인디.')
  lines.push(
    `쇼미는 ${smtmCareerLabel(state.smtmBestClears, state.smtmTrashTalk)}. 통장 ${formatWon(state.money)}, 이름값 ${formatRep(state.reputation)}. 대표 스탯은 ${statLabel(topStat(state.stats))}.`,
  )
  if (state.snakeTag) lines.push('과거 발언이 말머리에 남음.')
  return lines
}

function paint(state: GameState) {
  const career = describeCareer(state)
  const origin = ORIGINS.find((item) => item.id === state.originId)
  const history = careerGroups(state)
  const styles = phaseStyles(state)
  const fullRows = history.reduce((sum, group) => sum + group.items.filter((item) => !BRIEF_ACTIONS.has(item.title)).length, 0)
  const briefRows = history.filter((group) => group.items.some((item) => BRIEF_ACTIONS.has(item.title))).length
  const footerReserve = 132
  const height = Math.min(
    4200,
    Math.max(1680, 820 + footerReserve + styles.length * 48 + history.length * 52 + briefRows * 56 + fullRows * 78 + state.tracks.length * 210),
  )
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const color = state.genre ? GENRE_COLOR[state.genre] : '#1db954'
  ctx.fillStyle = '#101010'
  ctx.fillRect(0, 0, 1080, height)
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
    state.ownLabel ? '사장' : state.signedLabel ? (state.labelName ?? '레이블') : '인디',
    formatWon(state.money),
    `이름값 ${formatRep(state.reputation)}`,
    smtmCareerLabel(state.smtmBestClears, state.smtmTrashTalk),
    state.snakeTag ? '뱀새끼' : '',
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
  ctx.fillText('본캐', 72, y + 28)
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
  ctx.fillText('킬링벌스', 72, y + 28)
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
      `${PHASES[track.phase]?.name ?? ''} · ${GENRE_LABEL[track.genre]} · ${track.score}점 · 리드머 ${track.rhythmMark.toFixed(1)}/5`,
      104,
      y + 78,
    )
    ctx.fillStyle = '#ffffff'
    ctx.font = '500 26px Pretendard, Malgun Gothic, sans-serif'
    ctx.fillText(quote ? `“${quote.length > 28 ? `${quote.slice(0, 28)}…` : quote}”` : '', 104, y + 118)
    y += 166
  })

  for (const group of history) {
    ctx.fillStyle = color
    ctx.font = '800 30px Pretendard, Malgun Gothic, sans-serif'
    ctx.fillText(group.name, 72, y + 28)
    y += 48
    const brief = group.items.filter((item) => BRIEF_ACTIONS.has(item.title))
    const full = group.items.filter((item) => !BRIEF_ACTIONS.has(item.title))
    if (brief.length) {
      ctx.fillStyle = '#d7d7d7'
      ctx.font = '500 26px Pretendard, Malgun Gothic, sans-serif'
      y = wrap(ctx, brief.map((item) => item.title).join(' · '), 96, y + 8, 900, 40)
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

  ctx.fillStyle = '#666'
  ctx.font = '400 24px Pretendard, Malgun Gothic, sans-serif'
  ctx.fillText('신입부터 황혼기까지', 72, height - 40)
  return canvas
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
    const canvas = paint(state)
    if (!canvas) return
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((file) => resolve(file), 'image/png'))
    if (!blob) return
    const file = new File([blob], `${state.rapName}-career.png`, { type: 'image/png' })
    const shareData = { files: [file], title: `${state.rapName}의 커리어` }
    if (navigator.canShare?.(shareData)) {
      try {
        await Promise.race([
          navigator.share(shareData),
          new Promise((_, reject) => setTimeout(() => reject(new Error('share-timeout')), 1500)),
        ])
        setStatus('공유 시트 열림.')
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    link.click()
    URL.revokeObjectURL(url)
    setStatus('이미지 저장함.')
  }

  const color = state.genre ? GENRE_COLOR[state.genre] : '#1db954'
  const chips = [
    state.genre ? GENRE_LABEL[state.genre] : '',
    origin?.place ?? '',
    state.ownLabel ? '사장' : state.signedLabel ? (state.labelName ?? '레이블') : '인디',
    formatWon(state.money),
    `이름값 ${formatRep(state.reputation)}`,
    smtmCareerLabel(state.smtmBestClears, state.smtmTrashTalk),
    state.snakeTag ? '뱀새끼' : '',
  ].filter(Boolean)

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
          <p className="chip-line">{chips.join('  ·  ')}</p>
          <h3 style={{ color }}>커리어</h3>
          {bio.map((line) => (
            <p className="bio-line" key={line}>
              {line}
            </p>
          ))}
          <h3 style={{ color }}>본캐</h3>
          {styles.map((row) => (
            <p className="style-line" key={row.phase}>
              <b>{row.name}</b>
              <span style={{ color }}>{GENRE_LABEL[row.genre]}</span>
            </p>
          ))}
          <h3 style={{ color }}>킬링벌스</h3>
          {state.tracks.map((track, index) => (
            <div className="line-row" key={track.id} style={{ borderLeftColor: color }}>
              <strong>
                {index + 1} {track.title}
              </strong>
              <span>
                {PHASES[track.phase]?.name} · {GENRE_LABEL[track.genre]} · {track.score}점 · 리드머 {track.rhythmMark.toFixed(1)}/5
              </span>
              <em>“{signatureLine(track.lyrics)}”</em>
            </div>
          ))}
          {history.map((group) => {
            const brief = group.items.filter((item) => BRIEF_ACTIONS.has(item.title))
            const full = group.items.filter((item) => !BRIEF_ACTIONS.has(item.title))
            return (
              <div className="phase-log" key={`${group.phase}-${group.items[0]?.id}`}>
                <b style={{ color }}>{group.name}</b>
                {brief.length > 0 && <p className="action-brief">{brief.map((item) => item.title).join(' · ')}</p>}
                {full.map((item) => (
                  <div className="action-row" key={item.id}>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </div>
                ))}
              </div>
            )
          })}
          <p className="card-foot">신입부터 황혼기까지</p>
        </div>
      </article>
      <button className="btn btn-wide" style={{ marginTop: 12 }} type="button" onClick={() => void save()}>
        이미지 저장
      </button>
      {status && <p className="note">{status}</p>}
    </section>
  )
}
