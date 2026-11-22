// Apple HIG 에서 옮긴 기준을 실제 화면에서 잽니다.
//
//   npm run audit:hig            (빌드 → 미리보기 서버 → 검사 → 정리)
//   node scripts/audit-hig.mjs 4173   (이미 떠 있는 서버에 붙기)
//
// 토큰 값 · CSS 문장은 test/hig.test.mjs 가 봅니다. 여기서는 "사용자가 운영체제
// 설정을 켰을 때 화면이 정말 그렇게 바뀌는가" 를 브라우저로 확인합니다.
//
//   ① 대비 증가   prefers-contrast: more 에서 토큰이 진해지고, WCAG AA 대비 위반 0,
//                 AAA(7:1) 위반이 보통 대비보다 줄어든다
//   ② 손가락 입력 터치 기기에서 컨트롤 · 표 행 토큰을 쓰는 요소가 모두 44px 이상,
//                 가상 스크롤 표의 행이 실제 높이와 맞는다
//   ③ 글자 크기   기본 글자 크기를 16 → 20px 로 키우면 화면 글자가 모두 1.25배
//   ④ 움직임     prefers-reduced-motion 에서 0.01ms 를 넘는 애니메이션 · 전환이 0
//
// 44px 에 못 미치는 나머지 누름 요소(표 안 체크박스 · 닫기 ✕ 등)는 실패로 치지 않고
// 목록으로 보여줍니다 — 토큰 밖에서 크기를 정한 곳이라 부품마다 고쳐야 합니다.
import { chromium } from 'playwright'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'

const PREINSTALLED = '/opt/pw-browsers/chromium'
const require = createRequire(import.meta.url)
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
const palettes = JSON.parse(readFileSync('tokens/palettes.json', 'utf8'))

const PAGES = ['login', 'invite', 'reset-request', 'reset', 'onboarding', 'dashboard', 'list',
  'scale', 'inbox', 'import', 'approvals', 'jobs', 'search', 'admin', 'audit',
  'integrations', 'billing', 'settings', 'account', 'errors']

/* ── 서버 (audit-a11y.mjs 와 같은 방식) ─────────────────────────── */
async function freePort() {
  const { createServer } = await import('node:net')
  return new Promise((ok, no) => {
    const s = createServer()
    s.on('error', no)
    s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => ok(String(port))) })
  })
}
const GIVEN_PORT = process.argv[2]
const PORT = GIVEN_PORT ?? (await freePort())
let server = null
if (!GIVEN_PORT) {
  if (!existsSync('dist/index.html')) {
    console.log('✗ dist/index.html 이 없습니다 — npm run build 를 먼저 (npm run audit:hig 는 자동으로 합니다)')
    process.exit(1)
  }
  server = spawn('npx', ['vite', 'preview', '--port', PORT, '--strictPort'], { stdio: ['ignore', 'pipe', 'inherit'] })
  await new Promise((resolve, reject) => {
    const bail = setTimeout(() => reject(new Error('미리보기 서버가 30초 안에 안 떴습니다')), 30_000)
    server.stdout.on('data', (c) => { if (String(c).includes(PORT)) { clearTimeout(bail); resolve() } })
    server.on('exit', (code) => { clearTimeout(bail); reject(new Error(`미리보기 서버 종료 (${code})`)) })
  })
}
const stopServer = () => { if (server && !server.killed) server.kill('SIGTERM') }
process.on('exit', stopServer)
process.on('SIGINT', () => { stopServer(); process.exit(130) })

const browser = await chromium.launch({
  ...(existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {}),
  args: ['--disable-background-networking', '--no-first-run', '--disable-component-update'],
})

async function open(id, { theme = 'light', touch = false, media = {}, rootPx = null, width = 1440, height = 900 } = {}) {
  const ctx = await browser.newContext(touch
    ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 }
    : { viewport: { width, height } })
  const page = await ctx.newPage()
  await page.route('**://**', (r) => (r.request().url().includes('127.0.0.1') ? r.continue() : r.abort()))
  await page.addInitScript((t) => { try { localStorage.setItem('hct-theme', t) } catch {} }, theme)
  if (Object.keys(media).length) await page.emulateMedia(media)
  /* 브라우저 설정의 "글꼴 크기" 는 문서 루트의 기본 글자 크기를 바꿉니다 — 같은 효과를 냅니다 */
  if (rootPx) await page.addInitScript((px) => {
    document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.fontSize = px + 'px' })
  }, rootPx)
  await page.goto(`http://127.0.0.1:${PORT}/?page=${id}`, { waitUntil: 'load' })
  await page.waitForTimeout(250)
  return { ctx, page }
}

const failures = []
const notes = []
const ok = (msg) => console.log(`  ✓ ${msg}`)

/* ── ① 대비 증가 ──────────────────────────────────────────────── */
console.log('① 대비 증가 (prefers-contrast: more)')
{
  const more = palettes.hct.contrastMore
  const varsOf = (page, names) => page.evaluate((ns) => {
    const cs = getComputedStyle(document.documentElement)
    return Object.fromEntries(ns.map((n) => [n, cs.getPropertyValue(n).trim().toUpperCase()]))
  }, names)
  for (const theme of ['light', 'dark']) {
    const expect = more[theme]
    const { ctx, page } = await open('dashboard', { theme, media: { contrast: 'more' } })
    const got = await varsOf(page, Object.keys(expect))
    const bad = Object.keys(expect).filter((n) => got[n] !== expect[n])
    if (bad.length) failures.push(`대비 증가 ${theme}: 토큰이 바뀌지 않음 — ${bad.map((n) => `${n} ${got[n]} (기대 ${expect[n]})`).join(', ')}`)
    else ok(`${theme}: 토큰 ${Object.keys(expect).length}개가 대비 증가 값으로 바뀜`)
    await page.evaluate(() => document.documentElement.setAttribute('data-contrast', 'normal'))
    const off = await varsOf(page, Object.keys(expect))
    if (Object.keys(expect).some((n) => off[n] === expect[n] && n !== '--color-accent-border')) {
      failures.push(`대비 증가 ${theme}: data-contrast="normal" 로 꺼지지 않음`)
    } else ok(`${theme}: data-contrast="normal" 이면 원래 값`)
    await ctx.close()
  }
  /* 기본 화면은 그대로여야 합니다 */
  const plain = await open('dashboard')
  const base = await plain.page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim().toUpperCase())
  await plain.ctx.close()
  if (base === more.light['--color-text-secondary']) failures.push('설정을 켜지 않았는데 대비 증가 값이 걸렸습니다')
  else ok('설정을 켜지 않은 화면은 원래 값')

  const axeRun = async (page, tags) => {
    await page.addScriptTag({ content: axeSource })
    return page.evaluate(async (t) => (await window.axe.run(document, {
      runOnly: { type: 'rule', values: t }, exclude: [['[data-preview-chrome]']],
    })).violations.reduce((s, v) => s + v.nodes.length, 0), tags)
  }
  /* 대비 비교는 글자 종류가 많은 화면만 — 20개 화면 전부는 axe 가 수 분 걸립니다 */
  const CONTRAST_PAGES = ['dashboard', 'list', 'inbox', 'settings', 'approvals', 'login']
  let aa = 0, aaaNormal = 0, aaaMore = 0
  for (const theme of ['light', 'dark']) {
    for (const id of CONTRAST_PAGES) {
      const n = await open(id, { theme })
      aaaNormal += await axeRun(n.page, ['color-contrast-enhanced'])
      await n.ctx.close()
      const m = await open(id, { theme, media: { contrast: 'more' } })
      aa += await axeRun(m.page, ['color-contrast'])
      aaaMore += await axeRun(m.page, ['color-contrast-enhanced'])
      await m.ctx.close()
    }
  }
  if (aa) failures.push(`대비 증가에서 WCAG AA 대비 위반 ${aa}건`)
  else ok(`대비 증가에서 AA 대비 위반 0 (${CONTRAST_PAGES.length}개 화면 × 2테마)`)
  if (aaaMore >= aaaNormal) failures.push(`AAA(7:1) 위반이 줄지 않음: 보통 ${aaaNormal} → 대비 증가 ${aaaMore}`)
  else ok(`AAA(7:1) 위반 요소 ${aaaNormal} → ${aaaMore} (${Math.round((1 - aaaMore / aaaNormal) * 100)}% 감소)`)
  if (aaaMore) notes.push(`대비 증가에서도 남는 AAA 위반 ${aaaMore}건 — 상태 채움 · 차트 · 강조 바탕 위 글자 등 AA 기준으로 설계된 곳`)
}

/* ── ② 손가락 입력 ────────────────────────────────────────────── */
console.log('\n② 손가락 입력 (pointer: coarse · 390px 터치)')
{
  const small = new Map()
  let tokenChecked = 0
  for (const id of PAGES) {
    const { ctx, page } = await open(id, { touch: true })
    const r = await page.evaluate(() => {
      const coarse = matchMedia('(pointer: coarse)').matches
      const sel = 'button, a[href], input:not([type=hidden]), select, textarea, [role=tab], [role=button], [role=checkbox], [role=switch], summary'
      const out = { coarse, token: [], small: [] }
      for (const el of document.querySelectorAll(sel)) {
        if (el.closest('[data-preview-chrome]')) continue
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        if (!r.width || !r.height || cs.visibility === 'hidden') continue
        const cls = typeof el.className === 'string' ? el.className : ''
        const label = (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 24)
        if (/\bh-control-(xs|sm|md|lg)\b/.test(cls)) out.token.push({ h: r.height, label, cls: cls.match(/h-control-\w+/)[0] })
        else if (r.height < 44 || r.width < 24) out.small.push(`${el.tagName.toLowerCase()} "${label}" ${Math.round(r.width)}×${Math.round(r.height)}`)
      }
      return out
    })
    if (!r.coarse) failures.push(`${id}: 터치 에뮬레이션에서 pointer: coarse 가 아님`)
    for (const t of r.token) {
      tokenChecked++
      if (t.h < 44) failures.push(`${id}: ${t.cls} 요소 "${t.label}" 높이 ${t.h}px < 44`)
    }
    for (const s of r.small) small.set(s, (small.get(s) ?? 0) + 1)
    await ctx.close()
  }
  ok(`컨트롤 토큰을 쓰는 누름 요소 ${tokenChecked}개 검사 — 44px 미만은 실패로 처리`)
  if (small.size) notes.push(`토큰 밖 44px 미만 누름 요소 ${small.size}종 (예: ${[...small.keys()].slice(0, 5).join(' · ')})`)

  /* 가상 스크롤 표: 행 높이 토큰을 읽어 계산이 실제와 맞는가 */
  const { ctx, page } = await open('scale', { touch: true })
  const rows = await page.evaluate(() => [...document.querySelectorAll('tbody tr')].slice(0, 20)
    .map((tr) => Math.round(tr.getBoundingClientRect().height)))
  const spacer = await page.evaluate(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--row-height-default').trim()
    return v
  })
  await ctx.close()
  const distinct = [...new Set(rows)]
  if (!rows.length) notes.push('scale 화면에서 표 행을 찾지 못해 가상 스크롤 행 높이를 확인하지 못했습니다')
  else if (distinct.some((h) => h < 44)) failures.push(`터치에서 표 행 높이 ${distinct.join('/')}px — 44px 미만`)
  else ok(`터치에서 표 행 ${distinct.join('/')}px (토큰 --row-height-default = ${spacer})`)
}

/* ── ③ 사용자 글자 크기 ───────────────────────────────────────── */
console.log('\n③ 사용자 글자 크기 (기본 16 → 20px)')
{
  const sizes = (page) => page.evaluate(() => {
    const out = []
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const seen = new Set()
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const el = n.parentElement
      if (!n.textContent.trim() || !el || seen.has(el) || el.closest('svg, [data-preview-chrome]')) continue
      seen.add(el)
      out.push(parseFloat(getComputedStyle(el).fontSize))
    }
    return out
  })
  let total = 0
  const fixed = new Map()
  for (const id of ['dashboard', 'list', 'settings', 'inbox', 'login']) {
    const a = await open(id)
    const b = await open(id, { rootPx: 20 })
    const [x, y] = [await sizes(a.page), await sizes(b.page)]
    await a.ctx.close(); await b.ctx.close()
    const n = Math.min(x.length, y.length)
    total += n
    for (let i = 0; i < n; i++) {
      if (Math.abs(y[i] / x[i] - 1.25) > 0.01) fixed.set(`${id}: ${x[i]}px → ${y[i]}px`, true)
    }
  }
  if (fixed.size) failures.push(`글자 크기를 따르지 않는 글자 ${fixed.size}종: ${[...fixed.keys()].slice(0, 6).join(' · ')}`)
  else ok(`글자 요소 ${total}개가 모두 1.25배로 커짐 (5개 화면)`)
}

/* ── ④ 움직임 줄이기 ──────────────────────────────────────────── */
console.log('\n④ 움직임 줄이기 (prefers-reduced-motion: reduce)')
{
  let moving = 0, seen = 0
  for (const id of PAGES) {
    const { ctx, page } = await open(id, { media: { reducedMotion: 'reduce' } })
    const r = await page.evaluate(() => {
      const ms = (v) => Math.max(...v.split(',').map((s) => (s.trim().endsWith('ms') ? parseFloat(s) : parseFloat(s) * 1000)))
      let moving = 0, seen = 0
      for (const el of document.querySelectorAll('*')) {
        const cs = getComputedStyle(el)
        const t = cs.transitionProperty !== 'none' && cs.transitionProperty !== 'all' ? ms(cs.transitionDuration) : 0
        const a = cs.animationName !== 'none' ? ms(cs.animationDuration) : 0
        if (t || a || cs.animationName !== 'none') seen++
        if (t > 0.01 || a > 0.01) moving++
      }
      return { moving, seen }
    })
    moving += r.moving; seen += r.seen
    await ctx.close()
  }
  if (moving) failures.push(`움직임 줄이기에서 0.01ms 를 넘는 전환 · 애니메이션 ${moving}개`)
  else ok(`전환 · 애니메이션이 걸린 요소 ${seen}개 모두 0.01ms 이하 (${PAGES.length}개 화면)`)
}

await browser.close()
console.log()
for (const n of notes) console.log(`  · 참고: ${n}`)
if (failures.length) {
  for (const f of failures) console.log(`  ✗ ${f}`)
  console.log(`\n✗ HIG 기준 실패 ${failures.length}건`)
  process.exit(1)
}
console.log('\n✓ HIG 기준 통과 — 대비 증가 · 손가락 입력 · 글자 크기 · 움직임 줄이기')
process.exit(0)
