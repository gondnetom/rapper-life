import { beatById, type BeatTrack } from './beats'
import { claimPlayback } from './session'
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
  drill: {
    bpm: 142,
    swing: 0,
    kick: [0, 3, 8, 10],
    snare: [4, 12],
    hat: [0, 2, 3, 6, 8, 10, 11, 14],
    bass: [0, 8, 10],
    bassFreq: 38,
    bassDur: 0.4,
    rage: false,
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
  private fileMode: 'pending' | 'file' | 'synth' = 'pending'
  private fileToken = 0
  private synthLive = false
  private spec: BeatTrack | null = null

  setBeat(spec: BeatTrack) {
    const changed = this.spec?.id !== spec.id
    this.spec = spec
    this.genre = spec.genre
    if (this.playing && changed) {
      this.stopFile()
      this.fileMode = 'pending'
      void this.playFile()
    }
  }

  ensure(): AudioContext {
    claimPlayback()
    if (!this.ctx) {
      const ctx = new AudioContext()
      this.ctx = ctx
      const master = ctx.createGain()
      master.gain.value = 0.9
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
    claimPlayback()
    this.markSession('playing')
    const fresh = !this.playing
    this.playing = true
    if (fresh) {
      this.nextTime = performance.now() / 1000 + 0.06
      this.step = 0
      this.pump()
    }
    const live = this.fileMode === 'file' && this.file && !this.file.paused
    if (!live) void this.playFile()
  }

  stop() {
    this.playing = false
    window.clearTimeout(this.timer)
    this.stopFile()
    this.markSession('paused')
  }

  private markSession(state: 'playing' | 'paused') {
    if (!('mediaSession' in navigator)) return
    try {
      if (state === 'playing' && !navigator.mediaSession.metadata) {
        navigator.mediaSession.metadata = new MediaMetadata({ title: '비트', artist: '한국 래퍼의 삶' })
      }
      navigator.mediaSession.playbackState = state
    } catch {
      /* metadata is optional */
    }
  }

  private stopFile() {
    this.fileToken += 1
    if (this.file) {
      this.file.pause()
      this.file.src = ''
      this.file.remove()
      this.file = null
    }
    this.fileMode = 'pending'
  }

  private ctxTime(when: number) {
    const ctx = this.ctx
    if (!ctx) return when
    return ctx.currentTime + (when - performance.now() / 1000)
  }

  private armSynth() {
    const ctx = this.ensure()
    if (this.master && !this.synthLive) {
      this.master.connect(ctx.destination)
      this.synthLive = true
    }
  }

  private fallbackSynth(audio: HTMLAudioElement) {
    if (this.file !== audio) return
    audio.pause()
    audio.remove()
    this.file = null
    if (!this.playing) return
    this.fileMode = 'synth'
    this.armSynth()
  }

  private blocked(error: unknown) {
    return error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'AbortError')
  }

  private async playFile() {
    const token = ++this.fileToken
    const spec = this.spec ?? beatById(null, this.genre)
    const audio = new Audio()
    audio.loop = false
    audio.preload = 'auto'
    audio.setAttribute('playsinline', 'true')
    audio.setAttribute('webkit-playsinline', 'true')
    audio.src = spec.src
    audio.style.position = 'fixed'
    audio.style.width = '0'
    audio.style.height = '0'
    audio.style.opacity = '0'
    audio.style.pointerEvents = 'none'
    document.body.appendChild(audio)
    if (this.file) {
      this.file.pause()
      this.file.src = ''
      this.file.remove()
    }
    this.file = audio
    this.fileMode = 'pending'
    audio.ontimeupdate = () => {
      const cap = audio.duration && audio.duration < 70 ? Math.max(0.2, audio.duration - 0.08) : 58
      if (audio.currentTime >= cap) audio.currentTime = 0
    }
    audio.onerror = () => {
      if (token !== this.fileToken) return
      this.fallbackSynth(audio)
    }
    try {
      await audio.play()
    } catch (error) {
      if (token !== this.fileToken) return
      if (this.blocked(error)) return
      this.fallbackSynth(audio)
      return
    }
    if (token !== this.fileToken || !this.playing || this.file !== audio) {
      audio.pause()
      audio.remove()
      if (this.file === audio) this.file = null
      return
    }
    this.fileMode = 'file'
  }

  private pump = () => {
    if (!this.playing) return
    const now = performance.now() / 1000
    const pattern = PATTERNS[this.genre]
    const stepDur = 60 / (this.spec?.bpm ?? pattern.bpm) / 4
    if (this.nextTime < now) this.nextTime = now + 0.02
    while (this.nextTime < now + 0.14) {
      const step16 = this.step % 16
      const swing = step16 % 2 === 1 ? pattern.swing : 0
      const time = this.nextTime + swing
      if (this.fileMode === 'synth') this.playStep(this.ctxTime(time), step16, pattern)
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
