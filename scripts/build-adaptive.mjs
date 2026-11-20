#!/usr/bin/env node
/**
 * 접근성 적응 CSS 생성기 — tokens/palettes.json(contrastMore) → src/styles/adaptive.css
 *
 * 왜 따로 두는가:
 *
 *   Apple HIG 의 측정 가능한 기준 가운데 웹에 그대로 옮길 수 있는 것만
 *   골라, 사용자가 운영체제에서 켠 설정에 반응하게 합니다. 아무 설정도
 *   켜지 않은 기본 화면에는 한 값도 바꾸지 않습니다.
 *
 *     대비 증가      prefers-contrast: more → 글자 7:1 · 테두리 3:1 이상으로 진하게
 *     손가락 입력    pointer: coarse        → 누르는 칸 44px 이상 (HIG 44×44pt)
 *
 *   움직임 줄이기(prefers-reduced-motion)는 base.css 의 기본 레이어에,
 *   사용자 글자 크기는 rem 타입 스케일(tailwind-preset.js)에 있습니다.
 *
 * 무엇을 검사하는가 (하나라도 어긋나면 생성을 멈춥니다):
 *
 *   - 대비 증가 값의 글자 7:1 · 테두리 · 포커스 · 채움 3:1
 *   - 대비 증가가 원래 값보다 대비를 낮추지 않는가
 *   - 라이트에만 있고 다크에 없는 키가 없는가 — 있으면 OS 다크에서 라이트 값이 새어 나옵니다
 *   - 손가락 입력 블록이 tokens.css 의 모든 컨트롤 높이 토큰을 덮는가
 *
 * 실행: npm run tokens:build  (build-palettes.mjs 다음에 돌아야 합니다)
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseCss, computeRootVars, declaredNames } from './css-vars.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(ROOT + p, 'utf8')

/** HIG: 누르는 칸 최소 44×44pt. 웹에서는 CSS px 로 같은 값을 씁니다. */
export const TOUCH_MIN = 44

/* ── 대비 계산 (WCAG 2.x 상대 휘도) ───────────────────────────── */
export function contrast(a, b) {
  const lum = (hex) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100
}

/* 글자(앞) / 바탕(뒤) / 기준. 같은 목록을 test/hig.test.mjs 가 다시 씁니다. */
export const CONTRAST_CHECKS = [
  ...['primary', 'secondary', 'tertiary', 'link'].flatMap((t) =>
    ['surface', 'canvas', 'raised'].map((b) => [`--color-text-${t}`, `--color-bg-${b}`, 7])),
  ['--color-accent-text', '--color-bg-surface', 7],
  ['--color-accent-text', '--color-accent-subtle', 7],
  ['--color-text-inverse', '--color-accent-solid', 7],
  ...['success', 'warning', 'danger', 'info', 'review', 'neutral'].map((t) => [`--color-${t}-text`, `--color-${t}-bg`, 7]),
  ['--color-sidebar-fg-muted', '--color-sidebar-bg', 7],
  ['--color-sidebar-fg-subtle', '--color-sidebar-bg', 4.5],
  /* 글자가 아닌 UI 요소 — WCAG 1.4.11 */
  ['--color-border-default', '--color-bg-surface', 3],
  ['--color-border-strong', '--color-bg-surface', 3],
  ['--color-border-focus', '--color-bg-surface', 3],
  ['--color-border-focus', '--color-bg-canvas', 3],
  ['--color-accent-solid', '--color-bg-surface', 3],
]

export function buildAdaptive() {
  const palettes = JSON.parse(read('tokens/palettes.json'))
  const more = palettes.hct?.contrastMore
  if (!more?.light || !more?.dark) throw new Error('tokens/palettes.json 의 hct.contrastMore.light/dark 가 없습니다')

  const rules = parseCss(read('src/styles/tokens.css') + '\n' + read('src/styles/palettes.css'))
  const names = new Set(declaredNames(rules))
  const base = { light: computeRootVars(rules), dark: computeRootVars(rules, { attrs: { 'data-theme': 'dark' } }) }

  const problems = []
  for (const mode of ['light', 'dark']) {
    for (const [n, v] of Object.entries(more[mode])) {
      if (!names.has(n)) problems.push(`${mode}: 없는 토큰 ${n}`)
      if (!/^#[0-9A-F]{6}$/.test(v)) problems.push(`${mode}: ${n} 값은 대문자 #RRGGBB 여야 합니다 (${v})`)
    }
  }
  const leak = Object.keys(more.light).filter((n) => !(n in more.dark))
  if (leak.length) problems.push(`라이트에만 있는 키(다크에도 넣으세요 — OS 다크에서 라이트 값이 새어 나옵니다): ${leak.join(', ')}`)

  const report = []
  for (const mode of ['light', 'dark']) {
    const val = (n) => more[mode][n] ?? base[mode].get(n)
    for (const [fg, bg, min] of CONTRAST_CHECKS) {
      const ratio = contrast(val(fg), val(bg))
      const before = contrast(base[mode].get(fg), base[mode].get(bg))
      report.push({ mode, fg, bg, min, ratio, before })
      if (ratio < min) problems.push(`${mode} ${fg} / ${bg}: ${ratio}:1 — 기준 ${min}:1 미달`)
      if (ratio < before) problems.push(`${mode} ${fg} / ${bg}: 대비 증가인데 ${before} → ${ratio} 로 낮아짐`)
    }
  }

  const controls = [...names].filter((n) => n.startsWith('--control-height-'))
  const rows = ['--row-height-compact', '--row-height-default']
  for (const n of rows) if (!names.has(n)) problems.push(`tokens.css 에 ${n} 가 없습니다`)
  if (controls.length < 4) problems.push(`컨트롤 높이 토큰을 찾지 못했습니다 (${controls.length}개)`)

  if (problems.length) throw new Error('adaptive.css 생성 중단\n  - ' + problems.join('\n  - '))

  const block = (map, indent) => Object.entries(map).map(([n, v]) => `${indent}${n}: ${v};`).join('\n')
  const coarse = [...controls, ...rows].map((n) => `    ${n}: ${TOUCH_MIN}px;`).join('\n')

  const css = `/* ============================================================================
   HCT 접근성 적응 — 자동 생성 파일 (직접 수정하지 마세요)
   ----------------------------------------------------------------------------
   원본: tokens/palettes.json 의 hct.contrastMore · scripts/build-adaptive.mjs
   생성: npm run tokens:build

   사용자가 운영체제에서 켠 설정에만 반응합니다. 아무것도 켜지 않은 기본
   화면(대비 보통 · 마우스 · 움직임 허용)에서는 한 값도 바꾸지 않습니다.

     ① 대비 증가   prefers-contrast: more  글자 7:1 · 테두리 · 포커스 3:1 이상
     ② 손가락 입력 pointer: coarse         누르는 칸 ${TOUCH_MIN}px 이상 (Apple HIG 44×44pt)

   움직임 줄이기는 base.css, 사용자 글자 크기는 rem 타입 스케일이 맡습니다.
   <html data-contrast="normal"> 을 붙이면 ① 을 끕니다 (화면 비교 · 인쇄용).

   반드시 tokens.css · palettes.css 다음에 불러옵니다 — 선택자 명시도가
   팔레트 다크 블록과 같아서, 뒤에 와야 이깁니다.
   ============================================================================ */

/* ① 대비 증가 — 라이트 테마 */
@media (prefers-contrast: more) {
  :root:not([data-theme="dark"]):not([data-contrast="normal"]) {
${block(more.light, '    ')}
  }
}

/* ① 대비 증가 — 운영체제 다크 (data-theme="light" 로 고정한 경우 제외) */
@media (prefers-contrast: more) and (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not([data-contrast="normal"]) {
${block(more.dark, '    ')}
  }
}

/* ① 대비 증가 — <html data-theme="dark"> 로 강제한 다크 */
@media (prefers-contrast: more) {
  :root[data-theme="dark"]:not([data-contrast="normal"]) {
${block(more.dark, '    ')}
  }
}

/* ② 손가락 입력 — 주 입력 장치가 거친 포인터(터치)일 때 */
@media (pointer: coarse) {
  :root {
${coarse}
  }
}
`
  return { css, report }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { css, report } = buildAdaptive()
  writeFileSync(ROOT + 'src/styles/adaptive.css', css)
  const worst = (mode) => report.filter((r) => r.mode === mode).reduce((a, b) => (a.ratio / a.min < b.ratio / b.min ? a : b))
  console.log('src/styles/adaptive.css 생성 — 대비 증가 · 손가락 입력')
  for (const mode of ['light', 'dark']) {
    const w = worst(mode)
    console.log(`  ✓ 대비 증가 ${mode.padEnd(5)} 검사 ${report.filter((r) => r.mode === mode).length}건 · 최저 여유 ${w.fg} / ${w.bg} ${w.ratio}:1 (기준 ${w.min})`)
  }
}
