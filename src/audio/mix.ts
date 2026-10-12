import { beatById } from './beats'
import { loadTake } from './takes'
import type { Genre } from '../game/types'

function wavBlob(buffer: AudioBuffer): Blob {
  const channels = Math.min(2, buffer.numberOfChannels)
  const rate = buffer.sampleRate
  const frames = buffer.length
  const dataSize = frames * channels * 2
  const out = new ArrayBuffer(44 + dataSize)
  const view = new DataView(out)
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i))
  }
  write(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channels, true)
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * channels * 2, true)
  view.setUint16(32, channels * 2, true)
  view.setUint16(34, 16, true)
  write(36, 'data')
  view.setUint32(40, dataSize, true)
  const inputs = Array.from({ length: channels }, (_, index) => buffer.getChannelData(index))
  let offset = 44
  for (let frame = 0; frame < frames; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, inputs[channel][frame] || 0))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += 2
    }
  }
  return new Blob([out], { type: 'audio/wav' })
}

export async function mixRelease(genre: Genre, audioId: string | null, beatId: string | null): Promise<Blob | null> {
  if (!audioId) return null
  const vocalBlob = await loadTake(audioId)
  if (!vocalBlob || !vocalBlob.size) return null
  const ctx = new AudioContext()
  try {
    const beatBytes = await fetch(beatById(beatId, genre).src).then((res) => res.arrayBuffer())
    const vocalBytes = await vocalBlob.arrayBuffer()
    const [beatBuf, vocalBuf] = await Promise.all([ctx.decodeAudioData(beatBytes), ctx.decodeAudioData(vocalBytes.slice(0))])
    const duration = Math.min(Math.max(vocalBuf.duration, 0.4), 180)
    const offline = new OfflineAudioContext(2, Math.ceil(duration * 44100), 44100)
    const beat = offline.createBufferSource()
    beat.buffer = beatBuf
    beat.loop = true
    const beatGain = offline.createGain()
    beatGain.gain.value = 0.85
    beat.connect(beatGain).connect(offline.destination)
    beat.start(0)
    const voice = offline.createBufferSource()
    voice.buffer = vocalBuf
    voice.connect(offline.destination)
    voice.start(0)
    return wavBlob(await offline.startRendering())
  } finally {
    await ctx.close()
  }
}
