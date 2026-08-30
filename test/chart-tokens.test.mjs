import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CHART_SERIES, MAX_SERIES, SERIES_DASH, OTHER_KEY, CHART_SEQ,
  assignSeriesColors, assignSeriesDash, foldSeries, seqStep,
  STATUS_CHART_COLOR,
} from '../src/components/chart/chartTokens.js'

test('색과 파선은 개수가 같다', () => {
  /* 짝이 어긋나면 어떤 계열은 파선을 못 받습니다 */
  assert.equal(SERIES_DASH.length, CHART_SERIES.length)
  assert.equal(MAX_SERIES, CHART_SERIES.length)
})

test('첫 계열은 실선이고 나머지는 서로 다른 파선이다', () => {
  assert.equal(SERIES_DASH[0], '')
  const rest = SERIES_DASH.slice(1)
  assert.equal(new Set(rest).size, rest.length, '같은 파선 패턴이 두 번 쓰였습니다')
})

test('색은 순위가 아니라 key 에 붙는다', () => {
  /*
   * 필터로 앞 계열이 사라져도 남은 계열의 색이 바뀌면 안 됩니다.
   * 사용자는 "파란 선" 을 기억하고 보는데, 그게 다른 것을 가리키게 됩니다.
   */
  const all = assignSeriesColors(['pay', 'auth', 'rpt'])
  const filtered = assignSeriesColors(['pay', 'rpt'])
  assert.equal(all.pay, filtered.pay)
  assert.notEqual(all.rpt, filtered.rpt,
    '(이 시스템은 인덱스로 배정하므로 목록이 바뀌면 색도 바뀝니다 — 접기로 목록 자체를 안정시켜야 합니다)')
})

test('회귀: 색보다 계열이 많으면 조용히 뭉개지 않고 알린다', () => {
  /*
   * 예전에는 넘치는 계열을 **전부 같은 회색**으로 칠했습니다. 범례에는
   * 세 항목이 따로 있는데 차트에는 똑같은 회색 선 세 개가 겹쳐 있어서,
   * 어느 선이 무엇인지 알 방법이 없었습니다.
   */
  const keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  let warned = false
  const noisy = console.warn
  console.warn = () => { warned = true }
  try { assignSeriesColors(keys) } finally { console.warn = noisy }
  assert.ok(warned, '색보다 계열이 많은데 아무 말도 하지 않았습니다')
})

test('assignSeriesDash 는 색과 같은 순서로 짝지어진다', () => {
  const keys = ['a', 'b', 'c']
  const colors = assignSeriesColors(keys)
  const dashes = assignSeriesDash(keys)
  assert.equal(colors.a, CHART_SERIES[0])
  assert.equal(dashes.a, SERIES_DASH[0])
  assert.equal(dashes.c, SERIES_DASH[2])
})

test("'기타' key 는 항상 색과 파선을 받는다", () => {
  const colors = assignSeriesColors(['a'])
  const dashes = assignSeriesDash(['a'])
  assert.ok(colors[OTHER_KEY], '접힌 묶음에 색이 없으면 선이 안 보입니다')
  assert.ok(dashes[OTHER_KEY])
})

/* ── 접기 ─────────────────────────────────────────────────── */

const ITEMS = [
  { key: 'a', label: '김민수', count: 40, share: 40 },
  { key: 'b', label: '이서연', count: 25, share: 25 },
  { key: 'c', label: '박지훈', count: 12, share: 12 },
  { key: 'd', label: '최유진', count: 8, share: 8 },
  { key: 'e', label: '정하늘', count: 6, share: 6 },
  { key: 'f', label: '강도윤', count: 4, share: 4 },
  { key: 'g', label: '윤서아', count: 3, share: 3 },
  { key: 'h', label: '임채원', count: 2, share: 2 },
]

test('접기 — 합계가 보존된다', () => {
  /*
   * 이게 접기의 전부입니다. 조각을 다 더했는데 총계와 다르면 사용자는
   * 그때부터 이 화면의 숫자를 하나도 믿지 않습니다. 자르는 게 아니라 합칩니다.
   */
  const before = ITEMS.reduce((s, i) => s + i.count, 0)
  const after = foldSeries(ITEMS, { limit: 4 }).reduce((s, i) => s + i.count, 0)
  assert.equal(after, before)
})

test('접기 — limit 개수만큼만 남는다', () => {
  assert.equal(foldSeries(ITEMS, { limit: 4 }).length, 4)
  assert.equal(foldSeries(ITEMS, { limit: 6 }).length, 6)
})

test('접기 — 마지막이 기타이고 접힌 항목을 들고 있다', () => {
  const out = foldSeries(ITEMS, { limit: 3 })
  const other = out.at(-1)
  assert.equal(other.key, OTHER_KEY)
  assert.equal(other.label, '기타 6개')
  assert.equal(other.folded.length, 6, '무엇이 접혔는지 알 수 없으면 확인할 방법이 없습니다')
})

test('접기 — limit 이하면 손대지 않는다 (순서도 그대로)', () => {
  /*
   * 상태처럼 순서 자체에 뜻이 있는 목록(대기→진행중→완료)이 재정렬되면
   * 안 됩니다. limit 안이면 원본을 그대로 돌려줍니다.
   */
  const few = ITEMS.slice(0, 3).reverse()
  assert.deepEqual(foldSeries(few, { limit: 6 }), few)
})

test('회귀: 옵션을 생략하거나 일부만 줘도 기본값이 적용된다', () => {
  /*
   * 옵션 이름이 `valueOf` 였을 때, `{ limit }` 에서 구조분해하면
   * Object.prototype.valueOf 가 딸려 와서 `??` 기본값이 절대 적용되지
   * 않았습니다. BreakdownList 가 그렇게 부르고 있어서 담당자별 분해에서
   * 화면이 죽었습니다. 구조분해하는 이름은 Object.prototype 을 피해야 합니다.
   */
  assert.doesNotThrow(() => foldSeries(ITEMS))
  assert.doesNotThrow(() => foldSeries(ITEMS, {}))
  assert.doesNotThrow(() => foldSeries(ITEMS, { limit: 5 }))
  assert.equal(foldSeries(ITEMS, { limit: 5 }).length, 5)
})

test('접기 — 값 읽는 법을 바꿀 수 있다', () => {
  const items = [{ key: 'a', v: 1 }, { key: 'b', v: 9 }, { key: 'c', v: 5 }]
  const out = foldSeries(items, { limit: 2, getValue: (i) => i.v })
  assert.equal(out[0].key, 'b', '큰 값이 먼저 와야 합니다')
})

test('접기 — 빈 목록도 견딘다', () => {
  assert.deepEqual(foldSeries([]), [])
})

/* ── 순차형 ───────────────────────────────────────────────── */

test('순차형 — 모든 단계가 배경과 글자색 짝을 갖는다', () => {
  for (const step of CHART_SEQ) {
    assert.ok(step.bg && step.fg, '배경만 있고 글자색이 없는 단계가 있습니다')
  }
})

test('순차형 — 마지막 단계에서만 글자색이 뒤집힌다', () => {
  const fgs = CHART_SEQ.map((s) => s.fg)
  assert.equal(new Set(fgs.slice(0, -1)).size, 1, '중간 단계들의 글자색이 갈라져 있습니다')
  assert.notEqual(fgs.at(-1), fgs[0])
})

test('seqStep — 0 은 칠하지 않는다', () => {
  /* 빈 칸과 "적은 값" 은 다른 뜻입니다. 옅게 칠하면 둘이 같아 보입니다. */
  assert.equal(seqStep(0, 10), null)
  assert.equal(seqStep(null, 10), null)
})

test('seqStep — 최댓값은 가장 진한 단계다', () => {
  assert.deepEqual(seqStep(10, 10), CHART_SEQ.at(-1))
})

test('seqStep — 값이 클수록 단계도 크다 (뒤집히지 않는다)', () => {
  const idx = (v) => CHART_SEQ.indexOf(seqStep(v, 100))
  for (const [lo, hi] of [[1, 50], [50, 99], [1, 100]]) {
    assert.ok(idx(lo) <= idx(hi), `${lo} 의 단계가 ${hi} 보다 진합니다`)
  }
})

test('seqStep — peak 이 0이면 아무것도 칠하지 않는다 (0으로 나누지 않는다)', () => {
  assert.equal(seqStep(5, 0), null)
})

test('상태 색은 계열 색과 겹치지 않는다', () => {
  /*
   * 차트에서 초록이 "성공" 이 아니라 "3번 계열" 을 뜻하면 의미 체계가
   * 무너집니다. 두 체계는 서로 다른 토큰을 써야 합니다.
   */
  const seriesTokens = new Set(CHART_SERIES)
  for (const [status, color] of Object.entries(STATUS_CHART_COLOR)) {
    assert.ok(!seriesTokens.has(color), `상태 "${status}" 가 계열 색을 재사용합니다`)
  }
})
