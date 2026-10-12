export interface CritiqueInput {
  rapName: string
  genre: string
  lyrics: string
  score: number
}

export async function requestCritique(input: CritiqueInput): Promise<string | null> {
  const key = import.meta.env.VITE_AI_API_KEY?.trim()
  if (!key || !input.lyrics.trim()) return null
  return null
}
