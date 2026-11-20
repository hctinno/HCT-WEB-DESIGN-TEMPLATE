import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { CARDS, STATE_KEYS, checkCards, objectKeys, signatureDefault } from '../scripts/component-cards.mjs'
import { parseCss, declaredNames } from '../scripts/css-vars.mjs'

/*
 * DESIGN.md §7 의 부품 카드가 컴포넌트 소스와 어긋나지 않는지.
 * 카드 HTML + CSS 가 실제 React 컴포넌트와 같게 그려지는지는 audit:cards(브라우저)가 봅니다.
 */

const read = (p) => readFileSync(p, 'utf8')
const ctx = {
  read,
  exists: existsSync,
  tokens: new Set(declaredNames(parseCss(read('src/styles/tokens.css') + '\n' + read('src/styles/palettes.css')))),
  entry: read('src/components/index.js'),
}
const clone = () => structuredClone(CARDS)

test('모든 카드가 소스 · 토큰 · 진입점과 맞는다', () => {
  assert.deepEqual(checkCards(ctx), [])
})

test('§7 의 모든 부품 제목에 카드가 하나씩 있다', () => {
  const tpl = read('scripts/design-md.template.md')
  const sec = tpl.slice(tpl.indexOf('## 7. 부품 규격'), tpl.indexOf('## 8.'))
  const headings = [...sec.matchAll(/^### (.+)$/gm)].map((m) => m[1])
  assert.deepEqual(headings, CARDS.map((c) => c.heading))
  for (const c of CARDS) assert.ok(sec.includes(`### ${c.heading}\n\n{{CARD:${c.id}}}`), c.id)
})

test('카드마다 상태 7가지가 모두 있다', () => {
  for (const c of CARDS) assert.deepEqual(Object.keys(c.states).sort(), [...STATE_KEYS].sort(), c.id)
})

test('소스에 종류가 늘면 실패한다 — 카드에서 하나를 빼서 확인', () => {
  const cards = clone()
  delete cards.find((c) => c.id === 'button').props[0].notes.ghost
  assert.ok(checkCards(ctx, cards).some((p) => p.includes('소스에 있는데 카드에 없음: ghost')))
})

test('카드에만 있는 종류는 실패한다', () => {
  const cards = clone()
  cards.find((c) => c.id === 'button').props[1].notes.xl = '40px'
  assert.ok(checkCards(ctx, cards).some((p) => p.includes('카드에 있는데 소스에 없음: xl')))
})

test('기본값이 소스와 다르면 실패한다', () => {
  const cards = clone()
  cards.find((c) => c.id === 'button').props[0].default = 'primary'
  assert.ok(checkCards(ctx, cards).some((p) => p.includes('variant 기본값')))
})

test('없는 토큰 · 직접 쓴 색 · px 글자 크기는 실패한다', () => {
  const cards = clone()
  const b = cards.find((c) => c.id === 'badge')
  b.tokens.push('--color-not-a-token')
  b.css += '\n.x { color: #123456; font-size: 12px; }'
  const problems = checkCards(ctx, cards)
  assert.ok(problems.some((p) => p.includes('없는 토큰 --color-not-a-token')))
  assert.ok(problems.some((p) => p.includes('색 값을 직접')))
  assert.ok(problems.some((p) => p.includes('rem')))
})

test('React 예가 진입점에 없는 이름을 import 하면 실패한다', () => {
  const cards = clone()
  cards.find((c) => c.id === 'input').react = "import { TextInput } from 'hct-web-design-template'"
  assert.ok(checkCards(ctx, cards).some((p) => p.includes('TextInput')))
})

test('objectKeys 는 맨 위 키만 · 따옴표 키도 읽는다', () => {
  const src = `const V = {\n  /** 주석: x */\n  a: 'p hover:q',\n  'b-c': { d: 1 },\n  e:\n    'f',\n}`
  assert.deepEqual(objectKeys(src, 'V'), ['a', 'b-c', 'e'])
})

test('signatureDefault 는 기본값 속 괄호에 속지 않는다', () => {
  const src = `export function F({ onX = () => {}, size = 'md' }) {}`
  assert.equal(signatureDefault(src, 'F', 'size'), 'md')
})
