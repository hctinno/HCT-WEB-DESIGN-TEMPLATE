// 접근성 실측 — axe-core 로 모든 화면을 검사합니다.
//
//   npm run audit:a11y            (빌드 → 미리보기 서버 → 검사 → 정리)
//   node scripts/audit-a11y.mjs 4173   (이미 떠 있는 서버에 붙기)
//
// **운영 빌드**를 검사합니다. 개발 서버에는 Vite 가 심는 오류 오버레이
// (vite-error-overlay)가 shadow DOM 으로 들어 있어, 제품과 무관한 위반이
// 240건씩 잡힙니다. exclude 로 걸러보려 했지만 shadow DOM 을 통과하지
// 못했습니다 — 애초에 운영에 없는 것을 검사할 이유가 없습니다.
//
// AGENTS.md 는 "접근성 — 협상 불가" 라고 적어두었지만, 그동안 그 말을
// 측정으로 뒷받침한 적이 없었습니다. 눈으로 본 것과 도구가 재는 것은
// 다릅니다 — 특히 대비, 이름 없는 컨트롤, 중복 id, 중첩된 조작 요소는
// 사람 눈으로 훑어서는 잡히지 않습니다.
//
// WCAG 2.1 A/AA 만 봅니다. AAA 는 이 제품의 목표가 아닙니다.
import { chromium } from 'playwright'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'

const PREINSTALLED = '/opt/pw-browsers/chromium'
const require = createRequire(import.meta.url)
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')

/*
 * 포트를 주면 이미 떠 있는 서버를 씁니다. 안 주면 여기서 띄우고 끝나면
 * 내립니다 — 그래야 CI 에서 한 줄로 돌릴 수 있습니다. 두 터미널이
 * 필요한 검사는 아무도 안 돌립니다.
 */
const GIVEN_PORT = process.argv[2]
const PORT = GIVEN_PORT ?? '4173'
let server = null

if (!GIVEN_PORT) {
  server = spawn('npx', ['vite', 'preview', '--port', PORT, '--strictPort'], {
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  await new Promise((resolve, reject) => {
    const bail = setTimeout(() => reject(new Error('미리보기 서버가 30초 안에 안 떴습니다')), 30_000)
    server.stdout.on('data', (chunk) => {
      if (String(chunk).includes(PORT)) { clearTimeout(bail); resolve() }
    })
    server.on('exit', (code) => { clearTimeout(bail); reject(new Error(`미리보기 서버 종료 (${code})`)) })
  })
}

const stopServer = () => { if (server && !server.killed) server.kill('SIGTERM') }
process.on('exit', stopServer)
process.on('SIGINT', () => { stopServer(); process.exit(130) })
/* 표가 실제로 가로 스크롤되는 폭까지 봐야 스크롤 영역 규칙이 걸립니다 */
const WIDTHS = [[1440, 900], [390, 844]]

const PAGES = ['login', 'invite', 'reset-request', 'reset', 'onboarding', 'dashboard', 'list',
  'scale', 'inbox', 'import', 'approvals', 'jobs', 'search', 'admin', 'audit',
  'integrations', 'billing', 'settings', 'account', 'errors']

const browser = await chromium.launch({
  /* 이 컨테이너에는 크로미엄이 미리 깔려 있습니다. CI 처럼 playwright 가
     직접 받아둔 환경에서는 지정하지 않아야 자기가 받은 것을 씁니다. */
  ...(existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {}),
  /* 크로미엄이 켜지면서 구글에 하는 요청들이 이 환경에서는 막혀 있고,
     막힌 연결을 기다리느라 화면마다 몇 초씩 새어나갑니다. */
  args: ['--disable-background-networking', '--no-first-run', '--disable-component-update'],
})


/** 규칙 id → { impact, 화면 목록, 예시 } */
const found = new Map()
let checked = 0

for (const [w, h] of WIDTHS) {
 for (const theme of ['light', 'dark']) {
  for (const id of PAGES) {
    const page = await browser.newPage({ viewport: { width: w, height: h } })
    /* 바깥으로 나가는 요청은 막습니다. 막힌 연결을 기다리느라 화면당
       몇 초씩 새어나가고, 검사 결과와는 아무 상관이 없습니다. */
    await page.route('**://**', (route) =>
      route.request().url().includes('127.0.0.1') ? route.continue() : route.abort())
    await page.addInitScript((t) => { try { localStorage.setItem('hct-theme', t) } catch {} }, theme)
    /* networkidle 은 쓰지 않습니다 — 폰트나 원격 요청이 하나라도 막히면
       화면당 수십 초를 기다립니다. 정적 SPA 라 load 로 충분합니다. */
    await page.goto(`http://127.0.0.1:${PORT}/?page=${id}`, { waitUntil: 'load' })
    await page.waitForTimeout(250)
    await page.addScriptTag({ content: axeSource })

    const result = await page.evaluate(async () => window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      /* 미리보기 전용 컨트롤은 제품이 아니므로 제외합니다 */
      exclude: [['[data-preview-chrome]']],
    }))
    checked += 1

    for (const v of result.violations) {
      if (!found.has(v.id)) {
        found.set(v.id, {
          impact: v.impact, help: v.help, helpUrl: v.helpUrl,
          screens: new Set(), nodes: 0, sample: v.nodes[0]?.html?.slice(0, 140) ?? '',
          why: v.nodes[0]?.failureSummary?.split('\n').filter(Boolean).slice(1).join(' / ') ?? '',
        })
      }
      const e = found.get(v.id)
      e.screens.add(`${id}(${w}px·${theme === 'dark' ? '다크' : '라이트'})`)
      e.nodes += v.nodes.length
    }
    await page.close()
  }
 }
}
await browser.close()

const RANK = { critical: 0, serious: 1, moderate: 2, minor: 3 }
const rows = [...found.entries()].sort((a, b) => (RANK[a[1].impact] ?? 9) - (RANK[b[1].impact] ?? 9))

console.log(`\n검사: ${checked}건 (${PAGES.length}개 화면 × ${WIDTHS.length}개 폭 × 2테마) · WCAG 2.1 A/AA\n`)
if (rows.length === 0) {
  console.log('✓ 위반 없음')
} else {
  const total = rows.reduce((s, [, v]) => s + v.nodes, 0)
  console.log(`✗ 규칙 ${rows.length}종 위반 · 요소 ${total}개\n`)
  for (const [id, v] of rows) {
    console.log(`[${(v.impact ?? '?').toUpperCase()}] ${id} — ${v.help}`)
    console.log(`  요소 ${v.nodes}개 · 화면 ${v.screens.size}개: ${[...v.screens].slice(0, 6).join(', ')}${v.screens.size > 6 ? ' 외' : ''}`)
    if (v.why) console.log(`  원인: ${v.why.slice(0, 160)}`)
    if (v.sample) console.log(`  예시: ${v.sample}`)
    console.log(`  ${v.helpUrl}`)
    console.log()
  }
}
process.exit(rows.some(([, v]) => v.impact === 'critical' || v.impact === 'serious') ? 1 : 0)
