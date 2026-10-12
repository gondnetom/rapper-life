import type { Genre, StatKey, Stats, TimelineItem, TrainId } from './types'

export const GENRE_LABEL: Record<Genre, string> = {
  boomBap: '붐뱁',
  trap: '트랩',
  mumble: '멍청트랩',
  rage: '레이지',
}

export const GENRES: Genre[] = ['boomBap', 'trap', 'mumble', 'rage']

export const PHASES = [
  { name: '신입', desc: '닉만 있음. 곡은 아직 데모' },
  { name: '전성기', desc: '본캐가 보이면 음원 타령 들어옴' },
  { name: '황혼기', desc: '노선 마지막. 개추 전에 접는 자리' },
]

export function groupTimeline(items: TimelineItem[]): { phase: number; name: string; items: TimelineItem[] }[] {
  const groups: { phase: number; name: string; items: TimelineItem[] }[] = []
  for (const item of items) {
    const last = groups[groups.length - 1]
    if (!last || last.phase !== item.phase) {
      groups.push({ phase: item.phase, name: PHASES[item.phase]?.name ?? '기록', items: [item] })
    } else {
      last.items.push(item)
    }
  }
  return groups
}

export const DISS_OPPONENTS = [
  { name: '빈지노프', line: '옷깃만 잡힘. 벌스는 매장에 두고 왔냐.' },
  { name: '창모에', line: '훅은 중독인데 닉은 자동완성이 안 됨.' },
  { name: '머쉬베놈스', line: '중얼거림으로 여기까지 왔으면 이제 딕션 보여라.' },
  { name: '키드밀', line: '속도만 빠르고 펀치라인은 택배에 안 탐.' },
  { name: '슈퍼비이', line: '플렉스는 좋은데 오늘 무대는 통장 잔고가 아님.' },
  { name: '식케', line: '영어 라임 하나 던지고 컷할 생각이면 늦음.' },
  { name: '염따임', line: '훅은 시장통인데 벌스는 아직 재고.' },
  { name: '언에듀', line: '분노는 있는데 포켓이 없으면 그냥 소리지.' },
]

export const RIVALS = DISS_OPPONENTS.map((item) => item.name)

export const LABELS = [
  { name: '일리네르', line: '일리네르가 계약서 들고 옴. 사인하면 앨범 정산 오르고, 거절하면 인디 고정.' },
  { name: '저스트튠', line: '저스트튠이 연습실로 찾아옴. 받으면 라이브 자리, 거절하면 인디.' },
  { name: '하이리트', line: '하이리트가 데모에 반응함. 계약은 파급효과, 거절은 본캐 고수.' },
]

export function labelOffers(rep: number): { name: string; line: string; advance: number }[] {
  const table = [
    { name: '일리네르', min: 30, base: 240_000, line: '제일 무거운 계약. 선급 크고 앨범 정산이 따라옴.' },
    { name: '저스트튠', min: 18, base: 140_000, line: '라이브 자리가 먼저 붙음. 선급은 중간.' },
    { name: '하이리트', min: 8, base: 60_000, line: '언더 네임드 밀어줌. 선급은 작고 자리는 생김.' },
  ]
  return table
    .filter((item) => rep >= item.min)
    .map((item) => ({ name: item.name, line: item.line, advance: item.base + rep * 2_000 }))
}

export const PRODUCERS = [
  { id: 'doki', name: '도키', team: '팀 도키', meme: '음원 타령은 나중에. 지금은 스킬부터 까임.' },
  { id: 'swingz', name: '스윙즈', team: '팀 스윙즈', meme: '마이크 놓치면 드랍. 각오 없으면 나가.' },
  { id: 'grayson', name: '그레이슨', team: '팀 그레이슨', meme: '멜로디만 있고 래퍼가 안 보임. 벌스로 개추 받아.' },
  { id: 'codeart', name: '코드아트', team: '팀 코드아트', meme: '비트가 세면 네가 밀림. 오늘은 네가 비트를 밀어.' },
]

export interface Origin {
  id: string
  place: string
  genre: Genre
  entry: string
  stats: Stats
  story: string
}

export const ORIGINS: Origin[] = [
  {
    id: 'hongdae',
    place: '홍대',
    genre: 'boomBap',
    entry: '플라이어보다 CD',
    stats: { lyric: 24, compose: 14, flow: 16, club: 10, pr: 8 },
    story:
      '{name}은 홍대에서 입갤했다. 플라이어보다 형 CD가 먼저였다. 붐뱁이 본캐로 잠겼고, 가사가 저음보다 먼저 들렸다.',
  },
  {
    id: 'gangnam',
    place: '강남',
    genre: 'trap',
    entry: '808이 먼저',
    stats: { lyric: 12, compose: 16, flow: 18, club: 22, pr: 18 },
    story:
      '{name}은 강남 클럽에서 입갤했다. 문장보다 808이 먼저 가슴을 밀었다. 트랩이 본캐로 잠겼고, 계산서보다 저음이 남았다.',
  },
  {
    id: 'sinrim',
    place: '신림',
    genre: 'mumble',
    entry: '원룸 숏폼',
    stats: { lyric: 10, compose: 18, flow: 14, club: 8, pr: 22 },
    story:
      '{name}은 신림 원룸 숏폼으로 입갤했다. 가사는 안 들리고 오토튠만 또렷했다. 멍청트랩은 고른 노선이 아니라 방 크기였다.',
  },
  {
    id: 'incheon',
    place: '인천',
    genre: 'rage',
    entry: '야간 소음',
    stats: { lyric: 14, compose: 12, flow: 22, club: 16, pr: 10 },
    story:
      '{name}은 인천 야간 영상으로 입갤했다. 해외 라이브는 노래가 아니라 소음이었다. 레이지가 본캐로 잠겼다. 힙합은 참는 장르가 아니다.',
  },
]

export const TRAIN_ACTIONS: { id: TrainId; label: string; stat: StatKey; detail: string }[] = [
  { id: 'lyric', label: '라임 연습', stat: 'lyric', detail: '노트에 라임을 채움' },
  { id: 'compose', label: '비트 작업', stat: 'compose', detail: '킥이랑 808을 옮김' },
  { id: 'club', label: '클럽 공연', stat: 'club', detail: '밤에 직접 라이브' },
  { id: 'battle', label: '배틀 구경', stat: 'flow', detail: '포켓을 눈으로 훔침' },
  { id: 'insta', label: '인스타', stat: 'pr', detail: '스토리로 네임드 작업' },
  { id: 'throat', label: '목상태', stat: 'flow', detail: '성대 아끼고 포켓 유지' },
  { id: 'tonic', label: '보약', stat: 'flow', detail: '반반. 되면 스탯 올킬, 실패하면 커리어 삭제' },
]

const INSTA_SUCCESS = [
  '릴스가 알고리즘에 걸림. 언플 상승.',
  '작업실 스토리에 저장 쌓임. 개추각.',
  '댓글창이 닉으로 덮임.',
  '한 소절이 저장보다 먼저 퍼짐.',
]

const INSTA_FAIL = [
  '억지 언플이 캡처돼 돌아옴. 네임드 깎임.',
  '현타 릴스. 힙갤이 비추.',
  '광고 스토리인 거 바로 들킴.',
]

const TRAIN_SUCCESS: Record<TrainId, string> = {
  lyric: '라임 하나 붙음. ㅇㅈ',
  compose: '킥이 자리에 앉음. 비트 상승.',
  club: '클럽 공연 먹힘. 다음 주도 서래.',
  battle: '포켓이 귀에 남음. 스킬 상승.',
  insta: INSTA_SUCCESS[0],
  throat: '목 풀림. 포켓이랑 라이브 조금 상승.',
  tonic: '보약 먹힘. 스탯 올킬.',
}

const TRAIN_FAIL: Record<TrainId, string> = {
  lyric: '라임이 중간에 끊김.',
  compose: '808이 킥을 잡아먹음.',
  club: '공연 컷. 관객이 등 돌림.',
  battle: '배틀 구경하다 박자만 놓침.',
  insta: INSTA_FAIL[0],
  throat: '목 잠김. 오늘은 쉬어라.',
  tonic: '보약이 목을 닫음. 커리어 삭제.',
}

export const BRIEF_ACTIONS = new Set([
  '라임 연습',
  '비트 작업',
  '클럽 공연',
  '배틀 구경',
  '인스타',
  '목상태',
  '작사 연습',
  '비트 만들기',
  '클럽 알바',
  '배틀 참관',
  '목 관리',
])

export function trainNotice(id: TrainId, ok: boolean): string {
  if (id === 'insta') {
    const bank = ok ? INSTA_SUCCESS : INSTA_FAIL
    return bank[Math.floor(Math.random() * bank.length)]
  }
  return ok ? TRAIN_SUCCESS[id] : TRAIN_FAIL[id]
}

const DIST: Record<Genre, Record<Genre, number>> = {
  boomBap: { boomBap: 0, trap: 2, mumble: 3, rage: 3 },
  trap: { boomBap: 2, trap: 0, mumble: 1, rage: 1 },
  mumble: { boomBap: 3, trap: 1, mumble: 0, rage: 2 },
  rage: { boomBap: 3, trap: 1, mumble: 2, rage: 0 },
}

export function genreDistance(from: Genre, to: Genre): number {
  return DIST[from][to]
}

function take(bank: string[], count: number): string[] {
  const copy = [...bank]
  const out: string[] = []
  while (out.length < count && copy.length) {
    const index = Math.floor(Math.random() * copy.length)
    out.push(copy.splice(index, 1)[0])
  }
  return out
}

function band(score: number): 'low' | 'mid' | 'high' {
  if (score < 48) return 'low'
  if (score < 72) return 'mid'
  return 'high'
}

const HIP_GENERAL: Record<'low' | 'mid' | 'high', string[]> = {
  low: [
    '1절에서 내림. 라임이 한 개도 안 붙음',
    '비트는 있는데 랩이 박 밖에 있음',
    '가사 일기임. 운율 없음 ㅋㅋ',
    '호흡 끊겨서 다음 마디를 못 넘김',
    '데모지 발매가 아님. 믹스부터',
    '플로우 딱딱함. 쇼미 1차 오디션 수준',
    '훅도 없고 벌스도 비음. 들을 이유가 없음',
    '음원 타령하기 전에 이 벌스부터 고쳐라',
    '지망생 연습실 유출인 줄',
    '하꼬 데모. 개추 금지',
    '스킬 타령 전에 1절부터',
  ],
  mid: [
    '훅은 남는데 벌스가 평범함. 언더 평균',
    '올킬은 아닌데 한 소절은 저장함',
    '클럽에서 한 번은 틀 만함. 두 번은 모르겠음',
    '성장은 들리는데 한 방이 없음',
    '라임은 있는데 밀도가 성김. 반복은 훅만',
    '믹스가 랩을 좀 잡아먹음. 보컬 올려라',
    '페스티벌 낮 타임은 가능. 헤드는 아님',
    'ㄹㅇ 들을 만은 함. 명반은 ㄴㄴ',
    '스윙은 타는데 가사가 한 톤 가벼움',
    '언더 평균. 나만 별로냐 하면 별로임',
    '명반도르 할 곡은 아님. 듣긴 함',
  ],
  high: [
    'ㅇㅈ. 둘째 마디부터 포켓이 앉음',
    '한 줄이 남아서 댓글 달고 다시 듣는 중',
    '이 사람 왜 이제 봄. 언더에 묻히기 아까움',
    '국힙에서 이 벌스면 상위권임',
    '라임이 귀에 붙음. 억지가 아님',
    '반복 중. 플레이리스트에 넣음',
    '비트 좋아서 랩이 산 게 아님. 랩이 비트를 밈',
    '오늘 게시글은 추천 받을 듯',
    '음원 안 터져도 이건 듣는 사람이 들음',
    '개추. 본캐 찾음',
    '이 곡 좋으면 막귀냐 ㅋㅋ 근데 좋음',
  ],
}

const HIP_GENRE: Record<Genre, Record<'low' | 'mid' | 'high', string[]>> = {
  boomBap: {
    low: ['붐뱁 코스프레인데 샘플도 킥도 없음', '먼지 나는 척만 하고 라임은 초딩'],
    mid: ['드럼은 붐뱁인데 라임이 성김. 반만 인정', '킥은 좋은데 벌스가 그 위를 못 탐'],
    high: ['킥 뒤에 랩이 앉아 있음. 붐뱁 맞음', '샘플 위에서 라임이 안 미끄러짐. ㅇㅈ'],
  },
  trap: {
    low: ['808만 크고 랩은 택배에 안 탐', '하이햇만 빠르고 벌스는 허공'],
    mid: ['808은 클럽각. 랩은 아직 언더', '트랩 포켓은 타는데 훅이 약함'],
    high: ['808 위에서 밀림 없음. 클럽 드랍각', '하이햇 사이에 라임이 들어감. ㅇㅈ'],
  },
  mumble: {
    low: ['가사 없이 오토튠만 떡칠. 한 마디도 안 들림', '멍청트랩이면 안 들려도 되는데 그건 컨셉이 아님'],
    mid: ['멜로디는 남는데 단어가 안 들림. 반반', '오토튠은 맞는데 벌스가 훅을 못 이김'],
    high: ['안 들려도 훅이 남음. 컨셉 성공', '오토튠 안에서도 라임이 보임. ㅇㅈ'],
  },
  rage: {
    low: ['소리지른다고 레이지냐. 포켓이 없음', '왜곡만 세고 랩은 갈라짐'],
    mid: ['에너지는 있는데 한 소절이 안 남음', '레이지 톤은 맞는데 벌스가 짧음'],
    high: ['질러도 박 안에 있음. 레이지 맞음', '왜곡 808을 랩이 밀어냄. ㅇㅈ'],
  },
}

export function hipgalLines(
  name: string,
  score: number,
  shift: 'boom' | 'bust' | null,
  snake: boolean,
  genre: Genre | null,
): string[] {
  const tone = band(score)
  const picked = take(HIP_GENERAL[tone], 2)
  const flavor = genre ? take(HIP_GENRE[genre][tone], 1) : []
  const lines = take([...picked, ...flavor], 3)
  for (const extra of take(HIP_GENERAL[tone], HIP_GENERAL[tone].length)) {
    if (lines.length >= 3) break
    if (!lines.includes(extra)) lines.push(extra)
  }
  if (shift === 'boom') lines[0] = '노선 바꿨는데 포켓이 따라감. 이게 본캐였음'
  if (shift === 'bust') lines[0] = '유행만 쫓음. 예전 노선이 본캐였음'
  if (snake) lines[2] = `${name} 곡보다 예전 발언 캡처가 위에 뜸`
  else if (lines[2] && Math.random() < 0.34) lines[2] = `${name} ${lines[2]}`
  return lines.slice(0, 3)
}

export function rhythmLines(score: number, shift: 'boom' | 'bust' | null): string[] {
  const tone = score < 55 ? 'low' : score < 92 ? 'mid' : 'high'
  const lines = {
    low: ['포켓이 킥 뒤에서 헤맴. 라임도 끊김.', '음절이 줄마다 다름. 그루브가 안 앉음.'],
    mid: ['그루브는 타는데 라임 밀도가 성김.', '딕션은 들림. 벌스 후반 숨만 정리.'],
    high: ['라임이랑 포켓이 맞음. 믹스만 정리하면 클럽각.', '줄 끝 모음이 안정. 랩이 비트를 밈.'],
  }[tone]
  const picked = take(lines, 2)
  if (shift === 'boom') picked[0] = '노선 변경이 억지 아님. 새 포켓에 랩이 앉음.'
  if (shift === 'bust') picked[0] = '장르만 바뀌고 랩은 예전 노선에 남음.'
  return picked
}

export function trashReactions(name: string): string {
  const lines = [
    `${name} 쇼미 안 나간다면서 태도만 큼. 문장 저장각.`,
    '그 발언 캡처된다고 댓글 달림.',
    '쇼미 쓰레기라는 말이 닉보다 먼저 돔.',
  ]
  return lines[Math.floor(Math.random() * lines.length)]
}

export function youtubeComments(name: string, passed: boolean, snake: boolean, roundName: string, opponent?: string): string[] {
  const base = passed
    ? [
        `${roundName} ${name} 이거 실화냐`,
        '프로듀서 표정 갈림. 통과 개추',
        '드랍각인 줄 알았는데 살아남음. 이거까지가 릿이냐',
      ]
    : [
        `${roundName}에서 마이크 식음`,
        '음원 타령 전에 이 라운드부터 넘겨라',
        '이번 시즌 랩 오브 차이나각. 오늘은 드랍',
      ]
  if (opponent) base[1] = `${opponent}한테 이름 불리고 끝남. 캡처각`
  if (snake) {
    base[0] = passed ? `쓰레기라고 까놓고 올라온 뱀새끼 ${name}` : '뱀새끼인 줄 알고 들어왔다가 탈락각'
    base.push('논란으로 조회수는 터짐')
  }
  return base.slice(0, 3)
}

export const SNAKE_EVENTS = [
  {
    title: '과거 발언 캡처',
    body: '쇼미 쓰레기라고 한 문장이 다시 돔. 해명 댓글은 접힘.',
    rep: -3,
    money: 0,
  },
  {
    title: '프로듀서 견제',
    body: '프로듀서가 컷 운운하며 자리를 빼돌림. 꼬리표가 먼저 도착.',
    rep: -2,
    money: 0,
  },
  {
    title: '힙갤 말머리',
    body: '글마다 뱀새끼가 닉 앞에 붙음. 곡 링크보다 캡처가 위.',
    rep: -2,
    money: 0,
  },
]
