// 배럴에서 내보내지만 아무도 쓰지 않는 export 를 찾습니다.
//
//   node scripts/audit-exports.mjs
//
// 디자인 시스템의 공개 목록은 **약속**입니다. 아무도 안 쓰는 것이 섞여 있으면
// 두 가지가 나빠집니다: 에이전트가 고를 선택지가 늘어나고(통일성이 약해집니다),
// 지울 수 없는 짐이 됩니다. 화면 원형이 한 번도 안 쓴 컴포넌트는 대개
// "만들었지만 필요 없던 것" 이거나 "쓰라고 만들었는데 아무도 모르는 것" 입니다.
// 둘 다 확인이 필요합니다.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(jsx?|mjs)$/.test(name)) out.push(full)
  }
  return out
}

/**
 * 배럴에서 내보내는 이름을 모읍니다.
 *
 * 주석을 먼저 걷어냅니다. 배럴에 "이건 언제 쓰는 것" 을 적어두는 건 이
 * 저장소의 방식인데, 안 걷어내면 주석 줄 전체가 이름으로 잡혀서 "쓰이지
 * 않는 export" 로 오탐이 납니다. 실제로 그렇게 잡혔습니다 — 검사기 때문에
 * 주석을 지우는 일이 생기면 안 됩니다.
 */
function barrelNames(file) {
  const src = readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
  const names = []
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop().trim()
      if (name) names.push(name)
    }
  }
  return names
}

const barrels = [
  ['components', join(ROOT, 'src/components/index.js')],
  ['pages', join(ROOT, 'src/pages/index.js')],
]

/* 배럴과 그 자신을 정의한 파일은 "사용처" 로 치지 않습니다 */
const barrelPaths = new Set(barrels.map(([, p]) => p))
const files = walk(join(ROOT, 'src')).filter((f) => !barrelPaths.has(f))
const corpus = files.map((f) => ({ file: f, src: readFileSync(f, 'utf8') }))

let unused = 0
for (const [label, barrel] of barrels) {
  const names = [...new Set(barrelNames(barrel))]
  const rows = []

  for (const name of names) {
    /*
     * 배럴을 뺀 소스 전체에서 이 이름이 몇 번 나오는가.
     *
     * 1회면 자기 정의뿐이므로 아무도 쓰지 않는 것입니다. 2회 이상이면
     * 어딘가에서 import 하거나 같은 파일 안에서 쓰고 있습니다.
     *
     * 처음에는 "정의를 뺀 사용처" 를 세려고 했는데 오탐이 쏟아졌습니다
     * (Checkbox·formatDate 등이 실제로는 쓰이는데 미사용으로 잡혔습니다).
     * 세는 규칙은 단순할수록 믿을 수 있습니다.
     */
    const re = new RegExp(`\\b${name}\\b`, 'g')
    const count = corpus.reduce((sum, { src }) => sum + (src.match(re)?.length ?? 0), 0)
    if (count <= 1) rows.push(name)
  }

  console.log(`\n[${label}] 내보내기 ${names.length}개 중 소스 어디에도 쓰이지 않는 것: ${rows.length}개`)
  if (rows.length > 0) {
    for (const n of rows) console.log(`  · ${n}`)
    unused += rows.length
  }
}

console.log(`\n${unused === 0
  ? '✓ 모든 내보내기가 최소 한 번은 쓰입니다'
  : `총 ${unused}개 — 정의만 있고 아무 데서도 쓰지 않습니다`}`)
