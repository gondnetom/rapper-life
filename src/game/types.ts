export type Genre = 'boomBap' | 'trap' | 'rage' | 'drill'

export type Screen =
  | 'name'
  | 'origin'
  | 'story'
  | 'train'
  | 'write'
  | 'stage'
  | 'reaction'
  | 'labelPick'
  | 'labelFuture'
  | 'smtmOffer'
  | 'smtmWrite'
  | 'smtmStage'
  | 'smtmTeam'
  | 'smtmYoutube'
  | 'retire'

export type Tab = 'now' | 'album' | 'log'

export type StatKey = 'lyric' | 'compose' | 'flow' | 'club' | 'pr'

export type TrainId = 'lyric' | 'compose' | 'club' | 'battle' | 'insta' | 'throat' | 'tonic'

export interface Stats {
  lyric: number
  compose: number
  flow: number
  club: number
  pr: number
}

export interface Track {
  id: string
  phase: number
  title: string
  lyrics: string
  genre: Genre
  score: number
  writingScore: number
  performScore: number
  hipgal: string[]
  rhythm: string[]
  rhythmMark: number
  audioId: string | null
  beatId: string | null
  coverId: string | null
  money: number
  shift: 'boom' | 'bust' | null
  source?: 'release' | 'smtm'
}

export interface SmtmSeason {
  phase: number
  label: string
}

export interface TimelineItem {
  id: string
  phase: number
  title: string
  detail: string
}

export interface Snapshot {
  phase: number
  money: number
  reputation: number
  stats: Stats
  genre: Genre | null
}

export interface YoutubeResult {
  roundIndex: number
  roundName: string
  views: number
  likes: number
  comments: string[]
  passed: boolean
  gig: number
  ripple: number
  prize: number
  score: number
  judgement: number
  rivalScore: number | null
  rivalName: string | null
  producer: string
  producerLine: string
  seasonEarned: number
  nepotism: boolean
}

export interface SmtmRoundRecord {
  phase: number
  result: YoutubeResult
}

export interface PendingShift {
  from: Genre
  to: Genre
  outcome: 'boom' | 'bust'
  magnitude: number
}

export type ModalKind = 'label' | 'feature' | 'diss' | 'shift' | 'snake'

export interface ModalEvent {
  id: string
  kind: ModalKind
  title: string
  body: string
  rep: number
  money: number
  labelName?: string
  rivalName?: string
}

export interface PerformResult {
  micMissing: boolean
  recognitionFailed: boolean
  transcript: string
  overlap: number
  timing: number
  energy: number
  score: number
  blob: Blob | null
}

export interface GameState {
  rapName: string
  originId: string | null
  originStory: string
  genre: Genre | null
  phase: number
  screen: Screen
  tab: Tab
  stats: Stats
  money: number
  reputation: number
  actionsLeft: number
  signedLabel: boolean
  ownLabel: boolean
  labelName: string | null
  buzz: number
  phaseEventFired: boolean
  shiftUsed: boolean
  pendingShift: PendingShift | null
  smtmTrashTalk: boolean
  smtmAppeared: boolean
  snakeTag: boolean
  nepotismTag: boolean
  tonicEnd: boolean
  smtmBestClears: number
  smtmWins: number
  smtmClearsThisSeason: number
  tracks: Track[]
  timeline: TimelineItem[]
  history: Snapshot[]
  rivalName: string
  draftTitle: string
  draftLyrics: string
  draftCoverId: string | null
  smtmRound: number
  smtmEarned: number
  smtmTeam: string | null
  smtmOpponent: string | null
  lastRelease: Track | null
  lastRepDelta: number
  lastPerformNote: string
  lastYoutube: YoutubeResult | null
  smtmLog: SmtmRoundRecord[]
  smtmSeasons: SmtmSeason[]
  modal: ModalEvent | null
  notice: string | null
  noticeTick: number
  beatOn: boolean
  beatId: string | null
  usedBeats: string[]
}
