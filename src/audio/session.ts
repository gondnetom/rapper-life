export function claimPlayback() {
  const nav = navigator as Navigator & { audioSession?: { type: string } }
  try {
    if (nav.audioSession && nav.audioSession.type !== 'playback') nav.audioSession.type = 'playback'
  } catch {
    /* older browsers reject the assignment */
  }
}
