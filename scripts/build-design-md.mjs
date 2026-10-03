#!/usr/bin/env node
/**
 * DESIGN.md 생성기 — 토큰 · 컴포넌트 코드 → 파일 하나짜리 디자인 명세.
 *
 * 왜 생성하는가:
 *
 *   DESIGN.md 는 이 패키지를 쓰지 않는 쪽(다른 프레임워크 · 순수 HTML ·
 *   디자인 도구 · 다른 에이전트)에게 "이 파일 하나만 주면 같은 겉모습" 을
 *   약속합니다. 그러려면 색 변수 100여 개의 라이트 · 다크 값이 전부 들어가야
 *   하는데, 손으로 옮기면 토큰이 바뀔 때마다 어긋납니다.
 *
 *   실제로 이전 DESIGN.md 에는 색 값이 8개뿐이었고, 그 파일만 받은 에이전트는
 *   표면 · 글자 · 테두리 색을 지어냈습니다.
 *
 * 어디서 무엇을 가져오는가:
 *
 *   색 · 치수 값 ..... src/styles/tokens.css + palettes.css (css-vars.mjs 로 계산)
 *   기본 레이어 ...... src/styles/base.css 원문
 *   상태 → 색조 ...... src/components/feedback/StatusBadge.jsx 의 WORKFLOW_STATUS
 *   팔레트 표 ........ tokens/palettes.json
 *   로고 크기 ........ src/assets/brand/*.png 의 헤더
 *   설치 명령 · 주소 . package.json 의 version · repository
 *   문장 ............. scripts/design-md.template.md  ← 설명을 고치려면 여기
 *
 * 실행: npm run tokens:build
 *   CI 는 다시 생성한 결과가 커밋된 DESIGN.md 와 같은지 확인합니다.
 */

import { readFileSync, writeFileSync, openSync, readSync, closeSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseCss, computeRootVars, declaredNames } from './css-vars.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const read = (path) => readFileSync(ROOT + path, 'utf8')

/* ── 값 계산 ─────────────────────────────────────────────────── */

const rules = parseCss(read('src/styles/tokens.css') + '\n' + read('src/styles/palettes.css'))
/* 원시 팔레트(--hct-*)는 "직접 사용 금지" 이므로 명세에 싣지 않습니다 */
const NAMES = declaredNames(rules).filter((n) => !n.startsWith('--hct-'))
const asObject = (map) => Object.fromEntries(NAMES.map((n) => [n, map.get(n)]))

const L = asObject(computeRootVars(rules))
const D = asObject(computeRootVars(rules, { attrs: { 'data-theme': 'dark' } }))

/*
 * md 의 CSS 블록은 "속성 없음 = 라이트 · OS 다크 = data-theme=dark" 라는
 * 저장소의 구조를 그대로 옮깁니다. 저장소 쪽에서 이 구조가 깨지면 md 를 그대로
 * 붙인 화면과 패키지 화면이 달라지므로, 여기서 먼저 멈춥니다.
 */
const same = (a, b) => NAMES.every((n) => a.get(n) === b.get(n))
if (!same(computeRootVars(rules, { osDark: true }), computeRootVars(rules, { attrs: { 'data-theme': 'dark' } }))) {
  throw new Error('OS 다크와 data-theme="dark" 의 값이 다릅니다 — tokens.css · palettes.css 의 두 다크 블록을 맞추세요')
}
if (!same(computeRootVars(rules, { osDark: true, attrs: { 'data-theme': 'light' } }), computeRootVars(rules))) {
  throw new Error('data-theme="light" 가 OS 다크를 이기지 못합니다')
}
for (const n of NAMES) if (!L[n] || !D[n]) throw new Error(`값이 비어 있습니다: ${n}`)

/* ── 팔레트 ──────────────────────────────────────────────────── */

const palettes = Object.entries(JSON.parse(read('tokens/palettes.json'))).filter(([id]) => !id.startsWith('$'))
/* 기본 팔레트 = 속성을 안 붙였을 때와 값이 같은 팔레트 */
const DEFAULT = palettes.map(([id]) => id)
  .find((id) => same(computeRootVars(rules, { attrs: { 'data-palette': id } }), computeRootVars(rules)))
if (DEFAULT !== 'hct') {
  /* 템플릿의 문장("라이트 테마에서도 사이드바가 어둡다" 등)이 hct 를 전제로 씁니다 */
  throw new Error(`기본 팔레트가 hct 가 아닙니다(${DEFAULT}) — scripts/design-md.template.md 의 문장을 먼저 고치세요`)
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const paletteRows = palettes.map(([id, p]) => {
  const v = computeRootVars(rules, { attrs: { 'data-palette': id } })
  const side = v.get('--color-sidebar-bg')
  const shade = /^#[0-9A-Fa-f]{6}$/.test(side) && luminance(side) < 0.2 ? '어두움' : '밝음'
  /*
   * 기본 팔레트 블록은 속성 없는 :root 에도 걸리므로, 사이드바 토큰을 따로
   * 정하지 않은 팔레트는 기본 팔레트의 사이드바를 그대로 물려받습니다.
   * 의도와 다를 수 있는 동작이라 숨기지 않고 표에 적습니다.
   */
  const inherited = id !== DEFAULT && !p.light.sidebar ? ` — 사이드바 토큰이 없어 \`${DEFAULT}\` 사이드바를 물려받음` : ''
  return `| \`${id}\`${id === DEFAULT ? ' **(기본 — 이 파일의 값)**' : ''} | ${p.tagline} | \`${v.get('--color-accent-solid')}\` | ${shade} (\`${side}\`)${inherited} |`
})
const paletteTable = ['| 팔레트 | 성격 | 강조색 | 사이드바 (라이트 테마) |', '|---|---|---|---|', ...paletteRows].join('\n')

/* ── 분류: CSS 블록과 표가 같은 순서 · 같은 묶음을 씁니다 ──────────────── */

const GROUPS = [
  ['bg', '바탕', (n) => n.startsWith('--color-bg-')],
  ['text', '글자', (n) => n.startsWith('--color-text-')],
  ['border', '테두리', (n) => n.startsWith('--color-border-')],
  ['accent', '강조', (n) => n.startsWith('--color-accent-')],
  ['status', '상태 (색조 6개 × 바탕·테두리·글자·채움)', (n) => /^--color-(success|warning|danger|info|neutral|review)-/.test(n)],
  ['sidebar', '사이드바 전용', (n) => n.startsWith('--color-sidebar-')],
  ['shadow', '그림자', (n) => n.startsWith('--shadow-')],
  ['layout', '레이아웃', (n) => n.startsWith('--layout-')],
  ['control', '컨트롤 · 표 행 높이', (n) => n.startsWith('--control-') || n.startsWith('--row-')],
  ['motion', '움직임', (n) => n.startsWith('--duration-') || n.startsWith('--easing-')],
  ['chart', '차트', (n) => n.startsWith('--chart-')],
  ['font', '서체', (n) => n.startsWith('--font-')],
]
const unassigned = NAMES.filter((n) => !GROUPS.some(([, , f]) => f(n)))
if (unassigned.length) {
  throw new Error(`분류되지 않은 토큰: ${unassigned.join(', ')} — scripts/build-design-md.mjs 의 GROUPS 에 넣으세요`)
}

/*
 * 용도 설명. 컴포넌트 코드가 실제로 쓰는 곳을 적습니다 — tokens.json 의
 * 설명은 의도라서 코드와 어긋난 곳이 있습니다(예: bg-sunken 을 "입력 내부" 라고
 * 하지만 입력은 bg-surface 를 씁니다). 표에 나오는 토큰에 설명이 없으면 멈춥니다.
 */
const USE = {
  '--color-bg-canvas': '페이지 맨 아래 바탕',
  '--color-bg-surface': '카드 · 패널 · 표 본문 · 입력',
  '--color-bg-raised': '떠 있는 것 — 드롭다운 · 팝오버 · 툴팁 · 모달 · 명령 팔레트 · 기본 토스트',
  '--color-bg-sunken': '표 머리행 · 묶음 머리행 · 비활성 입력 · 읽기 전용 값 칸 · 상단바 검색 칸 · 세그먼트 바탕 · 스켈레톤 (일반 입력은 `bg-surface`)',
  '--color-bg-hover': '마우스를 올린 상태',
  '--color-bg-active': '상세가 열린 행',
  '--color-bg-sidebar': '셸의 사이드바 칸 바탕 (그 위를 `sidebar-bg` 로 칠함)',
  '--color-bg-overlay': '모달 · 서랍 · 명령 팔레트 · 1024px 미만 사이드바 서랍 뒤를 덮는 막',
  '--color-text-primary': '본문 · 제목',
  '--color-text-secondary': '입력 · 폼 라벨 · 표 머리행 · ghost 버튼 글자',
  '--color-text-tertiary': '설명문 · 메타 정보 · 지표 타일 라벨 · 안내문(placeholder)',
  '--color-text-disabled': '비활성',
  '--color-text-inverse': '진한 바탕(주 버튼 · 위험 버튼) 위 글자',
  '--color-text-link': '링크',
  '--color-border-subtle': '카드 · 위젯 · 지표 타일 · 모달 · 서랍 테두리, 표 행 구분, 셸 구분선',
  '--color-border-default': '입력 · 버튼 · 드롭다운 · 툴팁 · 토스트 테두리, 표 머리행 아래',
  '--color-border-strong': '누를 수 있는 지표 타일 hover · 꺼진 스위치 · 스크롤바 손잡이',
  '--color-border-focus': '포커스 링 · 입력 포커스',
  '--color-accent-solid': '주 버튼 · 강조 채움',
  '--color-accent-solid-hover': '주 버튼 hover',
  '--color-accent-subtle': '선택된 행 · 옅은 강조 바탕',
  '--color-accent-subtle-hover': '(정의만 있음 — 현재 부품에서 쓰지 않음)',
  '--color-accent-text': '강조 글자',
  '--color-accent-border': '강조 테두리',
  '--color-sidebar-bg': '사이드바 바탕',
  '--color-sidebar-fg': '사이드바 진한 글자 (hover · 안 읽음 · 사용자 이름)',
  '--color-sidebar-fg-muted': '사이드바 기본 항목 글자',
  '--color-sidebar-fg-subtle': '그룹 라벨 · 중립 건수 · 보조 글자',
  '--color-sidebar-hover': '사이드바 항목 hover · 레일의 나머지 타일',
  '--color-sidebar-active-bg': '현재 화면 항목 바탕',
  '--color-sidebar-active-fg': '현재 화면 항목 글자',
  '--color-sidebar-border': '사이드바 구분선 (머리 아래 · 바닥 위 · 레일 오른쪽)',
  '--color-sidebar-badge-bg': '나를 부른 수(멘션) 배지 바탕',
  '--color-sidebar-badge-fg': '멘션 배지 글자',
  '--color-sidebar-rail-bg': '워크스페이스 레일 바탕',
  '--shadow-sm': '보드 카드 · 세그먼트 선택 칸 · 로그인 카드 (지표 타일 · 위젯 · 일반 카드는 그림자 없음)',
  '--shadow-md': '(정의만 있음 — 현재 부품에서 쓰지 않음)',
  '--shadow-lg': '드롭다운 · 팝오버 · 차트 툴팁',
  '--shadow-overlay': '모달 · 명령 팔레트 · 서랍 · 토스트 · 하단 선택 바 · 저장 바',
  '--layout-sidebar-width': '사이드바 칸 폭 (레일 + 탐색)',
  '--layout-sidebar-collapsed-width': '접힌 사이드바 폭',
  '--layout-rail-width': '워크스페이스 레일 폭',
  '--layout-topbar-height': '상단바 높이',
  '--layout-right-panel-width': '우측 패널 폭 · 기본 서랍 폭',
  '--layout-right-panel-wide-width': '넓은 서랍 폭 (우측 패널은 항상 기본 폭)',
  '--layout-content-max-width': '본문 최대 폭',
  '--layout-page-padding-x': '본문 좌우 여백',
  '--layout-page-padding-y': '본문 위아래 여백',
  '--duration-instant': '색 바뀜 · 행 · 버튼 hover',
  '--duration-fast': '모달 · 명령 팔레트 · 토스트 · 하단 바 등장, 덮는 막, 스위치',
  '--duration-normal': '서랍 · 1024px 미만 사이드바가 밀려 들어옴, 사이드바 접기',
  '--duration-slow': '(정의만 있음 — 현재 부품에서 쓰지 않음)',
  '--easing-standard': '기본 곡선',
  '--easing-enter': '나타날 때',
  '--easing-exit': '사라질 때 (정의만 있음 — 사라지는 효과를 쓰는 부품 없음)',
  '--chart-grid': '눈금선',
  '--chart-axis': '축선',
  '--chart-seq-fg': '순차형 칸 위 글자 (1~4단계)',
  '--chart-seq-fg-strong': '순차형 칸 위 글자 (가장 진한 단계)',
}
for (const n of NAMES) {
  const series = /^--chart-(\d+)$/.exec(n)
  if (series) USE[n] ??= `계열 ${series[1]}번`
  const seq = /^--chart-seq-(\d+)$/.exec(n)
  if (seq) {
    const last = Math.max(...NAMES.map((m) => Number(/^--chart-seq-(\d+)$/.exec(m)?.[1] ?? 0)))
    USE[n] ??= `순차형 ${seq[1]}단계${seq[1] === '1' ? ' (가장 옅음)' : Number(seq[1]) === last ? ' (가장 진함)' : ''}`
  }
}

/* ── CSS 블록 ────────────────────────────────────────────────── */

/** 긴 서체 목록은 원본처럼 쉼표 뒤에서 줄을 나눕니다 */
function formatValue(name, value, indent) {
  if (!name.startsWith('--font-') || value.length < 70) return value
  const lines = []
  let cur = ''
  for (const part of value.split(/,\s*/)) {
    const next = cur ? `${cur}, ${part}` : part
    if (next.length > 66 && cur) { lines.push(cur + ','); cur = part } else cur = next
  }
  lines.push(cur)
  return lines.join('\n' + ' '.repeat(indent + 4))
}
function cssBody(values, only, indent) {
  const pad = ' '.repeat(indent)
  const names = NAMES.filter((n) => !only || only.has(n))
  const width = Math.max(...names.map((n) => n.length)) + 1
  const out = []
  for (const [, label, f] of GROUPS) {
    const group = names.filter(f)
    if (!group.length) continue
    out.push('', `${pad}/* ${label} */`)
    for (const n of group) out.push(`${pad}${(n + ':').padEnd(width)} ${formatValue(n, values[n], indent)};`)
  }
  return out.join('\n')
}
/* 다크 블록에는 라이트와 값이 다른 것만 싣습니다 — 같은 값은 :root 에서 내려옵니다 */
const changed = new Set(NAMES.filter((n) => L[n] !== D[n]))
const tokenCss = [
  `/* HCT 디자인 토큰 — 팔레트 ${DEFAULT} · 생성 파일이므로 값을 고치지 마세요.`,
  `   화면 코드에서는 var(--…) 로만 참조합니다. */`,
  `:root {`,
  `  color-scheme: light;` + cssBody(L, null, 2),
  `}`,
  ``,
  `/* 다크 — 운영체제 설정을 따릅니다. data-theme="light" 로 고정한 경우는 제외 */`,
  `@media (prefers-color-scheme: dark) {`,
  `  :root:not([data-theme="light"]) {`,
  `    color-scheme: dark;` + cssBody(D, changed, 4),
  `  }`,
  `}`,
  ``,
  `/* 다크 — <html data-theme="dark"> 로 강제 */`,
  `:root[data-theme="dark"] {`,
  `  color-scheme: dark;` + cssBody(D, changed, 2),
  `}`,
].join('\n')

/* ── 표 ──────────────────────────────────────────────────────── */

const code = (v) => '`' + v + '`'
function table(key) {
  const group = GROUPS.find(([k]) => k === key)
  if (!group) throw new Error(`템플릿의 {{TABLE:${key}}} — 없는 묶음입니다`)
  const rows = NAMES.filter(group[2])
  const missing = rows.filter((n) => !USE[n])
  if (missing.length) {
    throw new Error(`용도 설명이 없는 토큰: ${missing.join(', ')} — scripts/build-design-md.mjs 의 USE 에 넣으세요`)
  }
  /* 치수 · 시간은 테마와 무관하므로 값 한 열만 둡니다 */
  if (rows.every((n) => L[n] === D[n]) && ['layout', 'motion'].includes(key)) {
    return ['| 변수 | 값 | 의미 |', '|---|---|---|',
      ...rows.map((n) => `| ${code(n)} | ${code(L[n])} | ${USE[n]} |`)].join('\n')
  }
  return ['| 변수 | 용도 | 라이트 | 다크 |', '|---|---|---|---|',
    ...rows.map((n) => `| ${code(n)} | ${USE[n]} | ${code(L[n])} | ${L[n] === D[n] ? '같음' : code(D[n])} |`)].join('\n')
}

/* ── 상태: 배지 컴포넌트의 표를 그대로 읽습니다 ───────────────────────── */

const badgeSrc = read('src/components/feedback/StatusBadge.jsx')
const badgeStart = badgeSrc.indexOf('WORKFLOW_STATUS = {')
const badgeBlock = badgeSrc.slice(badgeStart, badgeSrc.indexOf('\n}', badgeStart))
const STATUSES = [...badgeBlock.matchAll(/^\s*(\w+):\s*\{\s*tone:\s*'(\w+)',\s*label:\s*'([^']+)'/gm)]
  .map((m) => ({ name: m[1], tone: m[2], label: m[3] }))
const TONES = {
  neutral: '회색', info: '파랑', review: '보라', success: '초록', warning: '주황', danger: '빨강',
}
if (badgeStart === -1 || STATUSES.length < Object.keys(TONES).length) {
  throw new Error('StatusBadge.jsx 의 WORKFLOW_STATUS 를 읽지 못했습니다 — 형식이 바뀌었으면 이 파서를 고치세요')
}
for (const s of STATUSES) if (!TONES[s.tone]) throw new Error(`알 수 없는 색조: ${s.name} → ${s.tone}`)
const statusMap = ['| 상태 이름 | 색조 | 기본 라벨 |', '|---|---|---|',
  ...STATUSES.map((s) => `| ${code(s.name)} | ${TONES[s.tone]} (${s.tone}) | ${s.label} |`)].join('\n')
const toneUses = {}
for (const s of STATUSES) (toneUses[s.tone] ??= []).push(s.label)
const pair = (n) => `${code(L[n])} / ${code(D[n])}`
const statusTones = ['| 색조 | 쓰는 상태 | 바탕 `bg` | 테두리 `border` | 글자 `text` | 채움 `solid` |', '|---|---|---|---|---|---|',
  ...Object.entries(TONES).map(([t, ko]) =>
    `| ${ko} \`${t}\` | ${(toneUses[t] ?? []).join(' · ')} | ${pair(`--color-${t}-bg`)} | ${pair(`--color-${t}-border`)} | ${pair(`--color-${t}-text`)} | ${pair(`--color-${t}-solid`)} |`)].join('\n')

/* ── 패키지 · 로고 주소 ──────────────────────────────────────── */

const pkg = JSON.parse(read('package.json'))
const slug = /github\.com\/([^/]+\/[^/.]+)/.exec(pkg.repository?.url ?? '')?.[1]
if (!slug) throw new Error('package.json 의 repository.url 에서 GitHub 저장소를 찾지 못했습니다')
const REPO_URL = `https://github.com/${slug}`
/* main 을 가리킵니다 — release/ 브랜치는 만든 뒤 다시 밀지 않으므로 그 뒤에 들어온 파일이 없습니다 */
const RAW_BASE = `https://raw.githubusercontent.com/${slug}/main`

function pngSize(path) {
  const fd = openSync(ROOT + path, 'r')
  const head = Buffer.alloc(24)
  readSync(fd, head, 0, 24, 0)
  closeSync(fd)
  return `${head.readUInt32BE(16)}×${head.readUInt32BE(20)}`
}
const LOGOS = [
  ['hct-logo-color.png', '밝은 면'],
  ['hct-logo-white.png', '어두운 면 (사이드바)'],
  ['hct-mark-color.png', '밝은 면 · 좁은 자리'],
  ['hct-mark-white.png', '어두운 면 · 좁은 자리'],
]
const logoRows = LOGOS.map(([file, where]) =>
  `| ${code(file)} | ${where} | ${pngSize(`src/assets/brand/${file}`)} | ${RAW_BASE}/src/assets/brand/${file} |`).join('\n')

/* ── 셸 도식: ASCII 만 써서 어떤 고정폭 글꼴에서도 줄이 맞게, 치수는 토큰에서 ── */

function shellDiagram() {
  const px = (n) => parseInt(L[n], 10)
  const SPLIT = Symbol('split') // 사이드바 머리 · 상단바 아래 경계 (둘 다 상단바 높이)
  const rail = px('--layout-rail-width')
  const side = px('--layout-sidebar-width')
  const rows = [
    ['RAIL', 'logo + env', `TOPBAR  height ${L['--layout-topbar-height']}`, 'RIGHT PANEL'],
    [`${rail}px`, SPLIT, SPLIT, L['--layout-right-panel-width']],
    ['(opt.)', `NAV  ${side - rail}px`, `MAIN  padding ${L['--layout-page-padding-x']} x ${L['--layout-page-padding-y']}`, 'open only while'],
    ['', 'nav groups', '  page header: title + actions', 'an item is'],
    ['', '', `  content  max-width ${L['--layout-content-max-width']}`, 'selected'],
    ['', 'user', '', ''],
  ]
  const text = (c) => (c === SPLIT ? '' : c)
  const widths = [0, 1, 2, 3].map((i) => Math.max(...rows.map((r) => text(r[i]).length)) + 2)
  const label = ` sidebar ${side}px `
  const span = () => 1 + widths[0] + 1 + widths[1] + 1
  if (span() < label.length + 6) widths[1] += label.length + 6 - span()
  const rule = '+' + widths.map((w) => '-'.repeat(w)).join('+') + '+'
  const line = (r) => r.reduce((acc, c, i) => (c === SPLIT
    ? acc.slice(0, -1) + '+' + '-'.repeat(widths[i]) + '+'
    : acc + ' ' + c.padEnd(widths[i] - 1) + '|'), '|')
  const dashes = span() - 4 - label.length
  const brace = '|<' + '-'.repeat(Math.floor(dashes / 2)) + label + '-'.repeat(Math.ceil(dashes / 2)) + '>|'
  const out = [rule, ...rows.map(line), rule, brace]
  for (const l of out) if (/[^\x20-\x7e]/.test(l)) throw new Error(`셸 도식에 ASCII 밖 문자: ${l}`)
  for (const l of out.slice(0, -1)) if (l.length !== rule.length) throw new Error(`셸 도식 정렬 실패: ${l}`)
  return out.join('\n')
}

/* ── 채우기 ──────────────────────────────────────────────────── */

const FILL = {
  CSS: tokenCss,
  BASE_CSS: read('src/styles/base.css').trimEnd(),
  STATUS_MAP: statusMap,
  STATUS_TONES: statusTones,
  LOGO_ROWS: logoRows,
  SHELL_DIAGRAM: shellDiagram(),
  PALETTES: paletteTable,
  PALETTE_COUNT: String(palettes.length),
  OTHER_PALETTES: palettes.map(([id]) => id).filter((id) => id !== DEFAULT).join(' · '),
  DEFAULT_PALETTE: DEFAULT,
  DEFAULT_TAGLINE: palettes.find(([id]) => id === DEFAULT)[1].tagline,
  PKG_NAME: pkg.name,
  VERSION: pkg.version,
  INSTALL: `npm i github:${slug}#release/v${pkg.version}`,
  REPO_URL,
  RAW_BASE,
}

/* 치환 문자열은 함수로 넘깁니다 — 문자열로 넘기면 값 속의 $& · $1 이 특수 문자로 읽힙니다 */
let md = read('scripts/design-md.template.md')
  .replace(/\{\{TABLE:(\w+)\}\}/g, (_, key) => table(key))
  .replace(/\{\{L:(--[a-z0-9-]+)\}\}/g, (_, n) => {
    if (!(n in L)) throw new Error(`템플릿이 없는 토큰을 가리킵니다: ${n}`)
    return L[n]
  })
  .replace(/\{\{([A-Z_]+)\}\}/g, (whole, key) => {
    if (!(key in FILL)) throw new Error(`템플릿의 ${whole} — 채울 값이 없습니다`)
    return FILL[key]
  })
const left = md.match(/\{\{[^}]*\}\}/g)
if (left) throw new Error(`채우지 못한 자리: ${left.join(', ')}`)
if (!md.endsWith('\n')) md += '\n'

writeFileSync(ROOT + 'DESIGN.md', md)
console.log(`DESIGN.md 생성 — 토큰 ${NAMES.length}개(다크에서 바뀌는 것 ${changed.size}개) · 상태 ${STATUSES.length}개 · 팔레트 ${palettes.length}종 · ${md.split('\n').length - 1}줄`)
