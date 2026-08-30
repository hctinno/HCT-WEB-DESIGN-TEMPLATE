#!/usr/bin/env node
/**
 * 문서가 가리키는 이름이 실제로 있는지 검사합니다.
 *
 *   npm run audit:docs
 *
 * 왜 필요한가:
 *
 *   AGENTS.md 는 **다른 에이전트의 주 진입점**입니다. 거기 적힌 이름이
 *   실제로 없으면, 그 문서를 읽고 화면을 만드는 모두가 같은 자리에서
 *   막힙니다. 그런데 지금까지 문서와 코드가 맞는지는 아무도 확인하지
 *   않았습니다 — 사람이 읽어서 알아채기를 기대하고 있었습니다.
 *
 *   실제로 어긋난 적이 있습니다. `foldToOther` 를 지운 뒤에도 AGENTS.md 는
 *   "7번째 계열은 foldToOther() 로 묶습니다" 라고 안내하고 있었습니다.
 *   그 말을 믿고 따라간 에이전트는 없는 함수를 부르게 됩니다.
 *
 * 무엇을 보는가:
 *
 *   문서의 코드 블록에 나오는 `<ComponentName`, `functionName(` 과
 *   본문의 백틱 안 PascalCase 이름이 배럴이나 lib 에서 실제로 나가는지.
 *
 * 무엇을 안 보는가:
 *
 *   CSS 클래스(bg-bg-surface), 명령(npm run …), 파일 이름, React 내장
 *   훅처럼 이 저장소가 내보내지 않는 것이 정상인 이름들.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/* ── 실제로 있는 이름 모으기 ─────────────────────────────────── */

/** 배럴의 export 이름. 주석을 먼저 걷어냅니다(주석이 이름으로 잡힙니다). */
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

/** src 전체에서 직접 선언한 export 이름 (lib 의 함수·상수 포함) */
function declaredNames(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) { declaredNames(full, out); continue }
    if (!/\.(jsx?|mjs)$/.test(entry.name)) continue
    const src = readFileSync(full, 'utf8')
    for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/g)) {
      out.push(m[1])
    }
  }
  return out
}

const exported = new Set([
  ...barrelNames('src/components/index.js'),
  ...barrelNames('src/pages/index.js'),
  ...declaredNames('src'),
])

/*
 * 이 저장소가 내보내지 않는 것이 **정상인** 이름들.
 * React 내장, 브라우저 API, 문서가 예시로 지어낸 이름들입니다.
 */
const NOT_OURS = new Set([
  // React·브라우저
  'React', 'useState', 'useEffect', 'useMemo', 'useCallback', 'useRef', 'useId',
  'createRoot', 'Fragment', 'Promise', 'Date', 'Math', 'JSON', 'Object', 'Array',
  'Number', 'String', 'Boolean', 'Set', 'Map', 'URL', 'URLSearchParams', 'Intl',
  'localStorage', 'document', 'window', 'location', 'console', 'navigator',
  // 문서가 지어낸 예시 이름 (독자가 자기 것으로 바꿔 쓰는 자리)
  'MyPage', 'MyScreen', 'YourComponent', 'Example', 'App', 'Root',
])

/* ── 문서에서 이름 뽑기 ──────────────────────────────────────── */

const DOCS = ['AGENTS.md', 'README.md', 'CLAUDE.md', 'test/README.md']

/* 키보드 키는 백틱 안의 대문자로 적히지만 코드가 아닙니다 */
const KEY_NAMES = new Set([
  'Enter', 'Esc', 'Escape', 'Space', 'Shift', 'Ctrl', 'Alt', 'Cmd', 'Meta', 'Tab',
  'Delete', 'Backspace', 'Home', 'End', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
])

/**
 * **확실한 것만** 봅니다.
 *
 * 오탐이 하나라도 섞이면 사람이 검사를 안 믿게 되고, 그러면 진짜 실패도
 * 함께 무시됩니다. 그래서 "문서가 이 API 가 있다고 주장하는" 자리만 봅니다:
 *
 *   <ComponentName />   컴포넌트를 쓰라고 보여주는 자리
 *   `functionName()`    백틱 안의 호출 표기 — 이건 API 주장입니다
 *   `ComponentName`     백틱 안의 이름
 *
 * 코드 블록 안의 맨 `something(` 은 보지 않습니다. 예시는 읽는 사람의
 * 핸들러(setQuery, activityOf …)를 자유롭게 부르고, 그건 정상입니다.
 */
function referencedNames(md) {
  const found = new Map() // 이름 → 처음 나온 줄 번호
  const add = (name, line) => {
    if (KEY_NAMES.has(name)) return
    /* 한 글자이거나 전부 대문자면 이름이 아니라 표기입니다 (X, A, TODO) */
    if (name.length < 3 || name === name.toUpperCase()) return
    if (!found.has(name)) found.set(name, line)
  }

  md.split('\n').forEach((line, i) => {
    const no = i + 1
    for (const m of line.matchAll(/<([A-Z][\w]*)[\s/>]/g)) add(m[1], no)
    for (const m of line.matchAll(/`([A-Z][A-Za-z0-9]*)`/g)) add(m[1], no)
    /* 메서드 호출(form.fieldProps())은 뺍니다 — 객체가 들고 있는 것이지
       배럴이 내보내는 이름이 아닙니다 */
    for (const m of line.matchAll(/(^|[^.\w])`?([a-z][\w]*)\(\)/g)) {
      if (line.includes('.' + m[2] + '()')) continue
      add(m[2], no)
    }
  })

  return found
}

/* ── 검사 ───────────────────────────────────────────────────── */

let missing = 0
let checked = 0

console.log('문서가 가리키는 이름이 실제로 있는지 검사합니다\n')

for (const doc of DOCS) {
  let md
  try { md = readFileSync(doc, 'utf8') } catch { continue }

  const refs = referencedNames(md)
  const bad = []
  for (const [name, line] of refs) {
    if (NOT_OURS.has(name)) continue
    checked += 1
    if (!exported.has(name)) bad.push({ name, line })
  }

  console.log(`  ${bad.length ? '✗' : '✓'} ${doc.padEnd(16)} 이름 ${refs.size}개 참조`)
  for (const { name, line } of bad) {
    console.log(`      ✗ ${doc}:${line}  ${name} — 내보내는 곳이 없습니다`)
    missing += 1
  }
}

console.log()
if (missing > 0) {
  console.log(`✗ 문서가 없는 이름 ${missing}개를 가리킵니다.`)
  console.log('  이름을 고치거나, 정말 없는 것이라면 문서에서 빼세요.')
  console.log('  이 저장소가 내보내지 않는 것이 정상인 이름이면')
  console.log('  scripts/audit-docs.mjs 의 NOT_OURS 에 넣으세요.')
  process.exit(1)
}
console.log(`✓ 문서의 이름 ${checked}개가 모두 실재합니다`)
