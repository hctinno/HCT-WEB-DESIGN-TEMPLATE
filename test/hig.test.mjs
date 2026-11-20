import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import preset from '../tailwind-preset.js'
import { buildAdaptive, CONTRAST_CHECKS, TOUCH_MIN, contrast } from '../scripts/build-adaptive.mjs'
import { parseCss, declaredNames } from '../scripts/css-vars.mjs'

/*
 * Apple HIG 에서 웹으로 옮긴 측정 가능한 기준 네 가지를 막아 둡니다.
 *   ① 대비 증가 ② 손가락 입력 44px ③ 사용자 글자 크기(rem) ④ 움직임 줄이기
 * 브라우저에서 실제로 반응하는지는 a11y 잡의 audit:hig 가 확인합니다.
 */

const read = (p) => readFileSync(p, 'utf8')

test('③ 타입 스케일의 크기 · 행간은 전부 rem 이다', () => {
  for (const [name, [size, opts]] of Object.entries(preset.theme.fontSize)) {
    assert.match(size, /^[\d.]+rem$/, `${name} 크기 ${size}`)
    assert.match(opts.lineHeight, /^[\d.]+rem$/, `${name} 행간 ${opts.lineHeight}`)
  }
})

test('③ 기본 16px 에서 타입 스케일은 v1 의 px 값과 같다 (기본 화면 불변)', () => {
  const px = (v) => Number(v.replace('rem', '')) * 16
  const expected = { micro: [11, 14], xs: [12, 16], sm: [13, 18], base: [14, 20], md: [16, 24], lg: [20, 28], xl: [24, 32], metric: [28, 34], 'metric-lg': [34, 40] }
  for (const [name, [size, opts]] of Object.entries(preset.theme.fontSize)) {
    assert.deepEqual([px(size), px(opts.lineHeight)], expected[name], name)
  }
})

test('③ 저장소 CSS 어디에도 px 글자 크기가 없다', () => {
  for (const f of readdirSync('src/styles').filter((n) => n.endsWith('.css'))) {
    const css = read(`src/styles/${f}`).replace(/\/\*[\s\S]*?\*\//g, '')
    assert.doesNotMatch(css, /font-size:\s*[\d.]+px/, f)
    assert.doesNotMatch(css, /--text-[a-z-]+:\s*[\d.]+px/, `${f} — v4 타입 변수`)
    assert.doesNotMatch(css, /--text-[a-z-]+--line-height:\s*[\d.]+px/, `${f} — v4 행간 변수`)
  }
})

test('① 대비 증가 값이 기준을 넘고, 원래보다 대비를 낮추지 않는다', () => {
  const { report } = buildAdaptive()
  assert.equal(report.length, CONTRAST_CHECKS.length * 2)
  for (const r of report) {
    assert.ok(r.ratio >= r.min, `${r.mode} ${r.fg}/${r.bg} ${r.ratio} < ${r.min}`)
    assert.ok(r.ratio >= r.before, `${r.mode} ${r.fg}/${r.bg} 낮아짐 ${r.before} → ${r.ratio}`)
  }
})

test('① 커밋된 adaptive.css 가 생성기 결과와 같다', () => {
  assert.equal(read('src/styles/adaptive.css'), buildAdaptive().css)
})

test('① 대비 증가 블록은 라이트 · OS 다크 · 강제 다크를 모두 덮는다', () => {
  const css = read('src/styles/adaptive.css')
  assert.match(css, /@media \(prefers-contrast: more\) \{\s*:root:not\(\[data-theme="dark"\]\)/)
  assert.match(css, /@media \(prefers-contrast: more\) and \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme="light"\]\)/)
  assert.match(css, /@media \(prefers-contrast: more\) \{\s*:root\[data-theme="dark"\]/)
})

test('② 손가락 입력에서 모든 컨트롤 높이 · 촘촘 · 기본 행이 44px 이상이다', () => {
  assert.ok(TOUCH_MIN >= 44)
  const css = read('src/styles/adaptive.css')
  const block = css.slice(css.indexOf('@media (pointer: coarse)'))
  const controls = declaredNames(parseCss(read('src/styles/tokens.css'))).filter((n) => n.startsWith('--control-height-'))
  assert.ok(controls.length >= 4)
  for (const n of [...controls, '--row-height-compact', '--row-height-default']) {
    const m = new RegExp(`${n}:\\s*(\\d+)px`).exec(block)
    assert.ok(m, `${n} 가 pointer: coarse 블록에 없습니다`)
    assert.ok(Number(m[1]) >= 44, `${n} = ${m[1]}px`)
  }
})

test('②③ 소비 앱 진입점이 adaptive.css 를 palettes.css 다음에 불러온다', () => {
  for (const f of ['src/styles/hct.css', 'src/styles/hct.v4.css']) {
    const css = read(f)
    const pal = css.indexOf("@import './palettes.css'")
    const ada = css.indexOf("@import './adaptive.css'")
    assert.ok(pal !== -1 && ada > pal, `${f}: adaptive.css 가 palettes.css 뒤에 없습니다`)
  }
})

test('④ 움직임 줄이기가 애니메이션 · 전환 · 부드러운 스크롤을 모두 멈춘다', () => {
  const css = read('src/styles/base.css')
  const at = css.indexOf('@media (prefers-reduced-motion: reduce)')
  assert.ok(at !== -1)
  const block = css.slice(at, css.indexOf('}', css.indexOf('{', css.indexOf('{', at) + 1)))
  for (const prop of ['animation-duration', 'animation-iteration-count', 'transition-duration', 'scroll-behavior']) {
    assert.match(block, new RegExp(`${prop}:[^;]+!important`), prop)
  }
})

test('대비 계산이 WCAG 의 알려진 값과 같다', () => {
  assert.equal(contrast('#000000', '#FFFFFF'), 21)
  assert.equal(contrast('#FFFFFF', '#FFFFFF'), 1)
  assert.equal(contrast('#767676', '#FFFFFF'), 4.54)
})
