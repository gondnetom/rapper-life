import type { Genre } from '../game/types'
import { beatById } from './beats'
import { openDb } from './db'

const STORE = 'takes'

export async function saveTake(id: string, blob: Blob): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function loadTake(id: string): Promise<Blob | null> {
  const db = await openDb()
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null)
    req.onerror = () => reject(req.error)
  })
  db.close()
  return blob
}

let beat: HTMLAudioElement | null = null
let vocal: HTMLAudioElement | null = null
let vocalUrl: string | null = null

export function stopTake() {
  beat?.pause()
  vocal?.pause()
  if (vocalUrl) URL.revokeObjectURL(vocalUrl)
  beat = null
  vocal = null
  vocalUrl = null
}

export async function playTake(genre: Genre, audioId: string | null, beatId?: string | null): Promise<'full' | 'beat'> {
  stopTake()
  const audio = new Audio(beatById(beatId, genre).src)
  audio.loop = false
  audio.volume = 0.85
  audio.ontimeupdate = () => {
    const cap = audio.duration && audio.duration < 70 ? Math.max(0.2, audio.duration - 0.08) : 58
    if (audio.currentTime >= cap) audio.currentTime = 0
  }
  beat = audio
  await audio.play()
  if (!audioId) return 'beat'
  const blob = await loadTake(audioId)
  if (!blob) return 'beat'
  vocalUrl = URL.createObjectURL(blob)
  const voice = new Audio(vocalUrl)
  voice.volume = 1
  vocal = voice
  await voice.play()
  return 'full'
}
