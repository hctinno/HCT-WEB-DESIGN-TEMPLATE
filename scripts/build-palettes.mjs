#!/usr/bin/env node
/**
 * tokens/palettes.json → src/styles/palettes.css 생성기.
 *
 * 왜 손으로 쓰지 않는가:
 *   각 팔레트는 라이트 1블록 + 다크 2블록(미디어쿼리용·명시선택용)이 필요하고,
 *   두 다크 블록의 값이 반드시 같아야 합니다. 손으로 쓰면 한쪽만 고치는 실수가
 *   반드시 생깁니다. 생성기가 두 블록을 같은 데이터에서 뽑아냅니다.
 *
 * 대비 검사도 함께 수행합니다. 팔레트는 눈으로 예뻐 보여도 본문이 안 읽히면
 * 실패입니다. WCAG 기준에 못 미치면 생성이 중단됩니다.
 *
 * 실행: npm run tokens:build
 */

import { readFileSync, writeFileSync } from 'node:fs'

const palettes = JSON.parse(readFileSync('tokens/palettes.json', 'utf8'))

/* ── 대비 계산 (WCAG 2.1) ────────────────────────────────────── */
function toRgb(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
}
function luminance(hex) {
  const [r, g, b] = toRgb(hex).map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100
}

/* ── CSS 생성 ────────────────────────────────────────────────── */
const SEMANTIC_DARK = [
  ['bg', 'canvas', '--color-bg-canvas'], ['bg', 'surface', '--color-bg-surface'],
  ['bg', 'raised', '--color-bg-raised'], ['bg', 'sunken', '--color-bg-sunken'],
  ['bg', 'hover', '--color-bg-hover'], ['bg', 'active', '--color-bg-active'],
  ['bg', 'sidebar', '--color-bg-sidebar'], ['bg', 'overlay', '--color-bg-overlay'],
  ['text', 'primary', '--color-text-primary'], ['text', 'secondary', '--color-text-secondary'],
  ['text', 'tertiary', '--color-text-tertiary'], ['text', 'disabled', '--color-text-disabled'],
  ['text', 'inverse', '--color-text-inverse'], ['text', 'link', '--color-text-link'],
  ['border', 'subtle', '--color-border-subtle'], ['border', 'default', '--color-border-default'],
  ['border', 'strong', '--color-border-strong'], ['border', 'focus', '--color-border-focus'],
  ['accent', 'solid', '--color-accent-solid'], ['accent', 'solidHover', '--color-accent-solid-hover'],
  ['accent', 'subtle', '--color-accent-subtle'], ['accent', 'subtleHover', '--color-accent-subtle-hover'],
  ['accent', 'text', '--color-accent-text'], ['accent', 'border', '--color-accent-border'],
]

/* 사이드바는 본문과 밝기가 다를 수 있어 별도 토큰군을 갖습니다 */
const SIDEBAR_KEYS = [
  ['bg', '--color-sidebar-bg'], ['fg', '--color-sidebar-fg'],
  ['muted', '--color-sidebar-fg-muted'], ['subtle', '--color-sidebar-fg-subtle'],
  ['hover', '--color-sidebar-hover'], ['activeBg', '--color-sidebar-active-bg'],
  ['activeFg', '--color-sidebar-active-fg'], ['border', '--color-sidebar-border'],
  ['badgeBg', '--color-sidebar-badge-bg'], ['badgeFg', '--color-sidebar-badge-fg'],
  ['rail', '--color-sidebar-rail-bg'],
]

function sidebarBlock(sidebar, indent = '  ') {
  if (!sidebar) return ''
  return '\n' + SIDEBAR_KEYS
    .map(([key, cssVar]) => (sidebar[key] ? `${indent}${cssVar}: ${sidebar[key]};` : null))
    .filter(Boolean)
    .join('\n')
}

function lightBlock(p, indent = '  ') {
  const lines = []
  for (const [k, v] of Object.entries(p.light.neutral)) lines.push(`${indent}--hct-neutral-${k}: ${v};`)
  lines.push('')
  for (const [k, v] of Object.entries(p.light.accent)) lines.push(`${indent}--hct-accent-${k}: ${v};`)
  if (p.light.semantic) {
    lines.push('')
    for (const [k, v] of Object.entries(p.light.semantic)) lines.push(`${indent}${k}: ${v};`)
  }
  return lines.join('\n') + sidebarBlock(p.light.sidebar, indent)
}

function darkBlock(p, indent = '  ') {
  return SEMANTIC_DARK
    .map(([group, key, cssVar]) => {
      const value = p.dark[group]?.[key]
      return value ? `${indent}${cssVar}: ${value};` : null
    })
    .filter(Boolean)
    .join('\n') + sidebarBlock(p.dark.sidebar, indent)
}

let css = `/* ============================================================================
   HCT 색 팔레트 — 자동 생성 파일 (직접 수정하지 마세요)
   ----------------------------------------------------------------------------
   원본: tokens/palettes.json
   생성: npm run tokens:build

   사용법:  <html data-palette="graphite">
            기본값(속성 없음)은 tokens.css 에 정의된 팔레트입니다.

   상태 색(성공·주의·위험·정보·검토)은 팔레트가 바뀌어도 그대로입니다.
   의미를 나르는 색이라 제품 전체에서 고정되어야 합니다.
   ============================================================================ */
`

const report = []

for (const [id, p] of Object.entries(palettes)) {
  if (id.startsWith('$')) continue

  css += `
/* ── ${p.label} — ${p.tagline}
   ${p.rationale} */
:root[data-palette="${id}"] {
${lightBlock(p)}
}

@media (prefers-color-scheme: dark) {
  :root[data-palette="${id}"]:not([data-theme="light"]) {
${darkBlock(p, '    ')}
  }
}

:root[data-palette="${id}"][data-theme="dark"] {
${darkBlock(p)}
}
`

  /* 대비 검사 — 라이트/다크 각각의 핵심 조합 */
  const L = p.light, D = p.dark
  const checks = [
    ['라이트 본문/표면', L.neutral['900'], L.neutral['0'], 7],
    ['라이트 보조/표면', L.neutral['700'], L.neutral['0'], 4.5],
    ['라이트 3차/표면', L.neutral['600'], L.neutral['0'], 4.5],
    ['라이트 본문/캔버스', L.neutral['900'], L.neutral['50'], 7],
    ['라이트 버튼글자/강조', L.neutral['0'], L.accent['600'], 4.5],
    ['다크 본문/표면', D.text.primary, D.bg.surface, 7],
    ['다크 보조/표면', D.text.secondary, D.bg.surface, 4.5],
    ['다크 3차/표면', D.text.tertiary, D.bg.surface, 4.5],
    ['다크 버튼글자/강조', D.text.inverse, D.accent.solid, 4.5],
    ['다크 강조글자/표면', D.accent.text, D.bg.surface, 4.5],
  ]

  /* 사이드바를 따로 정의한 팔레트는 사이드바 안에서도 대비를 확인합니다.
     어두운 사이드바에 어두운 글자를 얹는 실수를 잡습니다. */
  if (L.sidebar?.bg) {
    checks.push(
      ['라이트 사이드바 글자', L.sidebar.fg, L.sidebar.bg, 7],
      ['라이트 사이드바 보조', L.sidebar.muted, L.sidebar.bg, 4.5],
      ['라이트 사이드바 흐림', L.sidebar.subtle, L.sidebar.bg, 4.5],
      ['라이트 선택항목 글자', L.sidebar.activeFg, L.sidebar.activeBg, 4.5],
      ['라이트 멘션 배지', L.sidebar.badgeFg, L.sidebar.badgeBg, 4.5],
    )
  }
  if (D.sidebar?.bg) {
    checks.push(
      ['다크 사이드바 글자', D.sidebar.fg, D.sidebar.bg, 7],
      ['다크 사이드바 보조', D.sidebar.muted, D.sidebar.bg, 4.5],
      ['다크 사이드바 흐림', D.sidebar.subtle, D.sidebar.bg, 4.5],
      ['다크 선택항목 글자', D.sidebar.activeFg, D.sidebar.activeBg, 4.5],
      ['다크 멘션 배지', D.sidebar.badgeFg, D.sidebar.badgeBg, 4.5],
    )
  }
  for (const [name, fg, bg, min] of checks) {
    const ratio = contrast(fg, bg)
    report.push({ palette: p.label, name, ratio, min, pass: ratio >= min })
  }
}

writeFileSync('src/styles/palettes.css', css)

const failures = report.filter((r) => !r.pass)
const byPalette = new Map()
for (const r of report) {
  if (!byPalette.has(r.palette)) byPalette.set(r.palette, [])
  byPalette.get(r.palette).push(r)
}

console.log(`src/styles/palettes.css 생성 — 팔레트 ${byPalette.size}개\n`)
for (const [name, rows] of byPalette) {
  const worst = rows.reduce((a, b) => (a.ratio / a.min < b.ratio / b.min ? a : b))
  const bad = rows.filter((r) => !r.pass)
  console.log(`  ${bad.length ? '✗' : '✓'} ${name.padEnd(14)} 최저 여유: ${worst.name} ${worst.ratio}:1 (기준 ${worst.min})`)
  for (const r of bad) console.log(`      ✗ ${r.name}: ${r.ratio}:1 — 기준 ${r.min}:1 미달`)
}

if (failures.length > 0) {
  console.log(`\n대비 기준 미달 ${failures.length}건. tokens/palettes.json 을 수정하세요.`)
  process.exit(1)
}
console.log('\n모든 팔레트가 대비 기준을 통과했습니다.')
