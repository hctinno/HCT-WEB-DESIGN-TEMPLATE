import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeFields, fieldMap } from '../src/lib/fields.js'
import { applyQuery, emptyQuery, toggleSort, groupRecords, isQueryActive } from '../src/lib/query.js'

const FIELDS = normalizeFields([
  { key: 'id', label: 'ID', type: 'text' },
  { key: 'title', label: '제목', type: 'text' },
  { key: 'status', label: '상태', type: 'select', options: [
    { value: 'open', label: '열림' }, { value: 'done', label: '완료' },
  ] },
  { key: 'errors', label: '오류', type: 'number' },
  { key: 'tags', label: '태그', type: 'tags' },
  { key: 'due', label: '기한', type: 'date' },
])
const FM = fieldMap(FIELDS)

const RECORDS = [
  { id: 'R-1', title: '결제 실패',   status: 'open', errors: 12, tags: ['긴급'],        due: '2026-07-01' },
  { id: 'R-2', title: '로그인 지연', status: 'done', errors: 0,  tags: ['성능', '긴급'], due: '2026-05-01' },
  { id: 'R-3', title: '리포트 누락', status: 'open', errors: 3,  tags: [],              due: null },
]

const q = (conditions, extra = {}) => ({ ...emptyQuery(), conditions, ...extra })
const ids = (rows) => rows.map((r) => r.id)

test('조건이 없으면 전부 통과한다', () => {
  assert.deepEqual(ids(applyQuery(RECORDS, emptyQuery(), FM)), ['R-1', 'R-2', 'R-3'])
})

test('eq · neq', () => {
  assert.deepEqual(ids(applyQuery(RECORDS, q([{ field: 'status', operator: 'eq', value: 'open' }]), FM)), ['R-1', 'R-3'])
  assert.deepEqual(ids(applyQuery(RECORDS, q([{ field: 'status', operator: 'neq', value: 'open' }]), FM)), ['R-2'])
})

test('숫자 비교 — 0 은 값이 없는 것과 다르다', () => {
  /* 0건을 "값 없음" 으로 취급하면 gte 0 이 R-2 를 빠뜨립니다 */
  assert.deepEqual(ids(applyQuery(RECORDS, q([{ field: 'errors', operator: 'gte', value: 0 }]), FM)),
                   ['R-1', 'R-2', 'R-3'])
  assert.deepEqual(ids(applyQuery(RECORDS, q([{ field: 'errors', operator: 'gt', value: 2 }]), FM)),
                   ['R-1', 'R-3'])
})

test('in — select 는 값 자체를, tags 는 겹침을 본다', () => {
  assert.deepEqual(ids(applyQuery(RECORDS, q([{ field: 'status', operator: 'in', value: ['open'] }]), FM)),
                   ['R-1', 'R-3'])
  /* 태그는 배열이므로 하나라도 겹치면 통과해야 합니다 */
  assert.deepEqual(ids(applyQuery(RECORDS, q([{ field: 'tags', operator: 'in', value: ['긴급'] }]), FM)),
                   ['R-1', 'R-2'])
})

test('contains 는 대소문자를 가리지 않는다', () => {
  const rows = applyQuery(RECORDS, q([{ field: 'title', operator: 'contains', value: '결제' }]), FM)
  assert.deepEqual(ids(rows), ['R-1'])
})

test('isEmpty · isNotEmpty', () => {
  assert.deepEqual(ids(applyQuery(RECORDS, q([{ field: 'due', operator: 'isEmpty' }]), FM)), ['R-3'])
  assert.deepEqual(ids(applyQuery(RECORDS, q([{ field: 'due', operator: 'isNotEmpty' }]), FM)), ['R-1', 'R-2'])
})

test('조건 여러 개는 AND 로 묶인다', () => {
  const rows = applyQuery(RECORDS, q([
    { field: 'status', operator: 'eq', value: 'open' },
    { field: 'errors', operator: 'gt', value: 5 },
  ]), FM)
  assert.deepEqual(ids(rows), ['R-1'])
})

test('회귀: 모르는 연산자는 아무것도 통과시키지 않는다', () => {
  /*
   * 예전에는 true 를 돌려줘서 오타 하나에 필터가 조용히 풀렸습니다.
   * 화면에는 "상태 = 열림" 칩이 붙어 있는데 실제로는 전체 목록이 나오고,
   * 사용자는 그게 걸러진 결과라고 믿고 일괄 작업을 겁니다.
   *
   * 조용히 틀린 것보다 시끄럽게 비어 있는 편이 낫습니다.
   */
  const noisy = console.error
  console.error = () => {}
  try {
    const rows = applyQuery(RECORDS, q([{ field: 'status', operator: '있지도-않은-연산자', value: 'open' }]), FM)
    assert.deepEqual(rows, [], '모르는 연산자인데 레코드가 통과했습니다')
  } finally {
    console.error = noisy
  }
})

test('스키마에서 사라진 필드를 가리키는 조건은 무시된다 (저장된 뷰가 죽지 않게)', () => {
  /*
   * 모르는 연산자와 반대로 다룹니다. 필드가 없어진 것은 **스키마 변경**이고,
   * 예전에 저장해둔 뷰가 그 필드를 가리키고 있을 수 있습니다. 여기서
   * 아무것도 안 보여주면 저장된 뷰가 통째로 죽습니다.
   */
  const noisy = console.error
  console.error = () => {}
  try {
    const rows = applyQuery(RECORDS, q([{ field: '없어진필드', operator: 'eq', value: 'x' }]), FM)
    assert.deepEqual(ids(rows), ['R-1', 'R-2', 'R-3'])
  } finally {
    console.error = noisy
  }
})

test('검색어는 여러 필드를 훑는다', () => {
  assert.deepEqual(ids(applyQuery(RECORDS, q([], { search: '지연' }), FM)), ['R-2'])
  assert.deepEqual(ids(applyQuery(RECORDS, q([], { search: 'R-3' }), FM)), ['R-3'])
})

test('정렬 — 오름차순이 실제로 정렬한다', () => {
  const rows = applyQuery(RECORDS, toggleSort(emptyQuery(), 'errors'), FM)
  assert.deepEqual(ids(rows), ['R-2', 'R-3', 'R-1'], '0 → 3 → 12 순이어야 합니다')
})

test('정렬 — 값이 없는 레코드는 뒤로 간다', () => {
  /*
   * null 이 맨 앞에 오면 "가장 빠른 기한" 을 보려던 사람이 빈 칸부터 봅니다.
   * 오름차순이든 내림차순이든 빈 값은 항상 끝에 있어야 합니다.
   */
  const asc = applyQuery(RECORDS, toggleSort(emptyQuery(), 'due'), FM)
  assert.equal(ids(asc).at(-1), 'R-3', '오름차순에서 빈 값이 끝이 아닙니다')

  const desc = applyQuery(RECORDS, toggleSort(toggleSort(emptyQuery(), 'due'), 'due'), FM)
  assert.equal(ids(desc).at(-1), 'R-3', '내림차순에서 빈 값이 끝이 아닙니다')
})

test('toggleSort — 없음 → 오름 → 내림 → 없음', () => {
  let query = emptyQuery()
  query = toggleSort(query, 'errors')
  assert.deepEqual(query.sort, [{ field: 'errors', direction: 'asc' }])
  query = toggleSort(query, 'errors')
  assert.deepEqual(query.sort, [{ field: 'errors', direction: 'desc' }])
  query = toggleSort(query, 'errors')
  assert.deepEqual(query.sort, [], '세 번 누르면 정렬이 해제되어야 합니다')
})

test('toggleSort — 다른 열을 누르면 그 열의 오름차순부터', () => {
  const query = toggleSort(toggleSort(emptyQuery(), 'errors'), 'title')
  assert.deepEqual(query.sort, [{ field: 'title', direction: 'asc' }])
})

test('회귀: toggleSort 에 query.sort 를 넘기면 원인을 말해준다', () => {
  /*
   * 감사 로그 화면이 `toggleSort(q.sort, key)` 로 부르고 있었습니다.
   * 그러면 query.sort 가 배열의 sort **메서드**가 되어
   * "sort.find is not a function" 이라는 알아보기 힘든 오류가 나면서
   * 정렬 헤더를 누르는 순간 화면이 죽었습니다.
   *
   * 무엇을 잘못 넘겼는지 말해주지 않는 오류는 고치는 데 오래 걸립니다.
   */
  assert.throws(
    () => toggleSort(emptyQuery().sort, 'errors'),
    /query.sort 가 아니라 query 를 넘기세요/,
  )
})

test('groupRecords — select 는 옵션 순서를 지키고 빈 그룹도 남긴다', () => {
  /*
   * 보드 뷰에서 "완료" 열이 비었다고 열 자체가 사라지면, 카드를 끌어다
   * 놓을 자리가 없어집니다. 그래서 비어 있어도 열은 남습니다.
   */
  const groups = groupRecords(RECORDS, FM.status)
  assert.deepEqual(groups.map((g) => g.key), ['open', 'done'])
  assert.deepEqual(groups.map((g) => g.records.length), [2, 1])
})

test('isQueryActive — 빈 질의는 활성이 아니다', () => {
  assert.equal(isQueryActive(emptyQuery()), false)
  assert.equal(isQueryActive(q([{ field: 'status', operator: 'eq', value: 'open' }])), true)
  assert.equal(isQueryActive(q([], { search: 'abc' })), true)
})
