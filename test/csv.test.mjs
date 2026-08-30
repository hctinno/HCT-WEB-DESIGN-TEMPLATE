import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseCsv, toTable } from '../src/lib/csv.js'

/*
 * 이 파서는 "여기까지만 한다" 를 문서로 밝히고 있습니다.
 * 그 약속이 실제로 지켜지는지를 테스트합니다 — 능력을 과장한 파서가
 * 조용히 틀린 값을 만드는 것이 가장 나쁩니다.
 */

test('기본 — 쉼표 구분', () => {
  assert.deepEqual(parseCsv('a,b,c\n1,2,3'), [['a', 'b', 'c'], ['1', '2', '3']])
})

test('따옴표 안의 쉼표는 구분자가 아니다', () => {
  assert.deepEqual(parseCsv('name,note\n김민수,"결제, 인증 담당"'),
                   [['name', 'note'], ['김민수', '결제, 인증 담당']])
})

test('따옴표 안의 줄바꿈은 행을 끊지 않는다', () => {
  assert.deepEqual(parseCsv('a,b\n1,"두 줄\n짜리"'),
                   [['a', 'b'], ['1', '두 줄\n짜리']])
})

test('"" 는 따옴표 한 개로 풀린다', () => {
  assert.deepEqual(parseCsv('a\n"그는 ""좋다"" 고 했다"'),
                   [['a'], ['그는 "좋다" 고 했다']])
})

test('CRLF 를 처리한다', () => {
  assert.deepEqual(parseCsv('a,b\r\n1,2\r\n'), [['a', 'b'], ['1', '2']])
})

test('UTF-8 BOM 을 먹지 않는다', () => {
  /* 엑셀이 저장한 CSV 는 BOM 으로 시작합니다. 안 떼면 첫 머리글이
     "﻿id" 가 되어 열 연결이 통째로 어긋납니다. */
  const [head] = parseCsv('﻿id,name\n1,김')
  assert.deepEqual(head, ['id', 'name'])
})

test('끝에 붙은 빈 줄을 버린다', () => {
  /* 엑셀이 자주 남깁니다. 안 버리면 빈 행이 "필수값 없음" 오류로 나옵니다. */
  assert.deepEqual(parseCsv('a,b\n1,2\n\n\n'), [['a', 'b'], ['1', '2']])
})

test('빈 문자열은 빈 표', () => {
  assert.deepEqual(parseCsv(''), [])
  assert.deepEqual(toTable(''), { headers: [], rows: [] })
})

test('toTable — 줄 번호는 CSV 파일 기준이다', () => {
  /*
   * 오류를 "3번째 행" 이 아니라 "4번째 줄" 로 말해야 사용자가 파일에서
   * 찾습니다. 머리글이 1줄이므로 첫 데이터 행은 2줄입니다.
   */
  const { rows } = toTable('id,name\nA,김\nB,이')
  assert.deepEqual(rows.map((r) => r.line), [2, 3])
})

test('toTable — 열 개수가 다른 줄은 버리지 않고 표시한다', () => {
  /*
   * 조용히 버리면 사용자는 왜 100행 중 97행만 들어왔는지 알 수 없습니다.
   * 넘기되 ragged 로 표시해서 검증 단계가 오류로 말하게 합니다.
   */
  const { rows } = toTable('id,name,team\nA,김,운영\nB,이')
  assert.deepEqual(rows.map((r) => r.ragged), [false, true])
  assert.equal(rows.length, 2, '짧은 줄이 사라졌습니다')
})

test('toTable — 머리글의 앞뒤 공백을 떼낸다', () => {
  const { headers } = toTable(' id , name \nA,김')
  assert.deepEqual(headers, ['id', 'name'])
})
