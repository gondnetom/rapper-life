import { beatById, type BeatTrack } from './beats'
import type { Genre } from '../game/types'

interface Pattern {
  bpm: number
  swing: number
  kick: number[]
  snare: number[]
  hat: number[]
  bass: number[]
  bassFreq: number
  bassDur: number
  rage: boolean
}

const PATTERNS: Record<Genre, Pattern> = {
  boomBap: {
    bpm: 92,
    swing: 0.018,
    kick: [0, 8, 11],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 8, 10, 12, 14],
    bass: [0, 8],
    bassFreq: 55,
    bassDur: 0.28,
    rage: false,
  },
  trap: {
    bpm: 140,
    swing: 0,
    kick: [0, 10],
    snare: [4, 12],
    hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    bass: [0, 10],
    bassFreq: 42,
    bassDur: 0.46,
    rage: false,
  },
  mumble: {
    bpm: 100,
    swing: 0,
    kick: [0, 10],
    snare: [8],
    hat: [2, 6, 10, 14],
    bass: [0],
    bassFreq: 36,
    bassDur: 0.7,
    rage: false,
  },
  rage: {
    bpm: 148,
    swing: 0,
    kick: [0, 3, 8, 11],
    snare: [4, 12],
    hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    bass: [0, 3, 8],
    bassFreq: 46,
    bassDur: 0.22,
    rage: true,
  },
}

export class BeatEngine {
  genre: Genre = 'boomBap'
  accents: number[] = []
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noise: AudioBuffer | null = null
  private curve: Float32Array<ArrayBuffer> | null = null
  private timer = 0
  private nextTime = 0
  private step = 0
  private playing = false
  private file: HTMLAudioElement | null = null
  private fileSource: MediaElementAudioSourceNode | null = null
  private usingFile = false
  private spec: BeatTrack | null = null

  setBeat(spec: BeatTrack) {
    const changed = this.spec?.id !== spec.id
    this.spec = spec
    this.genre = spec.genre
    if (this.playing && changed) {
      this.stopFile()
      void this.playFile()
    }
  }

  ensure(): AudioContext {
    if (!this.ctx) {
      const ctx = new AudioContext()
      this.ctx = ctx
      const master = ctx.createGain()
      master.gain.value = 0.55
      master.connect(ctx.destination)
      this.master = master
      const length = ctx.sampleRate
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
      this.noise = buffer
      const curve = new Float32Array(new ArrayBuffer(256 * 4))
      for (let i = 0; i < 256; i += 1) {
        const x = (i / 255) * 2 - 1
        curve[i] = Math.tanh(x * 5)
      }
      this.curve = curve
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  get playingNow() {
    return this.playing
  }

  start() {
    const ctx = this.ensure()
    if (this.playing) return
    this.playing = true
    this.nextTime = ctx.currentTime + 0.06
    this.step = 0
    void this.playFile()
    this.pump()
  }

  stop() {
    this.playing = false
    window.clearTimeout(this.timer)
    this.stopFile()
  }

  private stopFile() {
    if (this.file) {
      this.file.pause()
      this.file.src = ''
      this.file = null
    }
    this.fileSource?.disconnect()
    this.fileSource = null
    this.usingFile = false
    if (this.master) this.master.gain.value = 0.55
  }

  private async playFile() {
    const spec = this.spec ?? beatById(null, this.genre)
    const audio = new Audio(spec.src)
    audio.loop = false
    audio.preload = 'auto'
    this.file = audio
    audio.ontimeupdate = () => {
      const cap = audio.duration && audio.duration < 70 ? Math.max(0.2, audio.duration - 0.08) : 58
      if (audio.currentTime >= cap) audio.currentTime = 0
    }
    try {
      await audio.play()
    } catch {
      if (this.file === audio) this.file = null
      return
    }
    if (!this.playing || this.file !== audio || !this.ctx || !this.master) {
      audio.pause()
      return
    }
    const source = this.ctx.createMediaElementSource(audio)
    source.connect(this.master)
    this.fileSource = source
    this.usingFile = true
    this.master.gain.value = 0.9
  }

  private pump = () => {
    if (!this.playing || !this.ctx) return
    const pattern = PATTERNS[this.genre]
    const stepDur = 60 / (this.spec?.bpm ?? pattern.bpm) / 4
    while (this.nextTime < this.ctx.currentTime + 0.14) {
      const step16 = this.step % 16
      const swing = step16 % 2 === 1 ? pattern.swing : 0
      const time = this.nextTime + swing
      if (!this.usingFile) this.playStep(time, step16, pattern)
      if (pattern.kick.includes(step16) || pattern.snare.includes(step16)) {
        this.accents.push(time)
        if (this.accents.length > 480) this.accents.splice(0, 240)
      }
      this.nextTime += stepDur
      this.step += 1
    }
    this.timer = window.setTimeout(this.pump, 25)
  }

  private playStep(time: number, step: number, pattern: Pattern) {
    if (pattern.kick.includes(step)) this.kick(time, pattern.rage ? 170 : 140)
    if (pattern.snare.includes(step)) this.noiseBurst(time, 0.16, pattern.rage ? 0.45 : 0.34, 1800, 'highpass')
    if (pattern.hat.includes(step)) this.noiseBurst(time, 0.04, pattern.rage ? 0.16 : 0.11, 7000, 'highpass')
    if (pattern.bass.includes(step)) this.bass(time, pattern.bassFreq, pattern.bassDur, pattern.rage)
  }

  private kick(time: number, freq: number) {
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, time)
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.09)
    gain.gain.setValueAtTime(0.95, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18)
    osc.connect(gain)
    gain.connect(master)
    osc.start(time)
    osc.stop(time + 0.2)
  }

  private bass(time: number, freq: number, dur: number, rage: boolean) {
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, time)
    osc.frequency.exponentialRampToValueAtTime(Math.max(28, freq * 0.55), time + dur)
    gain.gain.setValueAtTime(rage ? 0.55 : 0.62, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur)
    if (rage && this.curve) {
      const shaper = ctx.createWaveShaper()
      shaper.curve = this.curve
      shaper.oversample = '2x'
      osc.connect(shaper)
      shaper.connect(gain)
    } else {
      osc.connect(gain)
    }
    gain.connect(master)
    osc.start(time)
    osc.stop(time + dur + 0.02)
  }

  private noiseBurst(time: number, dur: number, amount: number, freq: number, type: BiquadFilterType) {
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master || !this.noise) return
    const src = ctx.createBufferSource()
    src.buffer = this.noise
    const filter = ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.value = freq
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(amount, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur)
    src.connect(filter)
    filter.connect(gain)
    gain.connect(master)
    src.start(time)
    src.stop(time + dur + 0.02)
  }
}
