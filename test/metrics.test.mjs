import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeFields, fieldMap } from '../src/lib/fields.js'
import { emptyQuery } from '../src/lib/query.js'
import { computeMetric, breakdownMetric, thresholdState, compareMetric } from '../src/lib/metrics.js'

const FIELDS = normalizeFields([
  { key: 'id', label: 'ID', type: 'text' },
  { key: 'system', label: '시스템', type: 'select', options: [
    { value: 'pay', label: '결제' }, { value: 'auth', label: '인증' }, { value: 'rpt', label: '리포트' },
  ] },
  { key: 'errors', label: '오류', type: 'number' },
])
const FM = fieldMap(FIELDS)

const RECORDS = [
  { id: 'A', system: 'pay',  errors: 10 },
  { id: 'B', system: 'pay',  errors: 5 },
  { id: 'C', system: 'auth', errors: 30 },
  { id: 'D', system: 'rpt',  errors: 0 },
]

const SUM = { id: 'err', label: '오류 총계', query: emptyQuery(), aggregate: 'sum', field: 'errors' }
const COUNT = { id: 'cnt', label: '건수', query: emptyQuery(), aggregate: 'count' }

test('computeMetric — 집계 종류대로 계산한다', () => {
  assert.equal(computeMetric(SUM, RECORDS, FM).value, 45)
  assert.equal(computeMetric(COUNT, RECORDS, FM).value, 4)
})

test('computeMetric — 드릴다운할 수 있게 실제 레코드를 들고 있다', () => {
  /* 숫자만 돌려주면 "이 15건 보기" 를 누를 수 없습니다 */
  const m = computeMetric(COUNT, RECORDS, FM)
  assert.equal(m.matched.length, 4)
  assert.equal(m.count, 4)
})

test('분해 조각의 합은 지표 총계와 같다 — sum', () => {
  /*
   * 이 시스템에서 가장 중요한 불변식입니다.
   *
   * 분해는 지표와 **같은 집계**를 써야 합니다. '오류 총계'를 분해하면서
   * 레코드 수를 세면 합계와 조각이 어긋나고, 사용자는 그때부터 이 화면의
   * 숫자를 하나도 믿지 않습니다.
   */
  const total = computeMetric(SUM, RECORDS, FM).value
  const parts = breakdownMetric(SUM, RECORDS, FM, 'system')
  const sum = parts.reduce((acc, p) => acc + p.count, 0)
  assert.equal(sum, total, `조각 합 ${sum} 이 총계 ${total} 과 다릅니다`)
})

test('분해 조각의 합은 지표 총계와 같다 — count', () => {
  const total = computeMetric(COUNT, RECORDS, FM).value
  const parts = breakdownMetric(COUNT, RECORDS, FM, 'system')
  assert.equal(parts.reduce((acc, p) => acc + p.count, 0), total)
})

test('분해 — 큰 것부터 나온다', () => {
  const parts = breakdownMetric(SUM, RECORDS, FM, 'system')
  assert.deepEqual(parts.map((p) => p.key), ['auth', 'pay', 'rpt'])
  assert.deepEqual(parts.map((p) => p.count), [30, 15, 0])
})

test('분해 — 레코드는 있는데 값이 0인 차원도 남는다', () => {
  /*
   * 리포트 시스템에는 요청이 있고 오류만 0입니다. 조각을 빼버리면
   * "리포트는 오류가 없다" 와 "리포트라는 게 아예 없다" 를 구별할 수
   * 없습니다. 앞엣것은 좋은 소식이고 뒤엣것은 데이터 문제입니다.
   */
  const parts = breakdownMetric(SUM, RECORDS, FM, 'system')
  const rpt = parts.find((p) => p.key === 'rpt')
  assert.ok(rpt, '레코드가 있는 차원이 사라졌습니다')
  assert.equal(rpt.count, 0)
  assert.equal(rpt.recordCount, 1, '레코드 수는 따로 남아 있어야 합니다')
})

test('분해 — 비율의 합은 100% 다', () => {
  const parts = breakdownMetric(SUM, RECORDS, FM, 'system')
  const share = parts.reduce((acc, p) => acc + p.share, 0)
  assert.ok(Math.abs(share - 100) < 0.5, `비율 합이 ${share}% 입니다`)
})

test('분해 — 각 조각이 자기 조건을 들고 있다 (클릭하면 그 목록으로)', () => {
  const [top] = breakdownMetric(SUM, RECORDS, FM, 'system')
  assert.ok(top.query, '조각에 질의가 없으면 드릴다운을 만들 수 없습니다')
  assert.deepEqual(top.query.conditions.at(-1), { field: 'system', operator: 'in', value: ['auth'] })
})

test('분해 — 없는 차원을 주면 빈 배열 (throw 하지 않는다)', () => {
  assert.deepEqual(breakdownMetric(SUM, RECORDS, FM, '없는필드'), [])
})

test('thresholdState — 임계값을 넘으면 상태가 바뀐다', () => {
  /* 반환값은 ok / warn / danger 입니다. MetricTile 이 이 이름으로
     배지 색과 스파크라인 색을 고릅니다 — 이름이 갈라지면 색이 안 붙습니다. */
  const metric = { threshold: { warn: 20, danger: 40 } }
  assert.equal(thresholdState(10, metric), 'ok')
  assert.equal(thresholdState(25, metric), 'warn')
  assert.equal(thresholdState(50, metric), 'danger')
})

test('thresholdState — lowerIsBetter=false 면 부등호가 뒤집힌다', () => {
  /* 가동률처럼 **낮을수록 나쁜** 지표가 있습니다. 목표 95% 아래면 경고입니다. */
  const uptime = { threshold: { warn: 95, danger: 90 }, lowerIsBetter: false }
  assert.equal(thresholdState(99, uptime), 'ok')
  assert.equal(thresholdState(93, uptime), 'warn')
  assert.equal(thresholdState(80, uptime), 'danger')
})

test('thresholdState — 임계값이 없으면 항상 ok', () => {
  assert.equal(thresholdState(9999, {}), 'ok')
})

test('compareMetric — 이전 기간과의 증감을 낸다', () => {
  /* 첫 인자는 **현재 값(숫자)** 입니다. 지표 객체가 아닙니다. */
  const current = computeMetric(SUM, RECORDS, FM).value
  const cmp = compareMetric(current, [{ id: 'X', system: 'pay', errors: 30 }], SUM, FM)
  assert.equal(cmp.previous, 30)
  assert.equal(cmp.delta, 50, '30 → 45 는 +50% 입니다')
})

test('compareMetric — 이전 값이 0이어도 Infinity 가 나오지 않는다', () => {
  /* 0 으로 나누면 화면에 "Infinity%" 가 찍힙니다 */
  const cmp = compareMetric(computeMetric(SUM, RECORDS, FM).value, [], SUM, FM)
  assert.equal(cmp.previous, 0)
  assert.ok(Number.isFinite(cmp.delta), `delta 가 ${cmp.delta} 입니다`)
})

test('compareMetric — 둘 다 0이면 변동 없음', () => {
  const cmp = compareMetric(0, [], SUM, FM)
  assert.equal(cmp.delta, 0)
})
