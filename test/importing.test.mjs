import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeFields } from '../src/lib/fields.js'
import { toTable } from '../src/lib/csv.js'
import { guessMapping, validateRows } from '../src/lib/importing.js'

const FIELDS = normalizeFields([
  { key: 'id', label: 'ID', type: 'text', required: true },
  { key: 'title', label: '제목', type: 'text', required: true },
  { key: 'errors', label: '오류', type: 'number' },
  { key: 'status', label: '상태', type: 'select', options: [
    { value: 'open', label: '열림' }, { value: 'done', label: '완료' },
  ] },
])

const check = (csv, { mapping, existingIds = [] } = {}) => {
  const { headers, rows } = toTable(csv)
  return validateRows({
    headers, rows, fields: FIELDS, existingIds,
    mapping: mapping ?? guessMapping(headers, FIELDS),
  })
}

test('guessMapping — 라벨과 key 양쪽으로 열을 찾는다', () => {
  /* 사람이 만든 CSV 는 머리글이 "제목" 이기도 하고 "title" 이기도 합니다 */
  const byLabel = guessMapping(['ID', '제목', '오류'], FIELDS)
  assert.deepEqual(Object.values(byLabel), ['id', 'title', 'errors'])

  const byKey = guessMapping(['id', 'title', 'errors'], FIELDS)
  assert.deepEqual(Object.values(byKey), ['id', 'title', 'errors'])
})

test('guessMapping — 모르는 열은 연결하지 않는다 (아무 데나 붙이지 않는다)', () => {
  const m = guessMapping(['id', '알수없는열'], FIELDS)
  assert.equal(m[0], 'id')
  assert.ok(!m[1], '모르는 열이 임의의 필드에 붙었습니다')
})

test('멀쩡한 파일은 전부 통과한다', () => {
  const r = check('id,title,errors\nA-1,결제 오류,3\nA-2,인증 지연,0')
  assert.equal(r.summary.total, 2)
  assert.equal(r.summary.ok, 2)
  assert.equal(r.summary.failed, 0)
  assert.deepEqual(r.rows[0].values, { id: 'A-1', title: '결제 오류', errors: 3 })
})

test('숫자 열에 글자가 오면 그 행만 실패한다', () => {
  /* 파일 전체를 거절하면 사용자는 한 줄 고치려고 처음부터 다시 합니다 */
  const r = check('id,title,errors\nA-1,결제,3\nA-2,인증,셋')
  assert.equal(r.summary.ok, 1)
  assert.equal(r.summary.failed, 1)
  assert.equal(r.rows[1].errors.length, 1)
})

test('선택지에 없는 값은 오류다', () => {
  const r = check('id,title,status\nA-1,결제,open\nA-2,인증,없는상태')
  assert.equal(r.summary.failed, 1)
  assert.ok(r.rows[1].errors[0].includes('없는상태'),
            `오류 문구가 무엇이 잘못됐는지 말하지 않습니다: ${r.rows[1].errors[0]}`)
})

test('필수 필드가 연결되지 않으면 행을 보기 전에 알려준다', () => {
  /*
   * 행마다 "제목 없음" 을 100번 찍는 대신, 열 연결 단계에서 한 번 말합니다.
   * 고칠 곳이 행이 아니라 연결이기 때문입니다.
   */
  const { headers, rows } = toTable('id,errors\nA-1,3')
  const r = validateRows({ headers, rows, fields: FIELDS, mapping: { 0: 'id', 1: 'errors' } })
  assert.deepEqual(r.summary.missingRequired, ['제목'])
})

test('한 필드에 두 열을 연결하면 알려준다', () => {
  /* 어느 쪽이 이기는지 알 수 없는 상태로 가져오면 안 됩니다 */
  const { headers, rows } = toTable('id,title,title2\nA-1,결제,결제2')
  const r = validateRows({ headers, rows, fields: FIELDS, mapping: { 0: 'id', 1: 'title', 2: 'title' } })
  assert.deepEqual(r.summary.duplicated, ['제목'])
})

test('열 개수가 다른 줄은 오류로 잡는다', () => {
  const r = check('id,title,errors\nA-1,결제,3\nA-2,인증')
  assert.equal(r.summary.failed, 1)
  assert.ok(r.rows[1].errors[0].includes('열 개수'))
})

test('같은 파일 안의 중복 ID 는 오류다', () => {
  /* 파일 자체의 문제이므로 "이미 있는 항목" 정책과 다르게 다뤄야 합니다 */
  const r = check('id,title\nA-1,결제\nA-1,결제 재시도')
  assert.equal(r.summary.failed, 1)
  assert.ok(r.rows[1].errors[0].includes('A-1'))
})

test('이미 있는 ID 는 오류가 아니라 정책의 대상이다', () => {
  /*
   * 덮어쓸지 건너뛸지는 사용자가 정합니다. 오류로 처리해서 막아버리면
   * 갱신용 가져오기를 아예 할 수 없습니다.
   */
  const r = check('id,title\nA-1,결제\nA-2,인증', { existingIds: ['A-1'] })
  assert.equal(r.summary.failed, 0)
  assert.equal(r.summary.duplicates, 1)
  assert.equal(r.rows[0].duplicate, true)
  assert.equal(r.rows[1].duplicate, false)
})

test('오류가 있는 행은 중복 집계에 넣지 않는다', () => {
  /* 고쳐야 하는 행을 "이미 있는 항목" 으로도 세면 숫자가 겹칩니다 */
  const r = check('id,title,errors\nA-1,결제,셋', { existingIds: ['A-1'] })
  assert.equal(r.summary.failed, 1)
  assert.equal(r.summary.duplicates, 0)
})

test('집계는 서로 맞는다 — total = ok + failed', () => {
  const r = check('id,title,errors\nA-1,결제,3\nA-2,인증,셋\nA-3,리포트,1')
  assert.equal(r.summary.total, r.summary.ok + r.summary.failed)
})
