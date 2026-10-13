export function paintSmtmCover(opts: { rapName: string; title: string }): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1080
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = '#070707'
  ctx.fillRect(0, 0, 1080, 1080)

  const glow = ctx.createRadialGradient(540, 430, 30, 540, 500, 640)
  glow.addColorStop(0, 'rgba(245, 197, 24, 0.38)')
  glow.addColorStop(0.45, 'rgba(180, 110, 10, 0.16)')
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, 1080, 1080)

  ctx.fillStyle = '#f5c518'
  ctx.fillRect(0, 0, 1080, 16)
  ctx.fillRect(0, 1064, 1080, 16)
  ctx.fillRect(0, 0, 16, 1080)
  ctx.fillRect(1064, 0, 16, 1080)

  ctx.strokeStyle = 'rgba(245, 197, 24, 0.35)'
  ctx.lineWidth = 2
  ctx.strokeRect(48, 48, 984, 984)

  ctx.fillStyle = '#f5c518'
  ctx.font = '800 28px Pretendard, Malgun Gothic, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('S H O W  M E  T H E  M O N E Y', 540, 130)

  ctx.fillStyle = '#ffffff'
  ctx.font = '800 44px Pretendard, Malgun Gothic, sans-serif'
  ctx.fillText('쇼미더머니', 540, 188)

  drawMic(ctx, 540, 500)

  ctx.fillStyle = '#f5c518'
  ctx.font = '800 56px Pretendard, Malgun Gothic, sans-serif'
  wrapCentered(ctx, opts.title, 540, 820, 860, 62)

  ctx.fillStyle = '#d8d8d8'
  ctx.font = '700 32px Pretendard, Malgun Gothic, sans-serif'
  ctx.fillText(opts.rapName, 540, 980)

  return canvas
}

export async function smtmCoverBlob(opts: { rapName: string; title: string }): Promise<Blob | null> {
  const canvas = paintSmtmCover(opts)
  if (!canvas) return null
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'))
}

function wrapCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  max: number,
  lineHeight: number,
) {
  const chars = [...text]
  const lines: string[] = []
  let line = ''
  for (const ch of chars) {
    const next = line + ch
    if (ctx.measureText(next).width > max && line) {
      lines.push(line)
      line = ch
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  const start = y - ((lines.length - 1) * lineHeight) / 2
  lines.forEach((part, index) => ctx.fillText(part, x, start + index * lineHeight))
}

function drawMic(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save()
  ctx.strokeStyle = '#f5c518'
  ctx.fillStyle = '#f5c518'
  ctx.lineWidth = 16
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.beginPath()
  ctx.roundRect(x - 78, y - 210, 156, 250, 78)
  ctx.stroke()

  ctx.lineWidth = 7
  for (let i = -70; i <= 50; i += 24) {
    ctx.beginPath()
    ctx.moveTo(x - 52, y - 40 + i)
    ctx.lineTo(x + 52, y - 40 + i)
    ctx.stroke()
  }

  ctx.lineWidth = 18
  ctx.beginPath()
  ctx.arc(x, y + 20, 92, 0.15 * Math.PI, 0.85 * Math.PI)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x, y + 112)
  ctx.lineTo(x, y + 188)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x - 92, y + 188)
  ctx.lineTo(x + 92, y + 188)
  ctx.stroke()
  ctx.restore()
}
