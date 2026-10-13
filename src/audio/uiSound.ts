import { claimPlayback } from './session'

function play(name: string, volume: number) {
  claimPlayback()
  const audio = new Audio(`${import.meta.env.BASE_URL}sfx/${name}.wav`)
  audio.preload = 'auto'
  audio.volume = volume
  void audio.play().catch(() => {})
}

export function playClick() {
  play('click', 0.55)
}

export function playNotice() {
  play('notice', 0.42)
}
