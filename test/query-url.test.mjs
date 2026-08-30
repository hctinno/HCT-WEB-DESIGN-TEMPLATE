import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeFields, fieldMap } from '../src/lib/fields.js'
import { emptyQuery } from '../src/lib/query.js'
import { encodeQuery, decodeQuery, queryToUrl } from '../src/lib/queryUrl.js'

const FM = fieldMap(normalizeFields([
  { key: 'title', label: '제목', type: 'text' },
  { key: 'n', label: '수', type: 'number' },
  { key: 'done', label: '완료', type: 'checkbox' },
  { key: 'status', label: '상태', type: 'select', options: [
    { value: 'open', label: '열림' }, { value: 'a,b', label: '쉼표가 든 값' },
  ] },
]))

const Q = (o) => ({ ...emptyQuery(), ...o })
const roundTrip = (query) => decodeQuery(encodeQuery(query), FM)

test('빈 질의는 빈 문자열이 된다 (링크가 지저분해지지 않게)', () => {
  assert.equal(encodeQuery(emptyQuery()), '')
  assert.deepEqual(decodeQuery('', FM), emptyQuery())
})

test('사람이 읽을 수 있는 형식을 유지한다', () => {
  /*
   * JSON 을 base64 로 넣는 편이 구현은 쉽지만, 링크를 보고 무엇이 걸렸는지
   * 알 수 없고 손으로 고칠 수도 없습니다. 관리도구에서는 그게 손해입니다.
   */
  const url = encodeQuery(Q({
    search: '결제',
    conditions: [{ field: 'status', operator: 'in', value: ['open'] }],
    sort: [{ field: 'n', direction: 'desc' }],
    groupBy: 'status',
  }))
  assert.ok(url.includes('f=status:in:open'), `구조가 안 보입니다: ${url}`)
  assert.ok(url.includes('s=n:desc'))
  assert.ok(url.includes('g=status'))
})

test('왕복 — 조건·정렬·그룹·검색어가 그대로 돌아온다', () => {
  const q = Q({
    search: '결제 실패',
    conditions: [
      { field: 'status', operator: 'in', value: ['open'] },
      { field: 'n', operator: 'gte', value: 100 },
    ],
    sort: [{ field: 'n', direction: 'desc' }],
    groupBy: 'status',
    match: 'any',
  })
  assert.deepEqual(roundTrip(q), q)
})

/*
 * 아래가 이 파일의 핵심입니다.
 *
 * 회귀: 값 안에 구분자(: ; ,)가 들어가면 링크가 조용히 다른 뜻이 됐습니다.
 *
 *   "10:30" → f=title:eq:10%3A30 → 읽을 때 "10" 으로 잘림
 *   "a;b"   → 조건이 두 개로 쪼개짐
 *   "a,b"   → 단일 값이 배열이 됨
 *
 * 원인은 인코딩이 아니라 **푸는 순서**였습니다. URLSearchParams.get() 이
 * 쪼개기 전에 값을 통째로 풀어버려서, 값 안의 %3A 가 구조 구분자와
 * 구별되지 않았습니다.
 *
 * "링크를 보냈는데 상대가 다른 데이터를 본다" 는 관리도구에서 가장 나쁜
 * 종류의 버그입니다 — 틀렸다는 것조차 알 수 없습니다.
 */
const TRICKY = [
  ['쉼표', 'a,b'],
  ['세미콜론', 'a;b'],
  ['콜론(시각)', '10:30'],
  ['구분자 전부', 'a:b;c,d'],
  ['앰퍼샌드', 'a&b'],
  ['등호', 'a=b'],
  ['공백', 'a b'],
  ['한글', '결제 실패'],
  ['더하기', 'a+b'],
  ['퍼센트', '50%'],
  ['퍼센트 이스케이프처럼 생긴 글자', 'a%3Ab'],
  ['빈 문자열', ''],
]

for (const [name, value] of TRICKY) {
  test(`회귀: 값에 ${name} 이 있어도 왕복한다`, () => {
    const q = Q({ conditions: [{ field: 'title', operator: 'eq', value }] })
    assert.deepEqual(roundTrip(q).conditions[0].value, value)
  })

  test(`회귀: 검색어에 ${name} 이 있어도 왕복한다`, () => {
    assert.equal(roundTrip(Q({ search: value })).search, value)
  })
}

test('회귀: in 목록의 값에 쉼표가 있어도 항목이 늘어나지 않는다', () => {
  /* 목록 구분자와 값 안의 쉼표가 섞이면 조건이 조용히 넓어집니다 */
  const q = Q({ conditions: [{ field: 'status', operator: 'in', value: ['open', 'a,b'] }] })
  assert.deepEqual(roundTrip(q).conditions[0].value, ['open', 'a,b'])
})

test('타입이 복원된다 — 숫자가 문자열로 살아나지 않는다', () => {
  /*
   * "100" 으로 살아나면 저장된 뷰와 링크로 연 뷰가 미묘하게 다른 객체가
   * 되고, gte 비교가 문자열 비교로 바뀌어 결과가 달라집니다.
   */
  const back = roundTrip(Q({ conditions: [{ field: 'n', operator: 'gte', value: 100 }] }))
  assert.strictEqual(back.conditions[0].value, 100)
})

test('타입이 복원된다 — 체크박스는 불리언', () => {
  const back = roundTrip(Q({ conditions: [{ field: 'done', operator: 'eq', value: true }] }))
  assert.strictEqual(back.conditions[0].value, true)
})

test('손으로 고친 링크가 화면을 깨뜨리지 않는다', () => {
  /* 사람이 URL 을 편집하는 것이 이 형식의 목적입니다. 망가진 입력도 견뎌야 합니다. */
  for (const broken of ['f=', 'f=title', 'f=:eq:x', 'f=title::', 's=', 's=:asc', 'g=', '&&&', 'q']) {
    assert.doesNotThrow(() => decodeQuery(broken, FM), `"${broken}" 에서 던졌습니다`)
  }
})

test('스키마에 없는 필드는 걸러낸다', () => {
  /* 옛 링크가 사라진 필드를 가리켜도 나머지 조건은 살아야 합니다 */
  const back = decodeQuery('f=없는필드:eq:x;title:eq:결제&s=없는필드:asc&g=없는필드', FM)
  assert.deepEqual(back.conditions.map((c) => c.field), ['title'])
  assert.deepEqual(back.sort, [])
  assert.equal(back.groupBy, null)
})

test('앞의 물음표를 붙여 넘겨도 읽는다', () => {
  /* location.search 를 그대로 넘기는 실수가 흔합니다 */
  assert.equal(decodeQuery('?q=결제', FM).search, '결제')
})

test('URLSearchParams 를 넘기면 콘솔로 알려준다', () => {
  /*
   * 이 경우 값이 이미 풀린 뒤라 값 안의 구분자를 복원할 수 없습니다.
   * 조용히 틀린 결과를 주는 대신 무엇이 문제인지 말합니다.
   */
  let warned = false
  const noisy = console.warn
  console.warn = () => { warned = true }
  try {
    decodeQuery(new URLSearchParams('q=결제'), FM)
  } finally {
    console.warn = noisy
  }
  assert.ok(warned, 'URLSearchParams 를 받고도 아무 말이 없었습니다')
})

/* ── 남의 파라미터 ────────────────────────────────────────────── */

test('회귀: 질의와 무관한 파라미터를 지우지 않는다', () => {
  /*
   * 예전에는 검색 문자열을 통째로 갈아치웠습니다. 그래서 필터를 한 번
   * 건드리면 탭 상태(`?tab=activity`)나 초대 토큰 같은 것이 조용히
   * 사라졌습니다. 미리보기에서도 `?page=list` 가 마운트 직후 없어졌습니다.
   *
   * 사라진 것을 알아채기가 매우 어렵습니다 — 오류도 안 나고, 다음 새로고침에
   * 가서야 "왜 다른 화면이 뜨지" 가 됩니다.
   */
  const url = queryToUrl(Q({ search: '결제' }), 'https://x.test/list?tab=activity&page=2')
  assert.ok(url.includes('tab=activity'), `tab 이 사라졌습니다: ${url}`)
  assert.ok(url.includes('page=2'), `page 가 사라졌습니다: ${url}`)
  assert.ok(url.includes('q=%EA%B2%B0%EC%A0%9C') || url.includes('q=결제'), `질의가 안 붙었습니다: ${url}`)
})

test('질의를 비우면 우리 파라미터만 빠지고 남의 것은 남는다', () => {
  const url = queryToUrl(emptyQuery(), 'https://x.test/list?tab=activity&q=옛검색&f=a:eq:b')
  assert.ok(url.includes('tab=activity'))
  assert.ok(!url.includes('q='), `옛 질의가 남았습니다: ${url}`)
  assert.ok(!url.includes('f='), `옛 조건이 남았습니다: ${url}`)
})

test('같은 질의를 두 번 넣어도 파라미터가 중복되지 않는다', () => {
  const once = queryToUrl(Q({ search: 'a' }), 'https://x.test/l')
  const twice = queryToUrl(Q({ search: 'a' }), once)
  assert.equal(once, twice, `두 번 적용하니 달라졌습니다:\n  ${once}\n  ${twice}`)
})

test('남의 파라미터는 원래 모양 그대로 둔다', () => {
  /* URLSearchParams 로 다시 만들면 남의 값까지 재인코딩해 링크가 바뀝니다 */
  const url = queryToUrl(emptyQuery(), 'https://x.test/l?redirect=https%3A%2F%2Fa.test%2Fb')
  assert.ok(url.includes('redirect=https%3A%2F%2Fa.test%2Fb'), `남의 값이 바뀌었습니다: ${url}`)
})
