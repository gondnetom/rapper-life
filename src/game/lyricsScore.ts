const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']

export function hangulSyllables(text: string): string[] {
  return [...text].filter((ch) => ch >= '가' && ch <= '힣')
}

export function syllableCount(text: string): number {
  return hangulSyllables(text).length
}

export function signatureLine(lyrics: string): string {
  const lines = lyrics
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  if (!lines.length) return ''
  return lines.reduce((best, line) => (syllableCount(line) >= syllableCount(best) ? line : best))
}

export function lastVowel(line: string): string | null {
  const chars = hangulSyllables(line)
  const last = chars[chars.length - 1]
  if (!last) return null
  const code = last.charCodeAt(0) - 0xac00
  const jung = Math.floor((code % 588) / 28)
  return JUNG[jung] ?? null
}

export function scoreLyrics(text: string, target: number, lyricStat: number): number {
  const lines = text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (!lines.length) return 0

  const countScore = Math.max(0, 1 - Math.abs(lines.length - target) / target) * 25
  const counts = lines.map(syllableCount)
  const good = counts.filter((count) => count >= 8 && count <= 18).length / counts.length
  const mean = counts.reduce((sum, count) => sum + count, 0) / counts.length
  const variance = counts.reduce((sum, count) => sum + (count - mean) ** 2, 0) / counts.length
  const consistency = Math.max(0, 1 - variance / 36)
  const syllableScore = (good * 0.65 + consistency * 0.35) * 25

  const vowels = lines.map(lastVowel).filter((vowel): vowel is string => Boolean(vowel))
  let rhymeHits = 0
  for (let i = 1; i < vowels.length; i += 1) {
    if (vowels[i] === vowels[i - 1]) rhymeHits += 1
  }
  const rhymeWeight = mean < 6 ? 12 : 30
  const rhymeScore = (vowels.length > 1 ? rhymeHits / (vowels.length - 1) : 0) * rhymeWeight

  const words = lines.join(' ').split(/\s+/).filter(Boolean)
  const unique = new Set(words).size
  const diversity = words.length ? unique / words.length : 0
  let diversityScore = diversity < 0.55 ? 20 * (diversity / 0.55) : 20
  if (words.length < target * 2) diversityScore *= 0.75

  const raw = countScore + syllableScore + rhymeScore + diversityScore + lyricStat * 0.1
  return Math.max(0, Math.min(100, raw))
}
