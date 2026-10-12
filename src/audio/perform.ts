import { clamp } from '../game/format'
import type { PerformResult } from '../game/types'

interface RecEvent {
  results: ArrayLike<{ 0: { transcript: string } }>
}

interface RecInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((ev: RecEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

function getRecognizer(): (new () => RecInstance) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => RecInstance
    webkitSpeechRecognition?: new () => RecInstance
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

function syllables(text: string): string[] {
  return [...text].filter((ch) => ch >= '가' && ch <= '힣')
}

function overlapScore(lyrics: string, transcript: string): number {
  const a = syllables(lyrics)
  const b = syllables(transcript)
  if (!a.length || !b.length) return 0
  const bag = new Map<string, number>()
  for (const syl of a) bag.set(syl, (bag.get(syl) ?? 0) + 1)
  let inter = 0
  for (const syl of b) {
    const count = bag.get(syl) ?? 0
    if (count > 0) {
      inter += 1
      bag.set(syl, count - 1)
    }
  }
  return (2 * inter) / (a.length + b.length) * 100
}

function empty(partial: Partial<PerformResult> = {}): PerformResult {
  return {
    micMissing: false,
    recognitionFailed: false,
    transcript: '',
    overlap: 0,
    timing: 0,
    energy: 0,
    score: 0,
    blob: null,
    ...partial,
  }
}

export function startRecording(opts: {
  lyrics: string
  flow: number
  club: number
  getAccents: () => number[]
  audioContext: AudioContext
  onTick: (info: { elapsed: number; level: number }) => void
}): { stop: () => void; done: Promise<PerformResult> } {
  let stopRequested = false
  let stopImpl = () => {
    stopRequested = true
  }
  const done = new Promise<PerformResult>((resolve) => {
    let settled = false
    const finish = (result: PerformResult) => {
      if (settled) return
      settled = true
      resolve(result)
    }

    void (async () => {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        })
      } catch {
        finish(empty({ micMissing: true }))
        return
      }

      const ctx = opts.audioContext
      if (ctx.state === 'suspended') await ctx.resume()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      source.connect(analyser)
      const samples = new Uint8Array(analyser.fftSize)

      let recorder: MediaRecorder | null = null
      const chunks: Blob[] = []
      try {
        const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : undefined
        recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
        recorder.ondataavailable = (event) => {
          if (event.data.size) chunks.push(event.data)
        }
        recorder.start()
      } catch {
        recorder = null
      }

      const startedAt = performance.now()
      const startAudio = ctx.currentTime
      const peaks: number[] = []
      const levels: number[] = []
      let hot = false
      let lastPeak = 0
      let frame = 0
      let alive = true
      let transcript = ''
      let recognitionFailed = false
      const Ctor = getRecognizer()
      let rec: RecInstance | null = null
      if (!Ctor) recognitionFailed = true
      else {
        rec = new Ctor()
        rec.lang = 'ko-KR'
        rec.continuous = true
        rec.interimResults = true
        rec.onresult = (ev) => {
          let text = ''
          for (let i = 0; i < ev.results.length; i += 1) text += `${ev.results[i][0].transcript} `
          transcript = text.trim()
        }
        rec.onerror = () => {
          recognitionFailed = true
        }
        rec.onend = () => {
          if (!alive) return
          try {
            rec?.start()
          } catch {
            recognitionFailed = true
          }
        }
        try {
          rec.start()
        } catch {
          recognitionFailed = true
        }
      }

      const tick = () => {
        if (!alive) return
        analyser.getByteTimeDomainData(samples)
        let sum = 0
        for (let i = 0; i < samples.length; i += 1) {
          const x = (samples[i] - 128) / 128
          sum += x * x
        }
        const rms = Math.sqrt(sum / samples.length)
        levels.push(rms)
        const now = ctx.currentTime
        if (rms > 0.08 && !hot && now - lastPeak > 0.08) {
          peaks.push(now)
          lastPeak = now
          hot = true
        }
        if (rms < 0.05) hot = false
        opts.onTick({ elapsed: performance.now() - startedAt, level: rms })
        frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)

      const close = () => {
        if (!alive) return
        alive = false
        cancelAnimationFrame(frame)
        try {
          rec?.abort()
        } catch {
          /* already stopped */
        }
        const endAudio = ctx.currentTime
        const accents = opts.getAccents().filter((time) => time >= startAudio && time <= endAudio)
        const windowSec = Math.min(0.18, 0.07 + opts.flow * 0.0011)
        let hits = 0
        for (const accent of accents) {
          if (peaks.some((peak) => Math.abs(peak - accent) <= windowSec)) hits += 1
        }
        const timing = accents.length ? (hits / accents.length) * 100 : 35
        const avg = levels.length ? levels.reduce((sum, level) => sum + level, 0) / levels.length : 0
        let energy = 12
        if (avg < 0.015) energy = 12
        else if (avg < 0.04) energy = 42
        else if (avg < 0.22) energy = 72 + Math.min(28, (avg - 0.04) * 140)
        else energy = opts.club >= 55 ? 78 : 48
        energy = clamp(energy + Math.max(0, opts.club - 40) * 0.18, 0, 100)

        const overlap = overlapScore(opts.lyrics, transcript)
        const heard = Boolean(transcript) && !recognitionFailed
        const score = heard ? overlap * 0.5 + timing * 0.3 + energy * 0.2 : timing * 0.62 + energy * 0.38
        void (async () => {
          const blob = await new Promise<Blob | null>((resolve) => {
            if (!recorder || recorder.state === 'inactive') {
              resolve(chunks.length ? new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' }) : null)
              return
            }
            recorder.onstop = () => {
              resolve(chunks.length ? new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }) : null)
            }
            try {
              recorder.requestData()
            } catch {
              /* some browsers flush on stop */
            }
            recorder.stop()
          })
          stream.getTracks().forEach((track) => track.stop())
          source.disconnect()
          finish(
            empty({
              recognitionFailed: !heard,
              transcript,
              overlap,
              timing,
              blob,
              energy,
              score: clamp(score, 0, 100),
            }),
          )
        })()
      }

      stopImpl = close
      if (stopRequested) close()
    })()
  })

  return {
    stop: () => stopImpl(),
    done,
  }
}
