import type { Genre } from '../game/types'

export interface BeatTrack {
  id: string
  genre: Genre
  src: string
  bpm: number
  credit: string
}

function asset(file: string): string {
  const base = import.meta.env.BASE_URL
  return `${base}${file.replace(/^\//, '')}`
}

export const BEAT_POOL: BeatTrack[] = [
  { id: 'boom-1', genre: 'boomBap', src: asset('beats/boom-1.mp3'), bpm: 91, credit: 'Boom Bap · Alex Morgan · CC BY 4.0' },
  { id: 'boom-2', genre: 'boomBap', src: asset('beats/boom-2.mp3'), bpm: 85, credit: 'Hip Hop Beats · Alex Morgan · CC BY 4.0' },
  { id: 'boom-3', genre: 'boomBap', src: asset('beats/boom-3.mp3'), bpm: 90, credit: 'Freestyle Beats · Alex Morgan · CC BY 4.0' },
  { id: 'boom-4', genre: 'boomBap', src: asset('beats/boom-4.mp3'), bpm: 92, credit: 'Rap Beat · Alex Morgan · CC BY 4.0' },
  { id: 'trap-1', genre: 'trap', src: asset('beats/trap-1.mp3'), bpm: 144, credit: 'Rolling Hi-Hats · Alex Morgan · CC BY 4.0' },
  { id: 'trap-2', genre: 'trap', src: asset('beats/trap-2.mp3'), bpm: 140, credit: 'Hard Hype Trap · Alex Morgan · CC BY 4.0' },
  { id: 'trap-3', genre: 'trap', src: asset('beats/trap-3.mp3'), bpm: 140, credit: 'Trap Beat · Alex Morgan · CC BY 4.0' },
  { id: 'trap-4', genre: 'trap', src: asset('beats/trap-4.mp3'), bpm: 130, credit: 'Dark Trap · Alex Morgan · CC BY 4.0' },
  { id: 'mumble-1', genre: 'mumble', src: asset('beats/mumble-1.mp3'), bpm: 136, credit: 'Cloud Rap · Alex Morgan · CC BY 4.0' },
  { id: 'mumble-2', genre: 'mumble', src: asset('beats/mumble-2.mp3'), bpm: 140, credit: 'Lazy Trap · Alex Morgan · CC BY 4.0' },
  { id: 'mumble-3', genre: 'mumble', src: asset('beats/mumble-3.mp3'), bpm: 150, credit: 'Warm Keys · Alex Morgan · CC BY 4.0' },
  { id: 'mumble-4', genre: 'mumble', src: asset('beats/mumble-4.mp3'), bpm: 130, credit: 'ITS A TRAP · HoliznaCC0 · CC0' },
  { id: 'rage-1', genre: 'rage', src: asset('beats/rage-1.mp3'), bpm: 133, credit: 'Phonk Music · Alex Morgan · CC BY 4.0' },
  { id: 'rage-2', genre: 'rage', src: asset('beats/rage-2.mp3'), bpm: 130, credit: 'Phonk Songs · Alex Morgan · CC BY 4.0' },
  { id: 'rage-3', genre: 'rage', src: asset('beats/rage-3.mp3'), bpm: 150, credit: 'Phonk ish · HoliznaCC0 · CC0' },
  { id: 'rage-4', genre: 'rage', src: asset('beats/rage-4.mp3'), bpm: 180, credit: 'Phonk Remix · HoliznaCC0 · CC0' },
]

export function beatById(id: string | null | undefined, genre: Genre): BeatTrack {
  const found = BEAT_POOL.find((beat) => beat.id === id)
  if (found) return found
  return BEAT_POOL.find((beat) => beat.genre === genre) ?? BEAT_POOL[0]
}

export function pickBeat(genre: Genre, used: string[]): BeatTrack {
  const pool = BEAT_POOL.filter((beat) => beat.genre === genre)
  const fresh = pool.filter((beat) => !used.includes(beat.id))
  const last = used[used.length - 1]
  const list = fresh.length ? fresh : pool.filter((beat) => beat.id !== last)
  const choice = (list.length ? list : pool)[Math.floor(Math.random() * (list.length || pool.length))]
  return choice
}

export function beatCredit(id: string | null | undefined, genre: Genre): string {
  return beatById(id, genre).credit
}
