#!/usr/bin/env node
/**
 * HCT 디자인 규칙 검사기
 *
 * 이 스크립트가 존재하는 이유:
 *   문서에 "규칙을 지켜주세요"라고 적어두면 지켜지지 않습니다.
 *   실패하는 검사가 있어야 규칙이 실제로 강제됩니다.
 *
 * 실행:  node scripts/lint-design.mjs [경로...]
 *        npm run lint:design
 *
 * 종료 코드: 위반이 하나라도 있으면 1
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve, extname, relative } from 'node:path'

const ROOT = process.cwd()
const TARGET_DIRS = process.argv.slice(2).length ? process.argv.slice(2) : ['src']
const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.html'])

/* 토큰 정의 파일은 생색을 가질 수밖에 없으므로 검사에서 제외 */
const EXEMPT = [
  'src/styles/tokens.css',
  'tokens/tokens.json',
  'tailwind.config.js',
]

const RULES = [
  {
    id: 'no-hardcoded-hex',
    severity: 'error',
    message: '생색(hex)을 직접 쓰지 마세요. 시맨틱 토큰을 사용하세요. 예: text-fg-primary, bg-bg-surface',
    /* style={{ color: '#fff' }} 또는 className="text-[#fff]" */
    test: (line) => /#[0-9a-fA-F]{3,8}\b/.test(line) && !/^\s*(\/\/|\*|\/\*)/.test(line),
  },
  {
    id: 'no-rgb-literal',
    severity: 'error',
    message: 'rgb()/hsl() 생색 대신 토큰을 사용하세요.',
    test: (line) => /\b(rgb|rgba|hsl|hsla)\(\s*\d/.test(line) && !/var\(--/.test(line),
  },
  {
    id: 'no-tailwind-default-palette',
    severity: 'error',
    message: 'Tailwind 기본 색상(gray-500, blue-600 등)은 이 프로젝트에 존재하지 않습니다. 시맨틱 토큰을 쓰세요.',
    test: (line) =>
      /\b(?:bg|text|border|ring|fill|stroke|from|to|via|divide|outline|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|\d{3})\b/.test(line),
  },
  {
    id: 'off-scale-spacing',
    severity: 'error',
    message:
      '간격 스케일에 없는 값입니다. tailwind.config.js 의 spacing 은 4px 배수로 제한되어 있어, ' +
      '스케일 밖 클래스(h-7, pl-7, left-4.5 등)는 CSS가 생성되지 않고 조용히 무시됩니다. ' +
      '허용: 0 px 0.5 1 1.5 2 2.5 3 4 5 6 8 10 12 16 20 24',
    test: (line) => {
      const allowed = new Set(['0','px','0.5','1','1.5','2','2.5','3','4','5','6','8','10','12','16','20','24'])
      const re = /\b(?:h|w|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y|top|left|right|bottom|inset|inset-x|inset-y|translate-x|translate-y|size)-(\d+(?:\.\d+)?)\b/g
      let match
      while ((match = re.exec(line)) !== null) {
        if (!allowed.has(match[1])) return true
      }
      return false
    },
  },
  {
    id: 'no-arbitrary-spacing',
    severity: 'warn',
    message: '임의 간격(p-[13px] 등) 대신 4px 배수 토큰을 쓰세요.',
    test: (line) => /\b(?:p|m|gap|space)[xytrbl]?-\[\d+(?:px|rem)\]/.test(line),
  },
  {
    id: 'no-arbitrary-font-size',
    severity: 'error',
    message: '임의 글자 크기 대신 타입 스케일(text-xs ~ text-metric)을 쓰세요.',
    test: (line) => /\btext-\[\d+(?:px|rem)\]/.test(line),
  },
  {
    id: 'no-large-radius',
    severity: 'warn',
    message: '이 시스템은 지라형 고밀도입니다. rounded-2xl/3xl 은 쓰지 않습니다(최대 xl=12px).',
    test: (line) => /\brounded-(?:2xl|3xl|\[\d{2,}px\])/.test(line),
  },
  {
    id: 'no-focus-outline-removal',
    severity: 'error',
    message: '포커스 표시를 제거하지 마세요. 키보드 사용자가 위치를 잃습니다.',
    test: (line) => /(?:outline-none|outline:\s*none)/.test(line) && !/focus-visible|focus:ring|focus:border/.test(line),
  },
  {
    id: 'no-raw-table',
    severity: 'warn',
    message: '<table> 을 직접 만들지 말고 DataGrid 컴포넌트를 쓰세요.',
    /* 표를 직접 만드는 게 정당한 셋: DataGrid(목록), ChartTable(차트의 접근성
       대체본), MatrixTable(역할×권한 같은 대조표). 그 외에는 이 셋 중 하나를
       쓰세요 — 화면마다 표를 새로 짜면 밀도와 정렬이 어긋납니다. */
    test: (line, file) => /<table[\s>]/.test(line)
      && !file.includes('components/grid/DataGrid')
      && !file.includes('components/chart/BarChart')
      && !file.includes('components/data/MatrixTable'),
  },
  {
    id: 'icon-button-needs-label',
    severity: 'warn',
    message: '아이콘 전용 버튼에는 aria-label 이 필요합니다.',
    test: (line) => /<button(?![^>]*aria-label)[^>]*>\s*<svg/.test(line),
  },
  {
    id: 'no-dark-class',
    severity: 'error',
    message: 'dark: 변형을 직접 쓰지 마세요. 시맨틱 토큰이 두 모드를 자동 처리합니다.',
    test: (line) => /\bdark:(?:bg|text|border)-/.test(line),
  },
]

function walk(dir, out = []) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist' || entry === 'build') continue
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (EXTENSIONS.has(extname(full))) out.push(full)
  }
  return out
}

const files = TARGET_DIRS.flatMap((d) => walk(resolve(ROOT, d)))
const violations = []

for (const file of files) {
  const rel = relative(ROOT, file)
  if (EXEMPT.some((e) => rel === e || rel.endsWith(e))) continue

  const lines = readFileSync(file, 'utf8').split('\n')

  /*
   * 주석 줄은 건너뜁니다.
   *
   * 이 규칙들을 설명하는 주석("`pl-[196px]` 같은 값을 쓰지 마세요")이
   * 규칙 자신에게 걸립니다. 규칙을 문서화할 수 없는 린터는 결국
   * 주석을 지우게 만들고, 그러면 왜 그런 규칙인지 아무도 모르게 됩니다.
   *
   * 파서 없이 줄 단위로 판정하므로 완벽하지는 않습니다. 블록 주석의
   * 시작·끝을 세어 그 안쪽과 `//` 줄만 제외합니다. 클래스명이 주석 뒤에
   * 붙은 줄(`<div className="p-2" /> // 메모`)은 여전히 검사됩니다.
   */
  let inBlockComment = false
  const isComment = (line) => {
    const t = line.trim()
    if (inBlockComment) {
      if (t.includes('*/')) inBlockComment = false
      return true
    }
    if (t.startsWith('//')) return true
    if (t.startsWith('/*') || t.startsWith('{/*')) {
      if (!t.includes('*/')) inBlockComment = true
      return true
    }
    return false
  }

  lines.forEach((line, i) => {
    if (isComment(line)) return
    /* eslint 스타일 인라인 예외: // design-lint-disable-next-line <rule-id> */
    const prev = lines[i - 1] ?? ''
    for (const rule of RULES) {
      if (prev.includes(`design-lint-disable-next-line ${rule.id}`)) continue
      if (rule.test(line, rel)) {
        violations.push({ file: rel, line: i + 1, rule, text: line.trim().slice(0, 110) })
      }
    }
  })
}

const errors = violations.filter((v) => v.rule.severity === 'error')
const warns = violations.filter((v) => v.rule.severity === 'warn')

if (violations.length === 0) {
  console.log(`✓ 디자인 규칙 통과 — 파일 ${files.length}개 검사`)
  process.exit(0)
}

const byFile = new Map()
for (const v of violations) {
  if (!byFile.has(v.file)) byFile.set(v.file, [])
  byFile.get(v.file).push(v)
}

for (const [file, items] of byFile) {
  console.log(`\n${file}`)
  for (const v of items) {
    const mark = v.rule.severity === 'error' ? '✗ error' : '⚠ warn '
    console.log(`  ${mark}  ${v.line}:  [${v.rule.id}]`)
    console.log(`           ${v.rule.message}`)
    console.log(`           → ${v.text}`)
  }
}

console.log(`\n검사 파일 ${files.length}개 · 오류 ${errors.length}개 · 경고 ${warns.length}개`)
if (errors.length > 0) {
  console.log('\n오류를 수정해야 통과합니다. 규칙 설명은 AGENTS.md 를 참고하세요.')
  process.exit(1)
}
process.exit(0)
