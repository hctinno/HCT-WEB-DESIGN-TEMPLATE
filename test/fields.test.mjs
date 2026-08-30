import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeField, normalizeFields, fieldMap,
  comparableValue, isEmptyValue, formatRelative, formatDate,
  TYPE_OPERATORS,
} from '../src/lib/fields.js'

/* 시각을 고정합니다. "지금" 에 의존하는 테스트는 어느 날 갑자기 깨집니다. */
const NOW = new Date('2026-06-15T12:00:00Z').getTime()
const at = (offsetMs) => new Date(NOW + offsetMs).toISOString()
const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

test('formatRelative — 과거', () => {
  assert.equal(formatRelative(at(-30_000), NOW), '방금')
  assert.equal(formatRelative(at(-5 * MIN), NOW), '5분 전')
  assert.equal(formatRelative(at(-3 * HOUR), NOW), '3시간 전')
  assert.equal(formatRelative(at(-2 * DAY), NOW), '2일 전')
})

test('회귀: formatRelative 가 미래 날짜를 "방금" 으로 뭉개지 않는다', () => {
  /*
   * 예전에는 (now - t) 만 보고 음수를 0 취급해서, 만료가 9일 남았는데
   * "방금" 이라고 표시했습니다. 이미 만료된 것처럼 읽힙니다.
   * 만료일·기한·다음 실행은 관리도구에 흔한 값입니다.
   */
  assert.equal(formatRelative(at(5 * MIN), NOW), '5분 후')
  assert.equal(formatRelative(at(3 * HOUR), NOW), '3시간 후')
  assert.equal(formatRelative(at(2 * DAY), NOW), '2일 후')
  assert.equal(formatRelative(at(6 * DAY), NOW), '6일 후')
})

test('formatRelative — 일주일이 넘으면 상대시간 대신 날짜', () => {
  /* "37일 전" 은 감이 안 옵니다. 양쪽 모두 날짜로 떨어져야 합니다. */
  assert.equal(formatRelative(at(-30 * DAY), NOW), formatDate(at(-30 * DAY)))
  assert.equal(formatRelative(at(30 * DAY), NOW), formatDate(at(30 * DAY)))
})

test('formatRelative — 잘못된 값은 빈 문자열 (throw 하지 않는다)', () => {
  /* 목록 한 칸의 값이 이상하다고 화면 전체가 죽으면 안 됩니다. */
  assert.equal(formatRelative('이건 날짜가 아님', NOW), '')
  assert.equal(formatRelative(null, NOW), '')
  assert.equal(formatDate('아무거나'), '')
})

test('normalizeField — required 는 기본이 false', () => {
  /*
   * 기본값이 true 이면 스키마를 대충 적은 화면에서 만들기 폼이 전부
   * 필수가 되고, 가져오기가 멀쩡한 행을 오류로 떨굽니다.
   */
  const f = normalizeField({ key: 'note', label: '메모', type: 'text' })
  assert.equal(f.required, false)
  assert.equal(f.editable, true)
})

test('normalizeField — 명시한 값이 기본값을 이긴다', () => {
  const f = normalizeField({ key: 'id', label: 'ID', type: 'text', required: true, editable: false })
  assert.equal(f.required, true)
  assert.equal(f.editable, false)
})

test('normalizeField — 연산자는 타입에서 오고, 직접 넘긴 것은 무시된다', () => {
  /*
   * 연산자를 화면에서 바꿀 수 있으면 같은 타입이 화면마다 다른 필터를
   * 갖게 됩니다. 타입이 정합니다 — 그게 스키마가 먼저인 이유입니다.
   */
  const f = normalizeField({ key: 'n', label: '수', type: 'number', operators: ['eq'] })
  assert.deepEqual(f.operators, TYPE_OPERATORS.number)
})

test('normalizeField — 모르는 타입은 text 로 떨어진다 (throw 하지 않는다)', () => {
  const f = normalizeField({ key: 'x', label: 'X', type: '있지도-않은-타입' })
  assert.deepEqual(f.operators, TYPE_OPERATORS.text)
})

test('fieldMap — key 로 찾을 수 있다', () => {
  const fields = normalizeFields([
    { key: 'a', label: 'A', type: 'text' },
    { key: 'b', label: 'B', type: 'number' },
  ])
  const m = fieldMap(fields)
  assert.deepEqual(Object.keys(m), ['a', 'b'])
  assert.equal(m.b.type, 'number')
})

test('comparableValue — 타입별로 비교 가능한 원시값을 낸다', () => {
  const num = normalizeField({ key: 'n', label: 'N', type: 'number' })
  const date = normalizeField({ key: 'd', label: 'D', type: 'date' })
  const text = normalizeField({ key: 't', label: 'T', type: 'text' })

  assert.equal(comparableValue(num, '42'), 42)
  assert.equal(comparableValue(date, '2026-01-02T00:00:00Z'), Date.parse('2026-01-02T00:00:00Z'))
  assert.equal(comparableValue(text, 'Hello'), 'hello')
  /* 값이 없으면 null — 정렬에서 뒤로 밀 수 있어야 합니다 */
  assert.equal(comparableValue(num, null), null)
})

test('isEmptyValue — 0 과 false 는 "비어 있음" 이 아니다', () => {
  /*
   * 흔한 실수입니다. 0건·false 를 빈 값으로 치면 "비어 있음" 필터가
   * 멀쩡한 레코드를 잡아옵니다.
   */
  assert.equal(isEmptyValue(0), false)
  assert.equal(isEmptyValue(false), false)
  assert.equal(isEmptyValue(''), true)
  assert.equal(isEmptyValue(null), true)
  assert.equal(isEmptyValue(undefined), true)
  assert.equal(isEmptyValue([]), true)
})
