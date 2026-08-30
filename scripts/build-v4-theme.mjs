// Tailwind v4 용 @theme CSS 를 v3 프리셋에서 생성합니다.
//
//   npm run tokens:build     (팔레트 CSS 와 함께 생성됩니다)
//
// 왜 생성하는가: v3 와 v4 는 설정 방식이 완전히 다릅니다(JS 객체 ↔ CSS 변수).
// 두 벌을 손으로 관리하면 반드시 갈라집니다 — 이 저장소가 존재하는 이유가
// 바로 그런 갈라짐을 막는 것인데, 정작 토큰이 두 벌이 되면 앞뒤가 안 맞습니다.
// 그래서 **v3 프리셋 하나만 원본**으로 두고 v4 쪽을 뽑아냅니다.
//
// v4 에서도 강제가 유지되는지 실제로 컴파일해 확인했습니다:
//   --color-*: initial  →  bg-blue-500 이 생성되지 않음
//   --spacing: initial  →  p-7 이 생성되지 않음 (스케일 밖은 CSS 없음)
// 즉 v3 에서 지키던 "임의의 색·간격을 쓸 수 없다"가 v4 에서도 그대로입니다.
import { writeFileSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const preset = (await import(resolve(ROOT, 'tailwind-preset.js'))).default
const t = preset.theme

/*
 * tokens.css 의 :root 블록에 정의된 의미 토큰을 읽어둡니다.
 *
 * 왜 필요한가: v3 에서는 Tailwind 색 이름(bg-canvas)과 CSS 변수 이름
 * (--color-bg-canvas)이 달라도 상관없었습니다. v4 에서는 테마 변수 이름이
 * 곧 클래스 이름이라, 72개 중 42개가 `--color-bg-canvas: var(--color-bg-canvas)`
 * 처럼 **자기 자신을 가리키게** 됩니다.
 *
 * 그래서 한 단계 풀어 원시 변수(--hct-neutral-50 등)를 직접 가리키게 합니다.
 * 팔레트는 원시 변수를 덮어쓰므로 팔레트 전환도 그대로 동작합니다.
 * (실제 런타임 값은 tokens.css/palettes.css 가 정합니다. @theme 의 값은
 *  유틸리티를 생성시키고 토큰 없이도 라이트 기본값이 서게 하는 용도입니다.)
 */
const tokensCss = readFileSync(resolve(ROOT, 'src/styles/tokens.css'), 'utf8')
/* 라이트(:root) 값이 파일 앞에 오므로 처음 만난 정의를 씁니다 */
const tokenValue = new Map()
for (const m of tokensCss.matchAll(/^\s*(--[\w-]+)\s*:\s*([^;]+);/gm)) {
  if (!tokenValue.has(m[1])) tokenValue.set(m[1], m[2].trim())
}

const unresolved = []
const lines = []
const aliases = []
const section = (title) => lines.push('', `  /* ${title} */`)

/**
 * 토큰 한 줄을 씁니다.
 *
 * 내보내는 이름과 가리키는 변수 이름이 같으면(72개 색 중 42개가 그렇습니다)
 * 자기 참조가 되므로 한 단계 풀어 원시 변수를 가리키게 합니다.
 *
 * 다만 **그림자는 다릅니다.** v4 는 --shadow-* 값을 빌드 시점에 파싱해
 * 색을 뽑아내고 그대로 펼쳐 넣습니다(shadow-<색> 수식어를 지원하려고).
 * 그러면 값이 CSS 에 박혀서 다크 모드를 따라가지 않습니다 — 밝은 배경용
 * 옅은 그림자가 어두운 배경에 그려져 아예 보이지 않게 됩니다.
 *
 * 그래서 그림자만 별칭을 한 겹 두어 v4 가 파싱하지 못하게 합니다. 그러면
 * `--tw-shadow: var(--hct-a-shadow-overlay)` 로 남아 런타임에 해석됩니다.
 * (실제로 두 방식을 컴파일해 비교하고 고른 방법입니다.)
 */
function put(name, value) {
  const m = /^var\((--[\w-]+)\)$/.exec(String(value).trim())
  const selfRef = m && m[1] === name

  if (selfRef && name.startsWith('--shadow')) {
    const alias = `--hct-alias-${name.slice(2)}`
    aliases.push(`  ${alias}: var(${name});`)
    lines.push(`  ${name}: var(${alias});`)
    return
  }

  let out = value
  if (selfRef) {
    const resolved = tokenValue.get(m[1])
    if (resolved === undefined) unresolved.push(name)
    else out = resolved
  }
  lines.push(`  ${name}: ${out};`)
}

/** 중첩된 색 객체를 v4 이름으로 폅니다. DEFAULT 는 접미사 없이 나갑니다. */
function flattenColors(obj, prefix = '') {
  const out = []
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object') {
      out.push(...flattenColors(value, `${prefix}${key}-`))
    } else if (key === 'DEFAULT') {
      out.push([prefix.replace(/-$/, ''), value])
    } else {
      out.push([`${prefix}${key}`, value])
    }
  }
  return out
}

/* ── 머리말 ─────────────────────────────────────────────────────── */
const header = `/* ============================================================================
   HCT 디자인 시스템 — Tailwind v4 테마 (자동 생성 파일, 직접 수정하지 마세요)
   ----------------------------------------------------------------------------
   원본: tailwind-preset.js   생성: npm run tokens:build

   사용법 (앱의 CSS):

     @import 'tailwindcss';
     @import 'hct-web-design-template/styles/hct.css';
     @import 'hct-web-design-template/styles/theme.v4.css';
     @source '../node_modules/hct-web-design-template/dist';

   @source 를 빼먹지 마세요. v4 는 node_modules 를 자동으로 훑지 않아,
   없으면 컴포넌트 클래스가 통째로 생성되지 않습니다. 화면은 오류 없이
   스타일만 빠진 채로 나옵니다.

   Tailwind 기본 팔레트와 동적 간격은 의도적으로 제거했습니다:
     --color-*: initial  →  bg-blue-500 같은 클래스가 존재하지 않습니다
     --spacing: initial  →  p-7 처럼 스케일 밖 값은 CSS 가 생성되지 않습니다
   ============================================================================ */

/* 다크 모드 — 세 가지 상태를 모두 처리합니다.
   (1) data-theme="dark"  명시적 선택
   (2) 시스템이 다크이고 data-theme="light" 가 아님
   토큰이 이미 두 모드를 처리하므로 dark: 를 직접 쓸 일은 거의 없습니다
   (AGENTS.md 의 no-dark-class 규칙 참고). 두 버전의 동작을 맞추려고 둡니다. */
@custom-variant dark {
  @media (prefers-color-scheme: dark) {
    &:not([data-theme="light"] *) { @slot; }
  }
  &:is([data-theme="dark"] *) { @slot; }
}

@theme {
  /* 기본값 제거 — 이 두 줄이 이 시스템의 강제력입니다 */
  --color-*: initial;
  --spacing: initial;
  --text-*: initial;
  --radius-*: initial;
  --shadow-*: initial;
  --font-*: initial;
  --breakpoint-*: initial;
  --container-*: initial;
`

/* ── 색 ─────────────────────────────────────────────────────────── */
section('색 — 시맨틱 토큰만. 값은 tokens.css/palettes.css 의 변수를 가리킵니다')
for (const [name, value] of flattenColors(t.colors)) {
  put(`--color-${name}`, value)
}

/* ── 글꼴 ───────────────────────────────────────────────────────── */
section('글꼴')
for (const [key, value] of Object.entries(t.fontFamily)) {
  put(`--font-${key}`, Array.isArray(value) ? value.join(', ') : value)
}

section('타입 스케일 — 크기와 줄높이가 짝입니다')
for (const [key, value] of Object.entries(t.fontSize)) {
  const [size, opts] = Array.isArray(value) ? value : [value, null]
  put(`--text-${key}`, size)
  const lh = opts && (typeof opts === 'object' ? opts.lineHeight : opts)
  if (lh) put(`--text-${key}--line-height`, lh)
  if (opts && typeof opts === 'object' && opts.letterSpacing) {
    put(`--text-${key}--letter-spacing`, opts.letterSpacing)
  }
  if (opts && typeof opts === 'object' && opts.fontWeight) {
    put(`--text-${key}--font-weight`, opts.fontWeight)
  }
}

/* ── 간격 ───────────────────────────────────────────────────────── */
section('간격 — 4px 배수만. 스케일 밖 값은 CSS 가 생성되지 않습니다')
for (const [key, value] of Object.entries(t.spacing)) {
  if (key === '0' && value === '0px') { put('--spacing-0', '0px'); continue }
  put(`--spacing-${key}`, value)
}

/* ── 모서리·그림자 ──────────────────────────────────────────────── */
section('모서리 — 최대 xl(12px). 2xl 이상은 이 시스템에 없습니다')
for (const [key, value] of Object.entries(t.borderRadius)) {
  put(key === 'DEFAULT' ? '--radius' : `--radius-${key}`, value)
}

section('그림자')
for (const [key, value] of Object.entries(t.boxShadow)) {
  put(key === 'DEFAULT' ? '--shadow' : `--shadow-${key}`, value)
}

/* ── 레이아웃 ───────────────────────────────────────────────────── */
section('앱 셸 고정 규격')
for (const [key, value] of Object.entries(t.extend.width)) put(`--width-${key}`, value)
for (const [key, value] of Object.entries(t.extend.height)) put(`--height-${key}`, value)
/* v4 에서 max-w-* 는 --container-* 네임스페이스에서 옵니다 */
for (const [key, value] of Object.entries(t.extend.maxWidth)) put(`--container-${key}`, value)

section('겹침 순서 — 숫자를 직접 쓰지 말고 이름을 쓰세요')
for (const [key, value] of Object.entries(t.zIndex)) put(`--z-index-${key}`, value)

section('중단점')
for (const [key, value] of Object.entries(t.screens)) put(`--breakpoint-${key}`, value)

section('전환')
for (const [key, value] of Object.entries(t.extend.transitionDuration)) {
  put(`--duration-${key}`, value)
}
for (const [key, value] of Object.entries(t.extend.transitionTimingFunction)) {
  put(`--ease-${key}`, value)
}

section('애니메이션')
for (const [key, value] of Object.entries(t.extend.animation)) put(`--animate-${key}`, value)

lines.push('}')

/* keyframes 는 @theme 밖에 둡니다 — v4 는 테마 블록 안의 @keyframes 를
   읽지만, 밖에 두는 편이 v3 의 CSS 와 나란히 두고 비교하기 쉽습니다. */
const keyframes = Object.entries(t.extend.keyframes)
  .map(([name, steps]) => {
    const body = Object.entries(steps)
      .map(([stop, decls]) => {
        const props = Object.entries(decls)
          .map(([prop, v]) => `    ${prop.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}: ${v};`)
          .join('\n')
        return `  ${stop} {\n${props}\n  }`
      })
      .join('\n')
    return `@keyframes ${name} {\n${body}\n}`
  })
  .join('\n\n')

/* 별칭은 @theme 밖, 레이어 밖에 둡니다. tokens.css 가 정한 실제 값을 그대로
   집어오게 하려는 것이므로 레이어에 들어가면 안 됩니다. */
const aliasBlock = aliases.length === 0 ? '' : `
/* 그림자 별칭 — v4 가 값을 펼쳐 넣지 못하게 한 겹 감쌉니다.
   실제 값은 tokens.css 가 테마별로 정합니다. */
:root {
${aliases.join('\n')}
}
`

const css = `${header.replace('@theme {', `${aliasBlock}\n@theme {`)}${lines.join('\n')}\n\n${keyframes}\n`

const out = resolve(ROOT, 'src/styles/theme.v4.css')
writeFileSync(out, css)

const count = lines.filter((l) => l.trim().startsWith('--')).length
console.log(`✓ src/styles/theme.v4.css — 토큰 ${count}개`)

/* 자기 참조가 남으면 그 색은 CSS 에서 무효가 됩니다. 조용히 넘기지 않습니다. */
const selfRef = lines.filter((l) => {
  const m = /^\s*(--[\w-]+):\s*var\((--[\w-]+)\);$/.exec(l)
  return m && m[1] === m[2]
})
if (selfRef.length > 0) {
  console.error('\n✗ 자기 자신을 가리키는 토큰이 남았습니다:')
  for (const l of selfRef) console.error('   ' + l.trim())
  console.error('  tokens.css 의 :root 에 해당 변수가 정의되어 있는지 확인하세요.')
  process.exit(1)
}
if (unresolved.length > 0) {
  console.error(`\n✗ tokens.css 에서 값을 찾지 못한 토큰: ${unresolved.join(', ')}`)
  process.exit(1)
}
