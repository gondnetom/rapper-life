import { createContext, useContext } from 'react'
import type { BeatEngine } from './beatEngine'

export const EngineContext = createContext<BeatEngine | null>(null)

export function useEngine() {
  return useContext(EngineContext)
}
