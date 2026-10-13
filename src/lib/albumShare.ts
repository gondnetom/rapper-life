import { loadCover } from '../audio/covers'
import { GENRE_LABEL } from '../game/content'
import { signatureLine } from '../game/lyricsScore'
import type { Genre, Track } from '../game/types'

const GENRE_COLOR: Record<Genre, string> = {
  boomBap: '#c4a574',
  trap: '#1db954',
  mumble: '#8d7cff',
  rage: '#ff4d4d',
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lineHeight: number, limit = Infinity) {
  let line = ''
  let cursor = y
  let used = 0
  for (const ch of text) {
    const next = line + ch
    if (ctx.measureText(next).width > max && line) {
      ctx.fillText(line, x, cursor)
      used += 1
      if (used >= limit) return cursor + lineHeight
      line = ch
      cursor += lineHeight
    } else {
      line = next
    }
  }
  if (line) ctx.fillText(line, x, cursor)
  return cursor + lineHeight
}

function wrapBlock(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lineHeight: number) {
  let cursor = y
  for (const part of text.replace(/\r\n/g, '\n').split('\n')) {
    if (!part.trim()) {
      cursor += Math.round(lineHeight * 0.55)
      continue
    }
    cursor = wrap(ctx, part.trim(), x, cursor, max, lineHeight)
  }
  return cursor
}

async function drawCover(ctx: CanvasRenderingContext2D, cover: Blob | null, color: string) {
  if (!cover) {
    const paint = ctx.createLinearGradient(0, 0, 1080, 1080)
    paint.addColorStop(0, color)
    paint.addColorStop(1, '#141414')
    ctx.fillStyle = paint
    ctx.fillRect(0, 0, 1080, 1080)
    return
  }
  const bitmap = await createImageBitmap(cover)
  const scale = Math.max(1080 / bitmap.width, 1080 / bitmap.height)
  const width = bitmap.width * scale
  const height = bitmap.height * scale
  ctx.drawImage(bitmap, (1080 - width) / 2, (1080 - height) / 2, width, height)
  bitmap.close()
}

export async function paintAlbumCard(opts: {
  rapName: string
  title: string
  genre: Genre
  score: number
  rhythmMark: number
  lyrics: string
  cover: Blob | null
}): Promise<Blob | null> {
  const scratch = document.createElement('canvas')
  scratch.width = 1080
  scratch.height = 6400
  const ctx = scratch.getContext('2d')
  if (!ctx) return null
  const color = GENRE_COLOR[opts.genre]
  ctx.fillStyle = '#101010'
  ctx.fillRect(0, 0, 1080, scratch.height)
  await drawCover(ctx, opts.cover, color)
  const shade = ctx.createLinearGradient(0, 860, 0, 1080)
  shade.addColorStop(0, 'rgba(16,16,16,0)')
  shade.addColorStop(1, 'rgba(16,16,16,1)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 860, 1080, 220)

  ctx.fillStyle = '#ffffff'
  ctx.font = '800 64px Pretendard, Malgun Gothic, sans-serif'
  let y = wrap(ctx, opts.title, 72, 1160, 936, 76, 2)

  const quote = signatureLine(opts.lyrics)
  const full = opts.lyrics.replace(/\r\n/g, '\n').trim()
  ctx.fillStyle = '#d7d7d7'
  ctx.font = '500 34px Pretendard, Malgun Gothic, sans-serif'
  if (quote) y = wrap(ctx, `“${quote}”`, 72, y + 18, 936, 48, 2)
  if (full && full !== quote) {
    ctx.fillStyle = '#8d8d8d'
    ctx.font = '700 22px Pretendard, Malgun Gothic, sans-serif'
    ctx.fillText('가사', 72, y + 28)
    ctx.fillStyle = '#c8c8c8'
    ctx.font = '400 28px Pretendard, Malgun Gothic, sans-serif'
    y = wrapBlock(ctx, full, 72, y + 64, 936, 42)
  }

  y += 36
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 88px Pretendard, Malgun Gothic, sans-serif'
  const score = String(opts.score)
  ctx.fillText(score, 72, y + 72)
  const scoreWidth = ctx.measureText(score).width
  ctx.fillStyle = '#8d8d8d'
  ctx.font = '600 32px Pretendard, Malgun Gothic, sans-serif'
  ctx.fillText('/100', 72 + scoreWidth + 16, y + 72)
  ctx.fillStyle = color
  ctx.font = '800 32px Pretendard, Malgun Gothic, sans-serif'
  const rhythm = `리드머 ${opts.rhythmMark.toFixed(1)}/5.0`
  ctx.fillText(rhythm, 1008 - ctx.measureText(rhythm).width, y + 72)

  ctx.fillStyle = '#9a9a9a'
  ctx.font = '500 28px Pretendard, Malgun Gothic, sans-serif'
  ctx.fillText(`${opts.rapName} · ${GENRE_LABEL[opts.genre]}`, 72, y + 132)

  const height = Math.max(1560, y + 180)
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = height
  const out = canvas.getContext('2d')
  if (!out) return null
  out.drawImage(scratch, 0, 0, 1080, height, 0, 0, 1080, height)
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'))
}

function fileBase(rapName: string, title: string) {
  const raw = `${rapName}-${title}`.replace(/[\\/:*?"<>|]/g, '').trim()
  return raw.slice(0, 60) || 'album'
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

export async function shareAlbum(track: Track, rapName: string): Promise<string> {
  await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1200))])
  const cover = track.coverId ? await loadCover(track.coverId) : null
  const image = await paintAlbumCard({
    rapName,
    title: track.title,
    genre: track.genre,
    score: track.score,
    rhythmMark: track.rhythmMark,
    lyrics: track.lyrics,
    cover,
  })
  if (!image) return '이미지 제작에 실패했다.'
  const base = fileBase(rapName, track.title)
  const imageFile = new File([image], `${base}.png`, { type: 'image/png' })
  const payload = { files: [imageFile], title: `${rapName} - ${track.title}`, text: signatureLine(track.lyrics) }
  if (navigator.canShare?.(payload)) {
    try {
      await navigator.share(payload)
      return '공유 창이 열렸다.'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return ''
    }
  }
  download(image, imageFile.name)
  return '커버를 저장했다.'
}
