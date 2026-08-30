/**
 * 미리보기 전체를 HTML 파일 하나로 묶습니다.
 *
 * 왜 필요한가: 이 저장소를 처음 보는 사람(그리고 대부분의 의사결정자)은
 * `npm install` 을 하지 않습니다. 링크 하나로 모든 화면을 눌러볼 수 있어야
 * 디자인 시스템이 실제로 무엇인지 전달됩니다.
 *
 *   node scripts/build-standalone.mjs [출력경로]
 *
 * vite build 결과의 JS·CSS 를 인라인하고, 이미지는 data URI 로 넣습니다
 * (assetsInlineLimit 을 크게 잡아 vite 가 알아서 하게 둡니다).
 * 결과물은 <title> + <style> + 본문 + <script> 뿐이라, 아티팩트 호스트가
 * 씌우는 <html><head><body> 안에 그대로 들어갑니다.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = process.argv[2] ?? join(ROOT, 'dist-standalone', 'hct-console.html')
const DIST = join(ROOT, 'dist-standalone', 'raw')

rmSync(DIST, { recursive: true, force: true })

execFileSync('npx', ['vite', 'build',
  '--outDir', DIST,
  '--emptyOutDir',
  '--assetsInlineLimit', '4000000',   /* 로고까지 data URI 로 */
  '--assetsDir', 'a',
], { cwd: ROOT, stdio: 'inherit' })

const assets = join(DIST, 'a')
const files = existsSync(assets) ? readdirSync(assets) : []
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(assets, f), 'utf8')).join('\n')
const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(assets, f), 'utf8')).join('\n')

if (!js) throw new Error('번들 JS 를 찾지 못했습니다: ' + assets)

/* 첫 페인트 전에 테마·팔레트를 적용 — index.html 의 스크립트와 같은 규칙 */
const boot = readFileSync(join(ROOT, 'index.html'), 'utf8')
  .match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? ''

const html = `<title>HCT 운영 콘솔</title>
<script>${boot}</script>
<style>
${css}
/* 아티팩트 호스트가 body 에 여백을 주지 않도록 — 앱이 화면 전체를 씁니다 */
html, body { margin: 0; height: 100%; }
#root { height: 100%; }
</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`

writeFileSync(OUT, html)
rmSync(DIST, { recursive: true, force: true })
console.log(`✓ ${OUT} — ${(html.length / 1024 / 1024).toFixed(2)}MB`)
