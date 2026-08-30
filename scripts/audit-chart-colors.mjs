#!/usr/bin/env node
/**
 * 차트 색 대비 검사.
 *
 *   node scripts/audit-chart-colors.mjs
 *   npm run tokens:build   (팔레트 생성과 함께 자동 실행)
 *
 * 왜 이 검사가 따로 필요한가:
 *
 *   build-palettes.mjs 는 **글자와 배경**의 대비만 봅니다. 그런데 차트의 선과
 *   막대는 글자가 아니라 그래픽 객체이고, WCAG 2.1 의 1.4.11 은 여기에도
 *   3:1 을 요구합니다. axe-core 도 이걸 못 잡습니다 — SVG 도형의 색은 검사
 *   대상이 아닙니다. 즉 지금까지 차트 색은 **아무도 재지 않았습니다.**
 *
 *   실제로 재보니 tokens.css 의 "대비·색각 검증을 통과한 값입니다" 라는
 *   주석은 근거가 없었습니다. 문서가 검증을 주장하면 검증하는 코드가
 *   있어야 합니다.
 *
 * 무엇을 검사하는가:
 *
 *   1. 계열 색 × 모든 팔레트의 표면색 ≥ 3:1        (WCAG 1.4.11, 실패)
 *      3.5:1 미만이면 경고                          (IBM Carbon 권장)
 *   2. 순차형 각 단계 위의 **글자** ≥ 4.5:1         (WCAG 1.4.3, 실패)
 *   3. 순차형 단계가 밝기 순으로 단조 증가/감소     (실패)
 *   4. 파선 패턴이 실제로 선에 적용되고 있는가      (실패)
 *
 * 4번이 이상해 보일 수 있는데, 이게 이 검사의 핵심입니다.
 *
 *   계열 색은 **명도를 맞추고 색상만 바꾼** 팔레트입니다. 순위처럼 보이지
 *   않게 하려는 의도적인 선택이지만, 그 대가로 계열끼리는 명도로 구별되지
 *   않습니다(15쌍 전부 3:1 미만). 그래도 되는 이유는 선마다 파선 패턴이
 *   다르기 때문입니다 — 색이 사라져도 두 번째 단서가 남습니다.
 *
 *   그러니 파선을 없애는 순간 팔레트가 규격 위반이 됩니다. 둘은 한 몸이고,
 *   한쪽만 지우는 일을 막으려면 기계가 둘을 함께 봐야 합니다.
 */

import { readFileSync } from 'node:fs'

/* ── 대비 계산 (WCAG 2.1) ────────────────────────────────────── */
const toRgb = (hex) => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
}
const luminance = (hex) => {
  const [r, g, b] = toRgb(hex).map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100
}

/* ── CSS 블록 파서 ───────────────────────────────────────────────
   중괄호 깊이만 세면 됩니다. 미디어쿼리 안의 블록도 그대로 잡힙니다. */
function parseBlocks(css, file) {
  const blocks = []
  const stack = []
  let i = 0
  let buffer = ''
  while (i < css.length) {
    const ch = css[i]
    if (ch === '{') {
      stack.push({ selector: buffer.trim().split('\n').pop().trim(), decls: {} })
      buffer = ''
    } else if (ch === '}') {
      const done = stack.pop()
      if (done && Object.keys(done.decls).length > 0) {
        blocks.push({ ...done, file, context: stack.map((s) => s.selector).join(' ') })
      }
      buffer = ''
    } else if (ch === ';') {
      const m = buffer.match(/(--[\w-]+)\s*:\s*([^;]+)$/)
      if (m && stack.length > 0) stack[stack.length - 1].decls[m[1]] = m[2].trim()
      buffer = ''
    } else {
      buffer += ch
    }
    i += 1
  }
  return blocks
}

/** var(--x) 를 한 단계 풀어냅니다. 같은 블록 → 같은 팔레트 → 전역 순으로 찾습니다. */
function resolve(value, block, blocks) {
  if (!value) return null
  const m = value.match(/^var\(\s*(--[\w-]+)/)
  if (!m) return value.startsWith('#') ? value.toUpperCase() : null

  const paletteOf = (b) => (b.selector + b.context).match(/data-palette="([^"]+)"/)?.[1] ?? null
  const mine = paletteOf(block)
  const pools = [
    [block],
    blocks.filter((b) => paletteOf(b) === mine && mine !== null),
    blocks.filter((b) => paletteOf(b) === null),
  ]
  for (const pool of pools) {
    for (const b of pool) {
      const v = b.decls[m[1]]
      if (v) return resolve(v, b, blocks)
    }
  }
  return null
}

const tokensCss = readFileSync('src/styles/tokens.css', 'utf8')
const palettesCss = readFileSync('src/styles/palettes.css', 'utf8')
const blocks = [...parseBlocks(tokensCss, 'tokens.css'), ...parseBlocks(palettesCss, 'palettes.css')]

const isDarkBlock = (b) =>
  /prefers-color-scheme:\s*dark/.test(b.context) || /data-theme="dark"/.test(b.selector + b.context)

/* ── 표면색 모으기 ───────────────────────────────────────────── */
const surfaces = { light: new Map(), dark: new Map() }
for (const b of blocks) {
  const raw = b.decls['--color-bg-surface']
  if (!raw) continue
  const hex = resolve(raw, b, blocks)
  if (!hex) continue
  const palette = (b.selector + b.context).match(/data-palette="([^"]+)"/)?.[1] ?? '기본'
  surfaces[isDarkBlock(b) ? 'dark' : 'light'].set(hex, palette)
}

/* ── 차트 색 모으기 ──────────────────────────────────────────── */
function collect(prefix, count) {
  const out = { light: {}, dark: {} }
  for (const b of blocks) {
    const theme = isDarkBlock(b) ? 'dark' : 'light'
    for (let n = 1; n <= count; n += 1) {
      const v = b.decls[`${prefix}${n}`]
      if (v?.startsWith('#')) out[theme][n] = v.toUpperCase()
    }
  }
  return out
}
const series = collect('--chart-', 6)
const seq = collect('--chart-seq-', 5)

const seqFg = { light: {}, dark: {} }
for (const b of blocks) {
  const theme = isDarkBlock(b) ? 'dark' : 'light'
  for (const key of ['--chart-seq-fg', '--chart-seq-fg-strong']) {
    if (b.decls[key]?.startsWith('#')) seqFg[theme][key] = b.decls[key].toUpperCase()
  }
}

/* ── 검사 ───────────────────────────────────────────────────── */
const failures = []
const warnings = []
const THEMES = [['light', '라이트'], ['dark', '다크']]

console.log('차트 색 대비 검사 — WCAG 2.1\n')

for (const [theme, label] of THEMES) {
  const surfs = [...surfaces[theme].entries()]
  const colors = series[theme]
  const keys = Object.keys(colors)

  if (keys.length === 0 || surfs.length === 0) {
    failures.push(`${label}: 차트 색 또는 표면색을 찾지 못했습니다 — 파서가 토큰 구조를 못 따라갔습니다`)
    continue
  }

  console.log(`── ${label} · 계열 색 ${keys.length}개 × 표면 ${surfs.length}종`)
  for (const n of keys) {
    /* 가장 불리한 표면 하나가 통과하면 나머지도 통과합니다 */
    let worst = null
    for (const [hex, palette] of surfs) {
      const v = contrast(colors[n], hex)
      if (!worst || v < worst.v) worst = { v, hex, palette }
    }
    const mark = worst.v < 3 ? '✗' : worst.v < 3.5 ? '△' : '✓'
    console.log(`  ${mark} chart-${n} ${colors[n]}  최저 ${worst.v}:1 (${worst.palette} ${worst.hex})`)
    if (worst.v < 3) {
      failures.push(`${label} chart-${n}: ${worst.v}:1 — WCAG 1.4.11 기준 3:1 미달 (${worst.palette})`)
    } else if (worst.v < 3.5) {
      warnings.push(`${label} chart-${n}: ${worst.v}:1 — Carbon 권장 3.5:1 미달 (${worst.palette})`)
    }
  }

  /* 계열끼리의 명도차는 **기준이 아니라 기록**입니다. 아래 파선 검사가
     이걸 보완한다는 전제로 통과시킵니다. 숫자는 보이게 남겨둡니다. */
  const pairs = []
  for (let i = 0; i < keys.length; i += 1) {
    for (let j = i + 1; j < keys.length; j += 1) {
      pairs.push({ v: contrast(colors[keys[i]], colors[keys[j]]), a: keys[i], b: keys[j] })
    }
  }
  pairs.sort((x, y) => x.v - y.v)
  const under = pairs.filter((p) => p.v < 3).length
  console.log(`    계열끼리: ${pairs.length}쌍 중 ${under}쌍이 3:1 미만 ` +
              `(최저 chart-${pairs[0].a}↔${pairs[0].b} ${pairs[0].v}:1) — 파선으로 보완합니다`)
  console.log()
}

/* ── 순차형 ─────────────────────────────────────────────────── */
for (const [theme, label] of THEMES) {
  const steps = seq[theme]
  const keys = Object.keys(steps).map(Number).sort((a, b) => a - b)
  if (keys.length === 0) {
    failures.push(`${label}: 순차형 색(--chart-seq-*)이 없습니다`)
    continue
  }

  console.log(`── ${label} · 순차형 ${keys.length}단계 (칸 위의 글자 기준 4.5:1)`)
  for (const n of keys) {
    /* 마지막 단계만 글자색이 뒤집힙니다 — chartTokens.js 의 CHART_SEQ 와 같은 규칙 */
    const fgKey = n === keys.length ? '--chart-seq-fg-strong' : '--chart-seq-fg'
    const fg = seqFg[theme][fgKey]
    if (!fg) { failures.push(`${label}: ${fgKey} 를 찾지 못했습니다`); continue }
    const v = contrast(fg, steps[n])
    console.log(`  ${v < 4.5 ? '✗' : '✓'} seq-${n} ${steps[n]}  글자 ${fg} → ${v}:1`)
    if (v < 4.5) failures.push(`${label} seq-${n}: 칸 위의 글자 ${v}:1 — 기준 4.5:1 미달`)
  }

  const lums = keys.map((n) => luminance(steps[n]))
  const rising = lums.every((l, i) => i === 0 || l > lums[i - 1])
  const falling = lums.every((l, i) => i === 0 || l < lums[i - 1])
  if (!rising && !falling) {
    failures.push(`${label} 순차형: 밝기가 단조롭지 않습니다 — 단계 순서가 값의 크기를 뜻하지 못합니다`)
  }
  console.log(`    밝기 ${falling ? '내림' : '오름'}차순 ${rising || falling ? '✓' : '✗'}\n`)
}

/* ── 파선이라는 보완 장치가 살아 있는가 ──────────────────────── */
const chartTokens = readFileSync('src/components/chart/chartTokens.js', 'utf8')
const lineChart = readFileSync('src/components/chart/LineChart.jsx', 'utf8')

const dashDefined = /export const SERIES_DASH\s*=\s*\[([^\]]*)\]/.exec(chartTokens)
const dashCount = dashDefined ? dashDefined[1].split(',').length : 0

/*
 * **계열을 그리는 <path> 자체**에 파선이 붙어 있는지 봅니다.
 *
 * 처음에는 파일 어딘가에 strokeDasharray 가 있으면 통과시켰는데, 그러면
 * 툴팁의 작은 선 표식만 남아도 통과합니다. 정작 선에서 파선이 빠진 채로요.
 * 검사가 진짜를 보지 않으면 없는 것만 못합니다.
 */
const seriesPath = /<path\s+d=\{path\}[\s\S]*?\/>/.exec(lineChart)?.[0] ?? ''
const dashApplied = /strokeDasharray=\{dashes\[/.test(seriesPath)
const legendShowsDash = /strokeDasharray=\{dashes\[/.test(lineChart.split('export function ChartLegend')[1] ?? '')

console.log('── 색을 못 볼 때의 두 번째 단서')
console.log(`  ${dashCount >= 6 ? '✓' : '✗'} SERIES_DASH 패턴 ${dashCount}개 (계열 수만큼 필요)`)
console.log(`  ${dashApplied ? '✓' : '✗'} LineChart 의 선에 적용됨`)
console.log(`  ${legendShowsDash ? '✓' : '✗'} 범례가 같은 패턴을 보여줌`)

if (dashCount < 6) {
  failures.push('SERIES_DASH 가 계열 수보다 적습니다 — 명도가 같은 팔레트는 파선 없이는 규격 위반입니다')
}
if (!dashApplied) {
  failures.push('LineChart 가 파선을 적용하지 않습니다 — 계열끼리 명도 대비가 3:1 미만이라 색이 유일한 단서가 됩니다')
}
if (!legendShowsDash) {
  failures.push('범례가 파선을 보여주지 않습니다 — 선은 파선인데 범례가 사각형이면 둘을 맞출 수 없습니다')
}

/* ── 결과 ───────────────────────────────────────────────────── */
console.log()
for (const w of warnings) console.log(`△ ${w}`)
if (failures.length > 0) {
  console.log(`\n✗ 기준 미달 ${failures.length}건`)
  for (const f of failures) console.log(`  · ${f}`)
  console.log('\nsrc/styles/tokens.css 의 차트 토큰을 고치세요.')
  process.exit(1)
}
console.log(`✓ 차트 색이 기준을 통과했습니다${warnings.length ? ` (권장 미달 ${warnings.length}건)` : ''}`)
