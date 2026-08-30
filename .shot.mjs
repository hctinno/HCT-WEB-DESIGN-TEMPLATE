import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
const errs = []
p.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message))
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
const OUT = '/tmp/claude-0/-home-user-HCT-WEB-DESIGN-TEMPLATE/5885d8f4-c1db-5b7c-baca-91e694bd7ce2/scratchpad/'
for (const id of process.argv.slice(2)) {
  await p.goto(`http://127.0.0.1:5173/?page=${id}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(400)
  await p.screenshot({ path: OUT + `p-${id}.png`, fullPage: true })
}
console.log(errs.length ? errs.join('\n') : 'no console errors')
await b.close()
