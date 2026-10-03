// DESIGN.md 를 실제 브라우저로 검산합니다.
//
//   npm run audit:design-md
//
// DESIGN.md 는 "이 CSS 를 그대로 붙이면 패키지와 같은 값" 을 약속합니다.
// 생성기(build-design-md.mjs)는 브라우저 없이 css-vars.mjs 로 값을 계산하는데,
// 그 계산이 브라우저와 조금이라도 다르면 약속이 조용히 깨집니다. 그래서
// **md 에 적힌 CSS 블록만** 크로미엄에 넣은 결과와 **저장소 CSS** 를 넣은 결과를
// 테마 조합마다 비교합니다. 생성기를 거치지 않는 독립 검산입니다.
//
// 함께 보는 것:
//   - md 의 기본 레이어 블록이 src/styles/base.css 원문과 같은가
//   - 채우지 못한 자리표시({{…}})가 남았는가
//   - 표의 열 수가 머리행과 같은가 (어긋나면 마크다운 표가 깨져 보입니다)
//   - 셸 도식이 ASCII 만 쓰고 줄 폭이 같은가 (한글이 섞이면 글꼴마다 어긋납니다)
import { chromium } from 'playwright'
import { readFileSync, existsSync } from 'node:fs'

const PREINSTALLED = '/opt/pw-browsers/chromium'
const md = readFileSync('DESIGN.md', 'utf8')
const repoCss = readFileSync('src/styles/tokens.css', 'utf8') + '\n' + readFileSync('src/styles/palettes.css', 'utf8')

const failures = []
const fail = (msg) => failures.push(msg)

/* §2-1 안의 css 블록: [0] 토큰 · [1] 기본 레이어 */
const section = md.slice(md.indexOf('### 2-1'), md.indexOf('### 2-2'))
const fences = [...section.matchAll(/```css\n([\s\S]*?)\n```/g)].map((m) => m[1])
if (fences.length !== 2) {
  console.log(`✗ §2-1 의 CSS 블록이 2개가 아닙니다 (${fences.length}개)`)
  process.exit(1)
}
const [mdCss, mdBase] = fences

/* 저장소 CSS 에 선언된 시맨틱 변수 — 원시 팔레트(--hct-*)는 md 에 싣지 않습니다 */
const declared = (css) => [...new Set([...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]))]
const names = declared(repoCss).filter((n) => !n.startsWith('--hct-'))
const mdNames = declared(mdCss)
for (const n of names) if (!mdNames.includes(n)) fail(`md 에 없는 토큰: ${n}`)
for (const n of mdNames) if (!names.includes(n)) fail(`저장소에 없는 토큰이 md 에 있음: ${n}`)

const MODES = [
  { label: '속성 없음 · OS 라이트', os: 'light', theme: null },
  { label: 'data-theme=dark · OS 라이트', os: 'light', theme: 'dark' },
  { label: '속성 없음 · OS 다크', os: 'dark', theme: null },
  { label: 'data-theme=light · OS 다크', os: 'dark', theme: 'light' },
  { label: 'data-theme=dark · OS 다크', os: 'dark', theme: 'dark' },
]

const browser = await chromium.launch({
  /* 이 컨테이너에는 크로미엄이 미리 깔려 있습니다. CI 처럼 playwright 가
     직접 받아둔 환경에서는 지정하지 않아야 자기가 받은 것을 씁니다. */
  ...(existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {}),
  args: ['--disable-background-networking', '--no-first-run', '--disable-component-update'],
})

async function computed(css, mode) {
  const page = await browser.newPage()
  await page.emulateMedia({ colorScheme: mode.os })
  await page.setContent(`<!doctype html><html${mode.theme ? ` data-theme="${mode.theme}"` : ''}><head><style>${css}</style></head><body></body></html>`)
  const values = await page.evaluate((list) => {
    const cs = getComputedStyle(document.documentElement)
    const out = Object.fromEntries(list.map((n) => [n, cs.getPropertyValue(n).trim().replace(/\s+/g, ' ')]))
    out['color-scheme'] = cs.colorScheme
    return out
  }, names)
  await page.close()
  return values
}

console.log('DESIGN.md 의 CSS 를 브라우저로 검산합니다\n')
for (const mode of MODES) {
  const repo = await computed(repoCss, mode)
  const fromMd = await computed(mdCss, mode)
  const diff = [...names, 'color-scheme'].filter((n) => repo[n] !== fromMd[n])
  const empty = names.filter((n) => !fromMd[n])
  console.log(`  ${diff.length || empty.length ? '✗' : '✓'} ${mode.label.padEnd(26)} 토큰 ${names.length}개 + color-scheme`)
  for (const n of diff) fail(`${mode.label}: ${n} — 저장소 "${repo[n]}" / md "${fromMd[n]}"`)
  for (const n of empty) fail(`${mode.label}: ${n} 값이 비어 있음`)
}
await browser.close()

if (mdBase !== readFileSync('src/styles/base.css', 'utf8').trimEnd()) fail('기본 레이어 블록이 src/styles/base.css 원문과 다릅니다')

const placeholders = md.match(/\{\{[^}]*\}\}/g)
if (placeholders) fail(`채우지 못한 자리표시: ${placeholders.join(' ')}`)

/* 표 열 수 — 코드 블록 밖, 백틱 안의 | 는 세지 않습니다 */
const lines = md.split('\n')
let inFence = false
lines.forEach((line, i) => {
  if (/^\s*(>\s*)?```/.test(line)) { inFence = !inFence; return }
  if (inFence || !line.startsWith('|') || lines[i - 1]?.startsWith('|')) return
  const cells = (l) => l.replace(/`[^`]*`/g, 'x').split('|').length - 2
  for (let j = i; lines[j]?.startsWith('|'); j++) {
    if (cells(lines[j]) !== cells(line)) fail(`${j + 1}행: 표 열 ${cells(lines[j])}개 (머리행 ${cells(line)}개)`)
  }
})

/* 셸 도식 — 마지막 '|<…>|' 줄은 사이드바 칸 폭 표시라 짧습니다 */
const start = lines.findIndex((l, i) => l === '```' && lines[i + 1]?.startsWith('+-'))
if (start === -1) fail('셸 도식을 찾지 못했습니다')
else {
  const block = []
  for (let j = start + 1; lines[j] !== '```'; j++) block.push(lines[j])
  if (block.some((l) => /[^\x20-\x7e]/.test(l))) fail('셸 도식에 ASCII 밖 문자가 있습니다')
  const widths = new Set(block.filter((l) => !l.startsWith('|<')).map((l) => l.length))
  if (widths.size !== 1) fail(`셸 도식 줄 폭이 다릅니다: ${[...widths].join('/')}`)
}

console.log()
if (failures.length) {
  for (const f of failures) console.log(`  ✗ ${f}`)
  console.log(`\n✗ DESIGN.md 검산 실패 ${failures.length}건. 'npm run tokens:build' 로 다시 생성했는지 확인하세요.`)
  process.exit(1)
}
console.log(`✓ md 의 CSS 만으로 계산한 값이 저장소 CSS 와 같습니다 (테마 ${MODES.length}가지 × 토큰 ${names.length}개)`)
console.log('✓ 기본 레이어 원문 · 자리표시 · 표 열 · 셸 도식 정상')
