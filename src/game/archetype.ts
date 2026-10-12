import { GENRE_LABEL } from './content'
import { smtmCareerLabel } from './smtm'
import { statLabel, topStat } from './format'
import type { GameState } from './types'

export function describeCareer(state: GameState): { title: string; blurb: string } {
  const top = topStat(state.stats)
  const money = state.money
  const rep = state.reputation
  const won = state.smtmBestClears >= 7
  const name = state.rapName
  const genre = state.genre ? GENRE_LABEL[state.genre] : '힙합'

  if (state.tonicEnd) {
    return {
      title: '보약의 끝',
      blurb: `${name}은 보약에 먼저 컷됐다. 곡보다 사고가 커리어를 닫았다.`,
    }
  }
  if (state.snakeTag && won) {
    return {
      title: '뱀의 파이널',
      blurb: `${name}은 쇼미를 까고 그 무대로 우승했다. 논란이 조회수가 됐다.`,
    }
  }
  if (won) {
    return { title: '쇼미 본캐', blurb: `${name}은 파이널을 가져가고 잠깐 국힙 취급을 받았다.` }
  }
  if (state.snakeTag && money >= 1_200_000) {
    return { title: '논란으로 밥벌이', blurb: '꼬리표는 붙었는데 라이브 자리는 남았다.' }
  }
  if (state.snakeTag) {
    return { title: '뱀새끼', blurb: '과거 발언이 말머리에 붙어서 안 내려온다.' }
  }
  if (money >= 2_500_000 && rep >= 70) {
    return { title: '국힙원탑', blurb: '앨범이랑 라이브가 같이 터졌다. 갤은 어차피 다 깐다.' }
  }
  if (state.ownLabel) {
    return {
      title: '사장',
      blurb: `${state.labelName ?? '자기 레이블'} 간판을 직접 달고 정산을 굴렸다.`,
    }
  }
  if (state.signedLabel && money >= 800_000) {
    return { title: '레이블 간판', blurb: `${state.labelName ?? '레이블'} 아래에서 네임드를 키웠다.` }
  }
  if (top === 'pr') {
    return { title: '언플충', blurb: '곡보다 피드가 먼저 퍼졌다.' }
  }
  if (top === 'lyric' && money < 400_000) {
    return { title: '스킬충', blurb: '라임은 남았는데 음원은 그만큼 안 따라왔다.' }
  }
  if (top === 'club') {
    return { title: '클럽각', blurb: '밤 라이브가 본캐였다.' }
  }
  if (state.genre === 'boomBap' && top === 'lyric') {
    return { title: '붐뱁 본캐', blurb: '붐뱁 위에서 가사를 밀고 갔다.' }
  }
  if (state.genre === 'rage') {
    return { title: '소리지름 본캐', blurb: `${genre}가 커리어 얼굴이 됐다.` }
  }
  if (state.genre === 'mumble') {
    return { title: '오토튠 본캐', blurb: '딕션 대신 바이브로 밀었다.' }
  }
  if (state.genre === 'trap') {
    return { title: '808 본캐', blurb: '808 위에서 닉을 쌓았다.' }
  }
  return { title: '언더 평균', blurb: `${name}은 신입부터 황혼기까지 자기 속도로 버텼다. 대표 스탯은 ${statLabel(top)}.` }
}

export { smtmCareerLabel }
