// 부품 카드의 HTML + CSS 를 실제 React 컴포넌트와 브라우저에서 대조합니다.
//
//   npm run audit:cards
//
// DESIGN.md §7 의 카드는 "패키지 없이 이 HTML + CSS 를 쓰면 같은 부품" 을
// 약속합니다. 이 약속을 문장 비교로는 확인할 수 없으므로 양쪽을 실제로 그립니다.
//
//   저장소 쪽 — 컴포넌트를 Vite 로 서버 렌더링 → 그 마크업으로 Tailwind 를 돌린 CSS
//               (tokens · palettes · adaptive · base 포함 — 소비 앱과 같은 순서)
//   md 쪽 ..... DESIGN.md 에 적힌 CSS 만 (§2-1 세 블록 + §7 의 공통 · 카드 CSS)
//               + 카드 probes 의 HTML
//
// 두 쪽의 같은 요소를 계산된 스타일(크기 · 여백 · 글자 · 색 · 테두리 · 그림자)로
// 비교합니다. hover 가 걸린 probe 는 마우스를 올린 뒤 한 번 더 비교합니다.
//
// 모드: 라이트 · 다크 · 대비 증가 · 손가락 입력(모바일 터치)
//   대비 증가 · 손가락 입력에서도 같아야 md 의 CSS 가 숫자를 직접 쓰지 않고
//   토큰(var)을 쓴다는 것이 증명됩니다.
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import { readFileSync, existsSync } from 'node:fs'
import { CARDS } from './component-cards.mjs'

const PREINSTALLED = '/opt/pw-browsers/chromium'
const read = (p) => readFileSync(p, 'utf8')
const failures = []

/* ── 1. 저장소 쪽: 서버 렌더링 ───────────────────────────────── */

const vite = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
  optimizeDeps: { noDiscovery: true, include: [] },
})
const C = await vite.ssrLoadModule('/src/components/index.js')
const fnProps = (props) => Object.fromEntries(Object.entries(props).map(([k, v]) => [k, v === '__fn' ? () => {} : v]))

const probes = []
for (const card of CARDS) {
  for (const p of card.probes) {
    const [name, props] = p.react
    if (!C[name]) { failures.push(`${card.id} · ${p.label}: 패키지에 ${name} 없음`); continue }
    probes.push({ card: card.id, ...p, repoHtml: renderToStaticMarkup(createElement(C[name], fnProps(props))) })
  }
}
await vite.close()

/* ── 2. 저장소 쪽 CSS: 소비 앱과 같은 순서로 Tailwind 를 돌립니다 ───────── */

const preset = (await import('../tailwind-preset.js')).default
const repoInput = [
  read('src/styles/tokens.css'), read('src/styles/palettes.css'), read('src/styles/adaptive.css'),
  '@tailwind base;', '@tailwind components;', '@tailwind utilities;', read('src/styles/base.css'),
].join('\n')
const repoCss = (await postcss([tailwindcss({
  presets: [preset],
  content: [{ raw: probes.map((p) => p.repoHtml).join('\n'), extension: 'html' }],
})]).process(repoInput, { from: undefined })).css

/* ── 3. md 쪽 CSS: DESIGN.md 에 적힌 것만 ─────────────────────── */

const md = read('DESIGN.md')
const between = (a, b) => md.slice(md.indexOf(a), md.indexOf(b))
const fences = (text) => [...text.matchAll(/```css\n([\s\S]*?)\n```/g)].map((m) => m[1])
const tokenBlocks = fences(between('### 2-1', '### 2-2'))
const cardBlocks = fences(between('## 7. 부품 규격', '## 8.'))
if (tokenBlocks.length !== 3) failures.push(`§2-1 의 CSS 블록이 3개가 아닙니다 (${tokenBlocks.length})`)
if (cardBlocks.length < CARDS.length) failures.push(`§7 의 CSS 블록이 카드 수보다 적습니다 (${cardBlocks.length})`)
const mdCss = [...tokenBlocks, ...cardBlocks].join('\n')

/* ── 4. 비교 ─────────────────────────────────────────────────── */

const TEXT = ['fontSize', 'lineHeight', 'fontWeight', 'letterSpacing', 'color', 'fontFamily', 'fontVariantNumeric']
const BOX = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderTopStyle',
  'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
  'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius',
  'backgroundColor', 'boxShadow', 'opacity', 'columnGap', 'rowGap', 'maxWidth', 'marginTop', 'marginBottom']
const LAYOUT = ['display', 'flexDirection', 'alignItems', 'justifyContent', 'whiteSpace', 'textAlign', 'cursor', 'overflowX']
const SETS = {
  full: { keys: [...TEXT, ...BOX, ...LAYOUT], rect: ['width', 'height'] },
  box: { keys: [...TEXT, ...BOX, ...LAYOUT], rect: [] },
  'box-nolayout': { keys: [...TEXT, ...BOX], rect: ['width'] },
}

/* Tailwind 는 그림자를 링 변수와 합쳐 "투명 0 0 0 0" 조각을 붙입니다 — 보이는 결과가 같으므로 걷어냅니다 */
const normShadow = (v) => {
  const parts = v.split(/,(?![^(]*\))/).map((s) => s.trim()).filter((s) => !/^rgba\(0, 0, 0, 0\) 0px 0px 0px 0px$/.test(s) && s !== 'none')
  return parts.length ? parts.join(', ') : 'none'
}

const MODES = [
  { label: '라이트', theme: null },
  { label: '다크', theme: 'dark' },
  { label: '대비 증가', theme: null, contrast: 'more' },
  { label: '대비 증가 · 다크', theme: 'dark', contrast: 'more' },
  { label: '손가락 입력', theme: null, touch: true },
]

const browser = await chromium.launch({
  ...(existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {}),
  args: ['--disable-background-networking', '--no-first-run', '--disable-component-update'],
})

async function openSide(css, mode) {
  const ctx = await browser.newContext(mode.touch
    ? { viewport: { width: 1280, height: 900 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 }
    : { viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  /* 전환 효과가 hover 중간값을 읽게 하지 않도록 — 양쪽 다 base.css 의 동작 줄이기 규칙을 씁니다 */
  await page.emulateMedia({ reducedMotion: 'reduce', ...(mode.contrast ? { contrast: mode.contrast } : {}) })
  await page.setContent(`<!doctype html><html${mode.theme ? ` data-theme="${mode.theme}"` : ''}><head><meta charset="utf-8"><style>${css}</style></head><body><div id="probe"></div></body></html>`)
  return { ctx, page }
}

async function measure(page, html, select, set) {
  await page.evaluate((h) => { document.getElementById('probe').innerHTML = h }, html)
  /* 등장 애니메이션(동작 줄이기에서 0.01ms)이 끝난 뒤의 값을 읽습니다 */
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))))
  const sel = `#probe ${select ?? '> *'}`
  const read = () => page.evaluate(([s, keys, rect]) => {
    const el = document.querySelector(s)
    if (!el) return null
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const out = Object.fromEntries(keys.map((k) => [k, cs[k]]))
    for (const k of rect) out[`rect.${k}`] = String(Math.round(r[k] * 100) / 100)
    return out
  }, [sel, SETS[set].keys, SETS[set].rect])
  return { sel, read }
}

let compared = 0
for (const mode of MODES) {
  const repo = await openSide(repoCss, mode)
  const mine = await openSide(mdCss, mode)
  let modeFail = 0
  for (const p of probes) {
    const set = p.props ?? 'full'
    const a = await measure(repo.page, p.repoHtml, p.select, set)
    const b = await measure(mine.page, p.html, p.select, set)
    const rounds = [['', null]]
    if (p.hover && !mode.touch) rounds.push([' · hover', true])
    for (const [suffix, hover] of rounds) {
      if (hover) {
        await repo.page.hover(a.sel, { force: true })
        await mine.page.hover(b.sel, { force: true })
        /* :hover 는 다음 프레임에 반영됩니다 — 바로 읽으면 첫 probe 에서 hover 전 값이 나옵니다 */
        for (const pg of [repo.page, mine.page]) await pg.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      }
      const [x, y] = [await a.read(), await b.read()]
      if (hover) {
        await repo.page.mouse.move(0, 0)
        await mine.page.mouse.move(0, 0)
      }
      compared++
      const where = `${mode.label} · ${p.card} · ${p.label}${suffix}`
      if (!x || !y) { failures.push(`${where}: 요소 없음 (${!x ? '저장소' : 'md'} 쪽 ${p.select ?? '첫 요소'})`); modeFail++; continue }
      x.boxShadow = normShadow(x.boxShadow); y.boxShadow = normShadow(y.boxShadow)
      /* 두께 0 인 테두리의 스타일 · 색은 보이지 않습니다 (Tailwind 초기화 CSS 는 모든 요소에 solid 를 겁니다) */
      for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
        if (x[`border${side}Width`] === '0px' && y[`border${side}Width`] === '0px') {
          for (const o of [x, y]) { delete o[`border${side}Color`]; delete o[`border${side}Style`] }
        }
      }
      const diff = Object.keys(x).filter((k) => x[k] !== y[k])
      if (diff.length) {
        modeFail++
        failures.push(`${where}: ${diff.map((k) => `${k} 저장소 "${x[k]}" / md "${y[k]}"`).join(' · ')}`)
      }
    }
  }
  console.log(`  ${modeFail ? '✗' : '✓'} ${mode.label.padEnd(12)} probe ${probes.length}개`)
  await repo.ctx.close()
  await mine.ctx.close()
}
await browser.close()

const covered = CARDS.filter((c) => c.probes.length).length
console.log()
if (failures.length) {
  for (const f of failures) console.log(`  ✗ ${f}`)
  console.log(`\n✗ 부품 카드 대조 실패 ${failures.length}건 — scripts/component-cards.mjs 의 CSS 를 컴포넌트에 맞추고 'npm run tokens:build'`)
  process.exit(1)
}
console.log(`✓ 부품 카드 ${covered}/${CARDS.length}장 · 비교 ${compared}회 — md 의 HTML + CSS 가 React 컴포넌트와 같게 그려집니다`)
console.log(`  (대조 없는 카드: ${CARDS.filter((c) => !c.probes.length).map((c) => c.id).join(' · ')} — 토큰 · 소스 키 검사만)`)
