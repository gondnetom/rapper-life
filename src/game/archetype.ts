import { GENRE_LABEL } from './content'
import { smtmCareerLabel } from './smtm'
import { eun, statLabel, topStat } from './format'
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
      blurb: `${eun(name)} 보약 때문에 먼저 끝났다. 곡보다 사고가 커리어를 닫았다.`,
    }
  }
  if (state.snakeTag && won) {
    return {
      title: '논란의 파이널',
      blurb: `${eun(name)} 쇼미를 욕해 놓고 그 무대에서 우승했다. 그 논란이 조회수가 됐다.`,
    }
  }
  if (won) {
    return { title: '쇼미 본캐', blurb: `${eun(name)} 파이널을 가져갔고, 잠깐은 국힙으로 불렸다.` }
  }
  if (state.snakeTag && money >= 1_200_000) {
    return { title: '논란으로 밥벌이', blurb: '꼬리표는 붙었지만, 라이브 자리는 그대로 남았다.' }
  }
  if (state.snakeTag) {
    return { title: '과거 발언', blurb: '예전에 한 말이 닉 앞에 붙어서 안 떨어진다.' }
  }
  if (money >= 2_500_000 && rep >= 70) {
    return { title: '국힙원탑', blurb: '앨범이랑 라이브가 같이 터졌다. 댓글은 어차피 깎는다.' }
  }
  if (state.ownLabel) {
    return {
      title: '자기 간판',
      blurb: `${state.labelName ?? '자기 레이블'} 간판을 직접 달고, 정산은 자기가 했다.`,
    }
  }
  if (state.signedLabel && money >= 800_000) {
    return { title: '레이블 간판', blurb: `${state.labelName ?? '레이블'}에서 활동하면서 이름을 알렸다.` }
  }
  if (top === 'pr') {
    return { title: '홍보형', blurb: '곡보다 피드가 먼저 퍼졌다.' }
  }
  if (top === 'lyric' && money < 400_000) {
    return { title: '가사형', blurb: '라임은 남았는데, 음원은 그만큼 따라오지 않았다.' }
  }
  if (top === 'club') {
    return { title: '밤 라이브', blurb: '밤에 하는 라이브가 주력이었다.' }
  }
  if (state.genre === 'boomBap' && top === 'lyric') {
    return { title: '붐뱁 본캐', blurb: '붐뱁으로 가사를 밀고 갔다.' }
  }
  if (state.genre === 'rage') {
    return { title: '소리지름 본캐', blurb: `사람들이 기억하는 소리는 ${genre}였다.` }
  }
  if (state.genre === 'trap') {
    return { title: '808 본캐', blurb: '808 비트로 이름을 알렸다.' }
  }
  if (state.genre === 'drill') {
    return { title: '드릴 본캐', blurb: '슬라이드 베이스 위에 플로우를 잘라 올렸다.' }
  }
  return { title: '언더 평균', blurb: `${eun(name)} 초창기부터 황혼기까지 자기 속도로 버텼다. 제일 잘한 건 ${statLabel(top)}이다.` }
}

export { smtmCareerLabel }
