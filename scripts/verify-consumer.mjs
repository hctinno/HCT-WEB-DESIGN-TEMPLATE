// 다른 프로젝트에서 설치했을 때 실제로 동작하는지 확인합니다.
//
//   node scripts/verify-consumer.mjs <패키지.tgz> [v3|v4]      (기본: 둘 다)
//
// 왜 이걸 CI 에서 도는가: 이 저장소 안에서는 모든 것이 잘 돌아가는데
// 설치한 쪽에서만 깨지는 종류의 사고가 있습니다. 실제로 처음 패키징했을 때
// 세 가지가 한꺼번에 났습니다.
//
//   1. Tailwind 가 프리셋의 content 를 병합하지 않아 컴포넌트 클래스가
//      전부 purge 되었습니다. 빌드는 성공하고 화면만 스타일 없이 나옵니다.
//   2. 기본 팔레트가 [data-palette] 속성에만 걸려 있어, 속성을 안 붙인
//      프로젝트에서는 사이드바만 밝고 그 위 흰색 로고가 사라졌습니다.
//   3. files 목록에서 빠진 파일이 있으면 import 가 깨집니다.
//   4. (v4) 그림자 값이 CSS 에 박혀 다크 모드를 따라가지 않았습니다.
//
// 셋 다 이 저장소 안에서는 절대 재현되지 않습니다. 그래서 매번 진짜로
// 설치해서 빌드해 봅니다.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const tarball = process.argv[2]
if (!tarball) {
  console.error('사용법: node scripts/verify-consumer.mjs <패키지.tgz> [v3|v4]')
  process.exit(1)
}
const only = process.argv[3]
const VERSIONS = only ? [only] : ['v3', 'v4']

async function verify(version) {
const dir = mkdtempSync(join(tmpdir(), 'hct-consumer-'))
const run = (cmd, args) => execFileSync(cmd, args, { cwd: dir, stdio: 'inherit' })

console.log(`\n── Tailwind ${version} ──  ${dir}`)
mkdirSync(join(dir, 'src'), { recursive: true })

writeFileSync(join(dir, 'package.json'), JSON.stringify({
  name: 'hct-consumer-check', private: true, type: 'module',
  scripts: { build: 'vite build' },
}, null, 2))

/* 문서에 적힌 그대로의 설정 — 안내문이 틀리면 여기서 걸립니다 */
if (version === 'v3') {
  writeFileSync(join(dir, 'vite.config.js'), `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()], logLevel: 'warn' })
`)
  writeFileSync(join(dir, 'postcss.config.js'),
    `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }\n`)
  writeFileSync(join(dir, 'tailwind.config.js'), `
import hct, { hctContent } from 'hct-web-design-template/tailwind-preset'
export default {
  presets: [hct],
  content: [...hctContent, './index.html', './src/**/*.{js,jsx}'],
}
`)
  writeFileSync(join(dir, 'src/main.css'), `
@import 'hct-web-design-template/styles/hct.css';
@tailwind base;
@tailwind components;
@tailwind utilities;
`)
} else {
  writeFileSync(join(dir, 'vite.config.js'), `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({ plugins: [react(), tailwindcss()], logLevel: 'warn' })
`)
  /* v4 는 @source 가 패키지 CSS 안에 있어 앱이 경로를 적을 필요가 없습니다 */
  writeFileSync(join(dir, 'src/main.css'), `
@import 'tailwindcss';
@import 'hct-web-design-template/styles/hct.v4.css';
`)
}

writeFileSync(join(dir, 'index.html'),
  `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>t</title></head>` +
  `<body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`)

/* 배럴에서 널리 쓰이는 것들을 한 번씩 건드립니다 — export 누락 잡기 */
writeFileSync(join(dir, 'src/main.jsx'), `
import { createRoot } from 'react-dom/client'
import './main.css'
import {
  PageContainer, PageHeader, DataGrid, GridCard, BoardView, QueryBar, ObjectDetail,
  LineChart, BarChart, StatCard, StatGrid, ChartFrame, MatrixTable,
  EmptyState, ErrorPage, Skeleton, Button, TextField, Combobox, SegmentedControl,
  Stepper, Dropzone, SecretField, Form, FormSection, FormRow, FormActions, SaveBar,
  StatusBadge, Banner, ToastProvider, Progress, JobStatus,
  Modal, ConfirmDialog, Drawer, CommandPalette, ShortcutHelp,
  AuthLayout, normalizeFields, emptyQuery, applyQuery, useRecords,
} from 'hct-web-design-template'
import { AppFrame, NAV, DashboardPage, ListPage } from 'hct-web-design-template/pages'

void [BoardView, QueryBar, ObjectDetail, LineChart, BarChart, StatCard, StatGrid,
  ChartFrame, MatrixTable, EmptyState, ErrorPage, Skeleton, TextField, Combobox,
  SegmentedControl, Stepper, Dropzone, SecretField, Form, FormSection, FormRow,
  FormActions, SaveBar, Banner, Progress, JobStatus, Modal, ConfirmDialog, Drawer,
  CommandPalette, ShortcutHelp, AuthLayout, emptyQuery, applyQuery, useRecords,
  NAV, DashboardPage, ListPage]

const FIELDS = normalizeFields([
  { key: 'id', label: '번호', type: 'text', width: '96px' },
  { key: 'name', label: '이름', type: 'text' },
])
const ROWS = [{ id: 'A-1', name: '첫 항목' }]

function App() {
  return (
    <AppFrame active="list" counts={{ list: ROWS.length }}>
      <PageContainer>
        <PageHeader title="설치 확인" actions={<Button variant="primary">동작</Button>} />
        <GridCard>
          <DataGrid fields={FIELDS} records={ROWS} selectable={false} primaryField="name" />
        </GridCard>
        <StatusBadge tone="info" size="sm">확인</StatusBadge>
      </PageContainer>
    </AppFrame>
  )
}
createRoot(document.getElementById('root')).render(<ToastProvider><App /></ToastProvider>)
`)

console.log('\n의존성 설치…')
const deps = version === 'v3'
  ? ['tailwindcss@^3.4', 'postcss', 'autoprefixer']
  : ['tailwindcss@^4', '@tailwindcss/vite@^4']
run('npm', ['install', '--no-audit', '--no-fund', '--loglevel', 'error',
  'react', 'react-dom', 'vite', '@vitejs/plugin-react', ...deps, resolve(tarball)])

console.log('\n빌드…')
run('npm', ['run', 'build'])

/* 스타일이 실제로 생성되었는지 — 여기가 이 스크립트의 핵심입니다.
   빌드 성공만 보면 클래스가 통째로 purge 되어도 통과해 버립니다. */
const assetsDir = join(dir, 'dist', 'assets')
const cssFile = readdirSync(assetsDir).find((f) => f.endsWith('.css'))
const css = readFileSync(join(assetsDir, cssFile), 'utf8')

const mustHave = [
  ['.bg-sidebar-bg', '사이드바 토큰'],
  ['.h-control-md', '컨트롤 높이 스케일'],
  ['.w-sidebar', '레이아웃 폭 토큰'],
  ['.text-micro', '타입 스케일'],
  ['--color-bg-canvas', '토큰 변수(hct.css)'],
  ['--layout-sidebar-width', '레이아웃 변수'],
]
const mustNotHave = [
  ['.bg-blue-500', 'Tailwind 기본 팔레트가 살아 있습니다'],
  ['.text-gray-700', 'Tailwind 기본 팔레트가 살아 있습니다'],
]

let failed = 0
for (const [needle, what] of mustHave) {
  const ok = css.includes(needle)
  console.log(`  ${ok ? '✓' : '✗'} ${needle.padEnd(24)} ${what}`)
  if (!ok) failed += 1
}
for (const [needle, why] of mustNotHave) {
  const bad = css.includes(needle)
  console.log(`  ${bad ? '✗' : '✓'} ${needle.padEnd(24)} 없어야 함`)
  if (bad) { console.error(`    → ${why}`); failed += 1 }
}

/* 기본 팔레트가 속성 없이도 걸리는지 — 사이드바가 어두워야 그 위 흰색 로고가
   보입니다. 빌드된 CSS 로는 확인할 수 없습니다: 최적화기가
   `:root, :root[data-palette=hct]` 를 중복으로 보고 `:root` 하나로 합칩니다
   (맞는 동작입니다). 그래서 **배포되는 원본**을 검사합니다. */
const shipped = readFileSync(
  join(dir, 'node_modules/hct-web-design-template/src/styles/palettes.css'), 'utf8')
const defaultPaletteApplies = /(^|\n)\s*:root\s*,\s*\n\s*:root\[data-palette="hct"\]\s*\{/.test(shipped)
console.log(`  ${defaultPaletteApplies ? '✓' : '✗'} ${'기본 팔레트'.padEnd(21)} data-palette 없이도 적용`)
if (!defaultPaletteApplies) failed += 1

/* v4 전용: 그림자가 값으로 박히지 않고 변수로 남아야 다크 모드를 따라갑니다.
   v4 는 --shadow-* 를 빌드 시점에 파싱해 색을 뽑아내려 하므로, 별칭을 한 겹
   두지 않으면 라이트용 옅은 그림자가 어두운 배경에 그려져 보이지 않습니다. */
if (version === 'v4') {
  const rule = /\.shadow-overlay\s*\{([^}]*)\}/.exec(css)
  const byVar = rule && /--tw-shadow:\s*var\(/.test(rule[1])
  console.log(`  ${byVar ? '✓' : '✗'} ${'그림자'.padEnd(23)} 값이 아니라 변수로 참조`)
  if (!byVar) {
    console.error(`    → ${rule ? rule[1].trim().slice(0, 120) : '.shadow-overlay 규칙이 없습니다'}`)
    failed += 1
  }
}

rmSync(dir, { recursive: true, force: true })

  return failed
}

let total = 0
for (const version of VERSIONS) total += await verify(version)

if (total > 0) {
  console.error(`\n✗ 소비 프로젝트 검증 실패 — ${total}건`)
  process.exit(1)
}
console.log(`\n✓ 소비 프로젝트에서 정상 동작합니다 (${VERSIONS.join(', ')})`)
