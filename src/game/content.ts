import { eun } from './format'
import type { Genre, StatKey, Stats, TimelineItem, TrainId } from './types'

export const GENRE_LABEL: Record<Genre, string> = {
  boomBap: '붐뱁',
  trap: '트랩',
  rage: '레이지',
  drill: '드릴',
}

export const GENRES: Genre[] = ['boomBap', 'trap', 'rage', 'drill']

export function genreShow(genre: Genre): string {
  return GENRE_LABEL[genre]
}

export const PHASES = [
  { name: '초창기', desc: '이름은 있는데, 곡은 아직 데모다.' },
  { name: '전성기', desc: '색깔이 보이면 음원 얘기가 시작된다.' },
  { name: '황혼기', desc: '마지막 구간이다. 반응이 오기 전에 접을 수도 있다.' },
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
  { name: '빈지노', line: '옷깃만 잡지 말고 벌스를 가져와라.' },
  { name: '창모', line: '훅은 내가 가져간다. 너는 벌스로 버텨 봐.' },
  { name: '머쉬베놈', line: '박자는 내가 잡고 있다. 너는 어디 있냐.' },
  { name: '키드밀리', line: '오늘 템포는 내가 정한다. 따라올 수 있으면 와라.' },
  { name: '슈퍼비', line: '오늘 무대는 잔고 자랑이 아니다. 마이크로 말해라.' },
  { name: '식케이', line: '한 단어로 끝낼 생각이면 늦었다. 벌스를 채워라.' },
  { name: '염따', line: '훅은 내가 쉽게 남긴다. 너는 후렴 하나만 가져와 봐.' },
  { name: '더콰이엇', line: '샘플 위에서 밀리면 끝이다. 라임을 앉아라.' },
  { name: '팔로알토', line: '길게 늘인다고 벌스가 되는 게 아니다. 한 줄을 남겨 봐.' },
  { name: '딥플로우', line: '속도보다 밀도가 이긴다. 오늘 그걸 보여 봐.' },
  { name: '넉살', line: '펀치는 짧게 친다. 너는 몇 줄이나 버티냐.' },
  { name: '이센스', line: '이야기로 밀 수 있으면 들어와라. 말만 길면 진다.' },
  { name: '기리보이', line: '감각만으로는 한 라운드다. 그다음 벌스를 내놔라.' },
  { name: '자이언티', line: '멜로디에 기대지 마라. 오늘은 랩으로 승부다.' },
  { name: '박재범', line: '무대는 국제 대회가 아니다. 이 마이크에서 이겨라.' },
  { name: '비와이', line: '큰 목청만으로는 안 된다. 박자 안에 넣어라.' },
  { name: '치타', line: '세다고 이긴 게 아니다. 한 소절을 남겨 봐.' },
  { name: '제시', line: '태도로 밀지 마라. 벌스가 먼저다.' },
  { name: '씨잼', line: '비트 위에서 놀 생각이면 늦었다. 가사를 얹어라.' },
  { name: '산이', line: '흥만 있으면 후렴이다. 벌스까지 가져와라.' },
  { name: '우원재', line: '중얼거림 뒤에 문장이 있어야 한다. 오늘은 그게 심사다.' },
  { name: '윤미래', line: '목청으로 덮지 마라. 가사도 같이 들려라.' },
  { name: '화나', line: '톤만 세면 컨셉이다. 라임까지 보여라.' },
  { name: '스윙스', line: '각오 없이 마이크 잡았으면 내려놔라.' },
]

export const RIVALS = DISS_OPPONENTS.map((item) => item.name)

export const LABELS = [
  { name: 'ILLIONAIRE RECORDS', min: 36, base: 2_400_000, line: '일리네어가 계약서를 들고 왔다. 선급이 크고, 앨범 정산이 따라온다.' },
  { name: 'AOMG', min: 32, base: 2_100_000, line: 'AOMG가 데모를 들었다. 사인하면 라이브 자리가 먼저 붙는다.' },
  { name: 'H1GHR MUSIC', min: 28, base: 1_700_000, line: '하이어뮤직이 반응했다. 계약하면 파급이 붙고, 거절하면 인디로 남는다.' },
  { name: 'Just Music', min: 24, base: 1_350_000, line: '저스트뮤직이 연습실로 찾아왔다. 받으면 무대가 생기고, 거절하면 하던 노선을 유지한다.' },
  { name: 'Hi-Lite Records', min: 20, base: 980_000, line: '하이라이트레코드가 데모에 반응했다. 선급은 중간이다.' },
  { name: 'Ambition Musik', min: 18, base: 860_000, line: '앰비션 뮤직이 연락했다. 사인하면 앨범 정산이 오른다.' },
  { name: 'STANDARD FRIENDS', min: 16, base: 720_000, line: '스탠다드프렌즈가 데모를 들었다. 라이브 자리가 생긴다.' },
  { name: 'WYBH', min: 14, base: 580_000, line: 'WYBH가 찾아왔다. 계약하면 파급이 붙는다.' },
  { name: 'Indigo Music', min: 12, base: 480_000, line: '인디고 뮤직이 데모에 반응했다. 선급은 작고, 자리는 생긴다.' },
  { name: 'VMC', min: 10, base: 390_000, line: 'VMC가 계약서를 들고 왔다. 언더에서 먼저 밀어 준다.' },
  { name: 'Feel Ghood Music', min: 8, base: 320_000, line: '필굿뮤직이 반응했다. 아직 이름이 작은 사람을 밀어 준다.' },
  { name: 'Brand New Music', min: 22, base: 1_100_000, line: '브랜드뉴뮤직이 데모를 들었다. 사인하면 방송 자리가 생긴다.' },
]

function shuffleBy(seed: number, items: typeof LABELS) {
  const copy = [...items]
  let n = seed || 1
  for (let i = copy.length - 1; i > 0; i -= 1) {
    n = (n * 9301 + 49297) % 233280
    const j = n % (i + 1)
    const temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }
  return copy
}

export function labelOffers(rep: number, seed = rep): { name: string; line: string; advance: number }[] {
  const eligible = LABELS.filter((item) => rep >= item.min)
  const count = Math.min(eligible.length, eligible.length <= 2 ? eligible.length : 3)
  return shuffleBy(seed + eligible.length, eligible)
    .slice(0, count)
    .sort((a, b) => b.min - a.min)
    .map((item) => ({ name: item.name, line: item.line, advance: item.base + rep * 18_000 }))
}

function withTeam<T extends { names: string[] }>(row: T) {
  return { ...row, team: `팀 ${row.names.map((name) => [...name][0] ?? '').join('')}` }
}

export const PRODUCERS = [
  withTeam({ id: 'doki', names: ['도끼', '더콰이엇'], meme: '음원 얘기는 나중에 해. 지금은 실력부터 본다.' }),
  withTeam({ id: 'swingz', names: ['스윙스', '기리보이'], meme: '마이크를 놓치면 탈락이다. 각오 없으면 나가라.' }),
  withTeam({ id: 'grayson', names: ['그레이', '자이언티'], meme: '멜로디만 있고 래퍼가 안 보인다. 벌스로 인정받아라.' }),
  withTeam({ id: 'codeart', names: ['코드쿤스트', '팔로알토'], meme: '비트가 세면 네가 밀린다. 오늘은 네가 비트를 밀어라.' }),
]

export function producerNames(producer: { names: string[] }): string {
  return producer.names.join(', ')
}

export interface GenreStart {
  genre: Genre
  place: string
  entry: string
  stats: Stats
  story: string
}

const LEGACY_ORIGIN: Record<string, Genre> = {
  hongdae: 'boomBap',
  gangnam: 'trap',
  sinrim: 'trap',
  mumble: 'trap',
  incheon: 'rage',
}

export const GENRE_STARTS: GenreStart[] = [
  {
    genre: 'boomBap',
    place: '홍대',
    entry: '전단지보다 CD',
    stats: { lyric: 24, compose: 14, flow: 16, club: 10, pr: 8 },
    story: '{name} 홍대에서 힙합을 시작했다. 전단지보다 형의 CD가 먼저였다. 붐뱁을 주력으로 잡았고, 저음보다 가사가 먼저 들렸다.',
  },
  {
    genre: 'trap',
    place: '강남',
    entry: '808이 먼저',
    stats: { lyric: 12, compose: 16, flow: 18, club: 22, pr: 18 },
    story: '{name} 강남 클럽에서 시작했다. 문장보다 808이 먼저 가슴을 밀었다. 트랩을 주력으로 잡았고, 계산서보다 저음이 남았다.',
  },
  {
    genre: 'rage',
    place: '인천',
    entry: '야간 소음',
    stats: { lyric: 14, compose: 12, flow: 22, club: 16, pr: 10 },
    story: '{name} 인천 야간 영상으로 시작했다. 해외 라이브는 노래가 아니라 소음이었다. 그래서 레이지를 주력으로 잡았다. 힙합은 참는 장르가 아니다.',
  },
  {
    genre: 'drill',
    place: '영등포',
    entry: '슬라이드 808',
    stats: { lyric: 16, compose: 18, flow: 16, club: 18, pr: 12 },
    story: '{name} 영등포에서 시작했다. 슬라이드 베이스 위에 칼같이 끊는 플로우를 올렸다. 드릴이 주력이었다.',
  },
]

export function genreStart(id: string | null | undefined): GenreStart | undefined {
  if (!id) return undefined
  const genre = readGenre(id)
  return GENRE_STARTS.find((item) => item.genre === genre)
}

export function readGenre(value: unknown): Genre | null {
  if (typeof value !== 'string' || !value) return null
  if ((GENRES as string[]).includes(value)) return value as Genre
  return LEGACY_ORIGIN[value] ?? null
}

export const TRAIN_ACTIONS: { id: TrainId; label: string; stat: StatKey; detail: string }[] = [
  { id: 'lyric', label: '라임 연습', stat: 'lyric', detail: '노트에 라임을 채운다' },
  { id: 'compose', label: '비트 작업', stat: 'compose', detail: '킥이랑 808을 만진다' },
  { id: 'club', label: '클럽 공연', stat: 'club', detail: '밤에 직접 라이브를 한다' },
  { id: 'battle', label: '랩레슨받기', stat: 'lyric', detail: '선배 앞에서 랩을 배운다' },
  { id: 'insta', label: '인스타', stat: 'pr', detail: '스토리로 이름을 알린다' },
  { id: 'throat', label: '목상태', stat: 'club', detail: '성대를 아끼고 라이브를 유지한다' },
  { id: 'tonic', label: '보약', stat: 'flow', detail: '성공확률은 60%. 되면 스탯이 전부 오르고, 실패하면 커리어가 끝난다' },
]

export function trainActions(phase: number) {
  return TRAIN_ACTIONS.map((action) => {
    if (action.id !== 'battle') return action
    if (phase === 0) return action
    return { ...action, label: '랩레슨하기', detail: '후배를 가르친다' }
  })
}

const INSTA_SUCCESS = [
  '릴스가 알고리즘에 걸려서 홍보가 올랐다.',
  '작업실 스토리에 저장이 쌓였다. 반응이 좋을 것 같다.',
  '댓글창이 이름으로 덮였다.',
  '한 소절이 저장보다 먼저 퍼졌다.',
]

const INSTA_FAIL = [
  '억지 홍보가 캡처돼서 돌아왔고, 이름이 깎였다.',
  '현타 오는 릴스라서 반응이 별로다.',
  '광고인 게 바로 들켰다.',
]

const TRAIN_SUCCESS: Record<TrainId, string> = {
  lyric: '라임이 하나 붙었다.',
  compose: '킥이 자리에 앉아서 비트가 올랐다.',
  club: '클럽 공연이 먹혔다. 다음 주도 서라고 한다.',
  battle: '레슨이 먹혀서 라임이 늘었다.',
  insta: INSTA_SUCCESS[0],
  throat: '목이 풀려서 라이브가 조금 올랐다.',
  tonic: '보약이 먹혀서 스탯이 전부 올랐다.',
}

const TRAIN_FAIL: Record<TrainId, string> = {
  lyric: '라임이 중간에 끊겼다.',
  compose: '808이 킥을 잡아먹었다.',
  club: '공연이 잘렸다. 관객이 등을 돌렸다.',
  battle: '레슨에서 박자를 놓쳤다.',
  insta: INSTA_FAIL[0],
  throat: '목이 잠겼다. 오늘은 쉬는 게 낫다.',
  tonic: '보약이 목을 닫아서 커리어가 끝났다.',
}

export const BRIEF_ACTIONS = new Set([
  '라임 연습',
  '비트 작업',
  '클럽 공연',
  '랩레슨하기',
  '랩레슨받기',
  '배틀 구경',
  '인스타',
  '목상태',
  '작사 연습',
  '비트 만들기',
  '클럽 알바',
  '배틀 참관',
  '목 관리',
])

export function trainNotice(id: TrainId, ok: boolean, phase = 0): string {
  if (id === 'insta') {
    const bank = ok ? INSTA_SUCCESS : INSTA_FAIL
    return bank[Math.floor(Math.random() * bank.length)]
  }
  if (id === 'battle') {
    if (phase === 0) return ok ? '선배 레슨이 먹혀서 라임이 늘었다.' : '레슨에서 박자를 놓쳤다.'
    return ok ? '후배를 가르치다 내 라임도 정리됐다.' : '가르치다 박자를 놓쳤다.'
  }
  return ok ? TRAIN_SUCCESS[id] : TRAIN_FAIL[id]
}

const DIST: Record<Genre, Record<Genre, number>> = {
  boomBap: { boomBap: 0, trap: 2, rage: 3, drill: 2 },
  trap: { boomBap: 2, trap: 0, rage: 1, drill: 1 },
  rage: { boomBap: 3, trap: 1, rage: 0, drill: 1 },
  drill: { boomBap: 2, trap: 1, rage: 1, drill: 0 },
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
    '1절에서 내려간다. 라임이 한 개도 안 붙는다.',
    '비트는 있는데 랩이 박자 밖에 있다.',
    '가사 일기다. 운율이 없다.',
    '호흡이 끊겨서 다음 마디를 못 넘긴다.',
    '데모지, 발매는 아니다. 믹스부터 다시 해라.',
    '플로우가 딱딱하다. 쇼미 1차 오디션 수준이다.',
    '훅도 없고 벌스도 비어 있다. 들을 이유가 없다.',
    '음원 얘기하기 전에 이 벌스부터 고쳐라.',
    '지망생 연습실에서 흘러나온 것 같다.',
    '아직 데모다. 추천하기는 이르다.',
    '실력 얘기 전에 1절부터 다시 해라.',
  ],
  mid: [
    '훅은 남는데 벌스가 평범하다. 언더 평균이다.',
    '다 잘한 건 아닌데, 한 소절은 저장했다.',
    '클럽에서 한 번은 틀 만하다. 두 번은 모르겠다.',
    '성장은 들리는데 한 방이 없다.',
    '라임은 있는데 밀도가 성기다. 반복은 훅뿐이다.',
    '믹스가 랩을 좀 잡아먹는다. 보컬을 올려라.',
    '페스티벌 낮 타임은 가능하다. 헤드는 아니다.',
    '들을 만은 하다. 명반은 아니다.',
    '스윙은 타는데 가사가 한 톤 가볍다.',
    '언더 평균이다. 나만 별로라고 하면, 별로인 거다.',
    '명반이라고 할 곡은 아니다. 듣기는 한다.',
  ],
  high: [
    '인정한다. 둘째 마디부터 박자가 앉는다.',
    '한 줄이 남아서, 댓글 달고 다시 듣는 중이다.',
    '이 사람을 왜 이제 봤나. 언더에 묻히기 아깝다.',
    '국힙에서 이 벌스면 상위권이다.',
    '라임이 귀에 붙는다. 억지가 아니다.',
    '반복해서 듣는 중이다. 플레이리스트에 넣었다.',
    '비트가 좋아서 랩이 산 게 아니다. 랩이 비트를 민다.',
    '오늘 글은 추천받을 것 같다.',
    '음원이 안 터져도, 이건 듣는 사람이 듣는다.',
    '반응이 좋다. 주력을 찾았다.',
    '이상하게 계속 듣게 된다. 근데 좋다.',
  ],
}

const HIP_GENRE: Record<Genre, Record<'low' | 'mid' | 'high', string[]>> = {
  boomBap: {
    low: ['붐뱁인 척하는데 샘플도 킥도 없다.', '먼지 나는 척만 하고 라임은 아직 연습생이다.'],
    mid: ['드럼은 붐뱁인데 라임이 성기다. 반은 인정한다.', '킥은 좋은데 벌스가 그 위를 못 탄다.'],
    high: ['킥 뒤에 랩이 앉아 있다. 붐뱁이 맞다.', '샘플 위에서 라임이 안 미끄러진다. 인정한다.'],
  },
  trap: {
    low: ['808만 크고 랩은 안 실린다.', '하이햇만 빠르고 벌스는 허공이다.'],
    mid: ['808은 클럽에서 통한다. 랩은 아직 언더다.', '트랩 박자는 타는데 훅이 약하다.'],
    high: ['808 위에서 안 밀린다. 클럽에 틀 만하다.', '하이햇 사이에 라임이 들어간다. 인정한다.'],
  },
  rage: {
    low: ['소리지른다고 레이지는 아니다. 박자가 없다.', '왜곡만 세고 랩은 갈라진다.'],
    mid: ['에너지는 있는데 한 소절이 안 남는다.', '레이지 톤은 맞는데 벌스가 짧다.'],
    high: ['질러도 박자 안에 있다. 레이지가 맞다.', '왜곡된 808을 랩이 밀어낸다. 인정한다.'],
  },
  drill: {
    low: ['슬라이드만 있고 플로우는 안 끊긴다.', '드릴인 척하는데 킥 패턴이 트랩이다.'],
    mid: ['베이스는 드릴인데 칼이 무디다.', '끊는 맛은 있는데 한 소절이 약하다.'],
    high: ['슬라이드 위에 플로우가 칼이다. 드릴이 맞다.', '킥이 밀고, 랩이 자른다. 인정한다.'],
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
  if (shift === 'boom') lines[0] = '노선을 바꿨는데 박자가 따라간다. 이게 주력이었나 보다.'
  if (shift === 'bust') lines[0] = '유행만 쫓았다. 예전 노선이 주력이었다.'
  if (snake) lines[2] = `${eun(name)} 낸 곡보다 예전 발언 캡처가 위에 뜬다.`
  else if (lines[2] && Math.random() < 0.34) lines[2] = `${eun(name)} ${lines[2]}`
  return lines.slice(0, 3)
}

export function rhythmLines(score: number, shift: 'boom' | 'bust' | null): string[] {
  const tone = score < 55 ? 'low' : score < 92 ? 'mid' : 'high'
  const lines = {
    low: ['박자가 킥 뒤에서 헤맨다. 라임도 끊긴다.', '음절이 줄마다 다르다. 그루브가 안 앉는다.'],
    mid: ['그루브는 타는데 라임 밀도가 성기다.', '발음은 들린다. 벌스 후반 숨만 정리하면 된다.'],
    high: ['라임이랑 박자가 맞는다. 믹스만 정리하면 클럽에 튼다.', '줄 끝 모음이 안정적이다. 랩이 비트를 민다.'],
  }[tone]
  const picked = take(lines, 2)
  if (shift === 'boom') picked[0] = '노선 변경이 억지가 아니다. 새 박자에 랩이 앉는다.'
  if (shift === 'bust') picked[0] = '장르만 바뀌고 랩은 예전 노선에 남았다.'
  return picked
}

export function trashReactions(name: string, appeared: boolean): string {
  const lines = appeared
    ? [
        `${eun(name)} 쇼미에 나갔다가, 나가면 구리다고 욕한다. 그 표시가 레이블 옆에 붙었다.`,
        '나갔던 사람이 쇼미는 구리다고 하니 레이블 옆에 남는다.',
        '쇼미 나가면 구리다는 말이 이름보다 먼저 돈다.',
      ]
    : [
        `${eun(name)} 쇼미 나가면 구리다고 욕했다. 나중에 나가면 그 표시가 레이블 옆에 붙는다.`,
        '쇼미는 구리다고 욕부터 했다. 출연하는 순간 뱀새끼가 된다.',
        '쇼미 나가면 구리다는 말이 저장됐다. 나가면 레이블 옆에 남는다.',
      ]
  return lines[Math.floor(Math.random() * lines.length)]
}

export function youtubeComments(name: string, passed: boolean, snake: boolean, roundName: string, opponent?: string): string[] {
  const base = passed
    ? [
        `${roundName} ${name}, 이거 실화냐`,
        '프로듀서 표정이 갈렸다. 통과다.',
        '떨어질 줄 알았는데 살아남았다. 여기까지가 한계냐.',
      ]
    : [
        `${roundName}에서 마이크가 식었다.`,
        '음원 얘기 전에 이 라운드부터 넘겨라.',
        '이번 시즌은 여기서 끝날 것 같다. 오늘은 탈락이다.',
      ]
  if (opponent) base[1] = `${opponent}한테 이름을 불리고 끝났다. 캡처가 돌 것 같다.`
  if (snake) {
    base[0] = passed ? `쇼미를 뱀새끼라 해 놓고 올라온 ${name}` : '뱀새끼 발언 때문에 들어왔다가 떨어졌다.'
    base.push('논란 때문에 조회수는 터졌다.')
  }
  return base.slice(0, 3)
}

export const SNAKE_EVENTS = [
  {
    title: '과거 발언 캡처',
    body: '쇼미 나가면 구리다고 했던 문장이 다시 돌고, 해명 댓글은 묻힌다.',
    rep: -3,
    money: 0,
  },
  {
    title: '프로듀서 견제',
    body: '프로듀서가 탈락 얘기를 하면서 자리를 빼돌렸다. 꼬리표가 먼저 도착했다.',
    rep: -2,
    money: 0,
  },
  {
    title: '닉 앞 꼬리표',
    body: '글마다 예전 말이 닉 앞에 붙는다. 곡 링크보다 그 캡처가 위에 있다.',
    rep: -2,
    money: 0,
  },
]
