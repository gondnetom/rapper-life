let ctx: AudioContext | null = null
const buffers = new Map<string, AudioBuffer>()
const loading = new Map<string, Promise<AudioBuffer | null>>()

function context(): AudioContext | null {
  const AudioCtx = window.AudioContext
  if (!AudioCtx) return null
  if (!ctx) ctx = new AudioCtx()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function load(name: string): Promise<AudioBuffer | null> {
  const pending = loading.get(name)
  if (pending) return pending
  const job = (async () => {
    const audio = context()
    if (!audio) return null
    const response = await fetch(`/sfx/${name}.wav`)
    if (!response.ok) return null
    const data = await response.arrayBuffer()
    const buffer = await audio.decodeAudioData(data)
    buffers.set(name, buffer)
    return buffer
  })().catch(() => null)
  loading.set(name, job)
  return job
}

function play(name: string, gainValue: number) {
  const buffer = buffers.get(name)
  if (!buffer) {
    void load(name).then((ready) => {
      if (ready) play(name, gainValue)
    })
    return
  }
  const audio = context()
  if (!audio) return
  const source = audio.createBufferSource()
  const gain = audio.createGain()
  source.buffer = buffer
  gain.gain.value = gainValue
  source.connect(gain)
  gain.connect(audio.destination)
  source.start()
}

void load('click')
void load('notice')

export function playClick() {
  play('click', 0.55)
}

export function playNotice() {
  play('notice', 0.42)
}
