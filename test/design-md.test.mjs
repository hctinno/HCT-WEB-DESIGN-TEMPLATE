import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseCss, computeRootVars, declaredNames } from '../scripts/css-vars.mjs'

/*
 * DESIGN.md 의 색 값은 css-vars.mjs 가 브라우저 없이 계산합니다.
 * 이 계산이 조용히 틀리면 md 를 받은 모든 화면이 함께 틀립니다.
 * (브라우저와 같은 답인지는 a11y 잡의 audit:design-md 가 따로 검산합니다.)
 */

const repoRules = parseCss(
  readFileSync('src/styles/tokens.css', 'utf8') + '\n' + readFileSync('src/styles/palettes.css', 'utf8'),
)
const SEMANTIC = declaredNames(repoRules).filter((n) => !n.startsWith('--hct-'))
const LIGHT = computeRootVars(repoRules)
const DARK = computeRootVars(repoRules, { attrs: { 'data-theme': 'dark' } })
const sameAll = (a, b) => SEMANTIC.filter((n) => a.get(n) !== b.get(n))

test('저장소의 모든 시맨틱 토큰이 var() 없이 끝까지 풀린다', () => {
  assert.ok(SEMANTIC.length > 50, `토큰이 너무 적습니다: ${SEMANTIC.length}`)
  for (const values of [LIGHT, DARK]) {
    for (const n of SEMANTIC) {
      const v = values.get(n)
      assert.ok(v, `${n} 값이 비어 있습니다`)
      assert.ok(!v.includes('var('), `${n} 에 var() 가 남았습니다: ${v}`)
    }
  }
})

test('운영체제 다크와 data-theme="dark" 는 같은 값이다', () => {
  /* md 는 두 다크 블록에 같은 값을 싣습니다 — 저장소에서 갈라지면 md 가 거짓말이 됩니다 */
  assert.deepEqual(sameAll(computeRootVars(repoRules, { osDark: true }), DARK), [])
})

test('data-theme="light" 는 운영체제 다크를 이긴다', () => {
  assert.deepEqual(sameAll(computeRootVars(repoRules, { osDark: true, attrs: { 'data-theme': 'light' } }), LIGHT), [])
  assert.equal(computeRootVars(repoRules, { osDark: true, attrs: { 'data-theme': 'light' } }).get('color-scheme'), 'light')
  assert.equal(DARK.get('color-scheme'), 'dark')
})

test('속성을 안 붙이면 기본 팔레트(hct)와 같다', () => {
  assert.deepEqual(sameAll(computeRootVars(repoRules, { attrs: { 'data-palette': 'hct' } }), LIGHT), [])
})

test('팔레트마다 주 버튼 색은 원본의 강조색 600 이다', () => {
  const palettes = JSON.parse(readFileSync('tokens/palettes.json', 'utf8'))
  for (const [id, p] of Object.entries(palettes)) {
    if (id.startsWith('$')) continue
    const v = computeRootVars(repoRules, { attrs: { 'data-palette': id } })
    assert.equal(v.get('--color-accent-solid'), p.light.accent['600'], id)
  }
})

/* ── 캐스케이드 규칙 자체 ───────────────────────────────────── */

const vars = (css, env) => computeRootVars(parseCss(css), env)

test('명시도가 높은 선택자가 뒤에 나온 낮은 선택자를 이긴다', () => {
  const css = ':root[data-x] { --a: 1; } :root { --a: 2; }'
  assert.equal(vars(css, { attrs: { 'data-x': '' } }).get('--a'), '1')
  assert.equal(vars(css).get('--a'), '2')
})

test('명시도가 같으면 나중에 나온 것이 이긴다', () => {
  assert.equal(vars(':root { --a: 1; } :root { --a: 2; }').get('--a'), '2')
})

test(':not() 의 명시도는 안쪽 선택자의 것이다', () => {
  /* (0,2,0) 대 (0,2,0) — 같으니 나중 것이 이깁니다 */
  const css = ':root:not([data-theme="light"]) { --a: dark; } :root[data-theme="dark"] { --a: forced; }'
  assert.equal(vars(css, { attrs: { 'data-theme': 'dark' } }).get('--a'), 'forced')
  assert.equal(vars(css).get('--a'), 'dark')
  assert.equal(vars(css, { attrs: { 'data-theme': 'light' } }).get('--a'), undefined)
})

test('prefers-color-scheme 블록은 운영체제 설정에서만 걸린다', () => {
  const css = ':root { --a: light; } @media (prefers-color-scheme: dark) { :root { --a: dark; } }'
  assert.equal(vars(css).get('--a'), 'light')
  assert.equal(vars(css, { osDark: true }).get('--a'), 'dark')
})

test('var() 대체값과 중첩을 푼다', () => {
  const css = ':root { --b: rgb(1 2 3 / 0.5); --a: var(--없음, var(--b)); --c: 0 1px var(--a), 0 0 1px var(--b); }'
  const v = vars(css)
  assert.equal(v.get('--a'), 'rgb(1 2 3 / 0.5)')
  assert.equal(v.get('--c'), '0 1px rgb(1 2 3 / 0.5), 0 0 1px rgb(1 2 3 / 0.5)')
})

test('줄바꿈이 섞인 값은 공백 하나로 정리한다', () => {
  assert.equal(vars(':root { --f: "A B", a,\n    b; }').get('--f'), '"A B", a, b')
})

test('모르는 문법을 만나면 추측하지 않고 멈춘다', () => {
  /* 조용히 틀린 값을 내는 것보다 생성이 실패하는 편이 낫습니다 */
  assert.throws(() => parseCss('.btn { --a: 1; }'), /지원하지 않는 선택자/)
  assert.throws(() => parseCss(':root .x { --a: 1; }'), /지원하지 않는 선택자/)
  assert.throws(() => parseCss('@supports (display: grid) { :root { --a: 1; } }'), /지원하지 않는 규칙/)
  assert.throws(() => parseCss(':root { --a: 1 !important; }'), /!important/)
  assert.throws(() => vars(':root { --a: var(--b); --b: var(--a); }'), /순환/)
  assert.throws(() => vars(':root { --a: var(--없음); }'), /정의되지 않은 변수/)
})
