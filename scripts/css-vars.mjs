/**
 * CSS 사용자 정의 속성(--*)의 최종 값을 브라우저 없이 계산합니다.
 *
 * 왜 필요한가:
 *
 *   DESIGN.md 는 "이 CSS 를 그대로 붙이면 패키지와 같은 색이 나온다" 고
 *   약속합니다. 그런데 tokens.css · palettes.css 의 값은 서로를 var() 로
 *   참조하고, 팔레트 · 테마 선택자가 겹쳐서 정해집니다. 손으로 풀면 틀리고,
 *   브라우저로 풀면 정확하지만 verify 잡에는 브라우저가 없습니다.
 *
 *   그래서 **이 저장소의 CSS 가 실제로 쓰는 문법만** 브라우저와 같은 규칙으로
 *   구현합니다. 그 밖의 문법을 만나면 추측하지 않고 멈춥니다 — 조용히 틀린
 *   값을 내는 것보다 생성이 실패하는 편이 낫습니다.
 *
 *   이 계산이 브라우저와 같은지는 a11y 잡의 `npm run audit:design-md` 가
 *   실제 크로미엄으로 다시 확인합니다.
 *
 * 지원하는 것:
 *
 *   선택자   :root · [속성] · [속성="값"] · :not(…) 의 조합, 쉼표 목록
 *   규칙     @media (prefers-color-scheme: dark | light)
 *   값       var(--이름) · var(--이름, 대체값) (중첩 포함)
 *
 *   요소는 문서 루트 하나뿐이라고 보고 계산합니다(토큰은 전부 :root 에 걸립니다).
 */

/** 주석을 걷어낸 CSS 를 규칙 목록으로 바꿉니다. */
export function parseCss(css) {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const rules = []
  let order = 0

  function block(text, media) {
    let i = 0
    while (i < text.length) {
      const open = text.indexOf('{', i)
      if (open === -1) {
        if (text.slice(i).trim()) throw new Error(`해석할 수 없는 CSS: ${text.slice(i).trim().slice(0, 60)}`)
        return
      }
      const prelude = text.slice(i, open).trim()
      const close = matching(text, open)
      const body = text.slice(open + 1, close)
      if (prelude.startsWith('@')) {
        const m = /^@media\s*\(\s*prefers-color-scheme\s*:\s*(dark|light)\s*\)$/.exec(prelude)
        if (!m) throw new Error(`지원하지 않는 규칙: ${prelude}`)
        if (media) throw new Error(`겹친 @media 는 지원하지 않습니다: ${prelude}`)
        block(body, m[1])
      } else {
        const selectors = splitTop(prelude, ',').map((s) => parseCompound(s.trim()))
        const decls = splitTop(body, ';')
          .map((d) => d.trim())
          .filter(Boolean)
          .map((d) => {
            const colon = d.indexOf(':')
            if (colon === -1) throw new Error(`선언이 아닙니다: ${d.slice(0, 60)}`)
            const prop = d.slice(0, colon).trim()
            const value = d.slice(colon + 1).trim()
            if (/!important/i.test(value)) throw new Error(`!important 는 지원하지 않습니다: ${prop}`)
            return { prop, value, order: order++ }
          })
        rules.push({ selectors, media, decls })
      }
      i = close + 1
    }
  }

  block(src, null)
  return rules
}

/** text[open] 의 '{' 와 짝이 맞는 '}' 위치 */
function matching(text, open) {
  let depth = 0
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}' && --depth === 0) return i
  }
  throw new Error('닫히지 않은 { 가 있습니다')
}

/** 괄호 · 따옴표 밖의 구분자로만 나눕니다 (url(…;…) · "a,b" 를 지킵니다). */
function splitTop(text, sep) {
  const out = []
  let depth = 0
  let quote = null
  let start = 0
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quote) { if (ch === quote) quote = null; continue }
    if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (ch === sep && depth === 0) { out.push(text.slice(start, i)); start = i + 1 }
  }
  out.push(text.slice(start))
  return out
}

/**
 * 복합 선택자 하나(공백 없이 붙은 :root · [속성] · :not(…))를 해석합니다.
 * 공백(자손 결합자)이나 다른 의사 클래스가 나오면 멈춥니다.
 */
export function parseCompound(text) {
  const parts = []
  let i = 0
  while (i < text.length) {
    const rest = text.slice(i)
    if (rest.startsWith(':root')) { parts.push({ type: 'root' }); i += 5; continue }
    if (rest.startsWith(':not(')) {
      let depth = 1
      let j = i + 5
      for (; j < text.length && depth; j++) {
        if (text[j] === '(') depth++
        else if (text[j] === ')') depth--
      }
      if (depth) throw new Error(`닫히지 않은 :not( — ${text}`)
      parts.push({ type: 'not', inner: parseCompound(text.slice(i + 5, j - 1).trim()) })
      i = j
      continue
    }
    const attr = /^\[([a-z][a-z0-9-]*)(?:="([^"]*)")?\]/.exec(rest)
    if (attr) { parts.push({ type: 'attr', name: attr[1], value: attr[2] }); i += attr[0].length; continue }
    throw new Error(`지원하지 않는 선택자: "${text}"`)
  }
  if (!parts.length) throw new Error('빈 선택자')
  return parts
}

/** 명시도 — 여기서 쓰는 것은 전부 (0, n, 0) 열이라 숫자 하나로 충분합니다. */
function specificity(parts) {
  return parts.reduce((n, p) => n + (p.type === 'not' ? specificity(p.inner) : 1), 0)
}

function matches(parts, attrs) {
  return parts.every((p) => {
    if (p.type === 'root') return true
    if (p.type === 'not') return !matches(p.inner, attrs)
    if (!(p.name in attrs)) return false
    return p.value === undefined || attrs[p.name] === p.value
  })
}

/**
 * 루트 요소의 계산된 사용자 정의 속성과 color-scheme 을 돌려줍니다.
 *
 * @param {ReturnType<typeof parseCss>} rules
 * @param {{ attrs?: Record<string, string>, osDark?: boolean }} [env]
 *   attrs  — <html> 에 붙은 속성 (예: { 'data-theme': 'dark' })
 *   osDark — 운영체제가 다크 모드인가 (prefers-color-scheme)
 * @returns {Map<string, string>} 이름 → var() 를 모두 풀고 공백을 정리한 값
 */
export function computeRootVars(rules, { attrs = {}, osDark = false } = {}) {
  /* 캐스케이드: 명시도가 높은 것, 같으면 나중에 나온 것이 이깁니다 */
  const winner = new Map()
  for (const rule of rules) {
    if (rule.media === 'dark' && !osDark) continue
    if (rule.media === 'light' && osDark) continue
    const hit = rule.selectors.filter((s) => matches(s, attrs))
    if (!hit.length) continue
    const spec = Math.max(...hit.map(specificity))
    for (const d of rule.decls) {
      const prev = winner.get(d.prop)
      if (!prev || spec > prev.spec || (spec === prev.spec && d.order > prev.order)) {
        winner.set(d.prop, { spec, order: d.order, value: d.value })
      }
    }
  }

  const raw = new Map([...winner].map(([k, v]) => [k, v.value]))
  const done = new Map()
  const resolve = (name, stack) => {
    if (done.has(name)) return done.get(name)
    if (stack.includes(name)) throw new Error(`var() 순환 참조: ${[...stack, name].join(' → ')}`)
    if (!raw.has(name)) return undefined
    const value = substitute(raw.get(name), [...stack, name])
    done.set(name, value)
    return value
  }
  const substitute = (value, stack) => {
    let out = ''
    let i = 0
    while (i < value.length) {
      const at = value.indexOf('var(', i)
      if (at === -1) { out += value.slice(i); break }
      out += value.slice(i, at)
      let depth = 1
      let j = at + 4
      for (; j < value.length && depth; j++) {
        if (value[j] === '(') depth++
        else if (value[j] === ')') depth--
      }
      if (depth) throw new Error(`닫히지 않은 var( — ${value}`)
      const [nameText, ...fallbackParts] = splitTop(value.slice(at + 4, j - 1), ',')
      const name = nameText.trim()
      const fallback = fallbackParts.length ? fallbackParts.join(',').trim() : undefined
      const found = resolve(name, stack)
      if (found !== undefined) out += found
      else if (fallback !== undefined) out += substitute(fallback, stack)
      else throw new Error(`정의되지 않은 변수를 참조합니다: ${name} (${stack.at(-1)})`)
      i = j
    }
    return out.replace(/\s+/g, ' ').trim()
  }

  const result = new Map()
  for (const name of raw.keys()) {
    if (name.startsWith('--') || name === 'color-scheme') result.set(name, resolve(name, []))
  }
  return result
}

/** 규칙 목록에서 사용자 정의 속성 이름을 처음 나온 순서대로 */
export function declaredNames(rules) {
  const names = []
  for (const rule of rules) for (const d of rule.decls) if (d.prop.startsWith('--') && !names.includes(d.prop)) names.push(d.prop)
  return names
}
