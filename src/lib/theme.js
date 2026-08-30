/**
 * 테마 제어. 라이트/다크/시스템 세 가지 상태를 다룹니다.
 *
 *   'light'  → data-theme="light"  (시스템이 다크여도 라이트 유지)
 *   'dark'   → data-theme="dark"
 *   'system' → data-theme 속성 제거 (prefers-color-scheme 를 따름)
 *
 * 개발 에이전트 주의: 저장소 접근은 시크릿 모드·차단 설정에서 예외를 던지므로
 * 반드시 try/catch 로 감쌉니다.
 */

const STORAGE_KEY = 'hct-theme'

/** @typedef {'light' | 'dark' | 'system'} ThemeMode */

/** @returns {ThemeMode} */
export function getStoredTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark' || value === 'system') return value
  } catch {
    /* 저장소 접근 불가 — 아래 DOM 확인으로 넘어갑니다 */
  }

  /* 저장된 선택이 없으면, 이미 문서에 찍혀 있는 값을 존중합니다.
     호스트 환경(임베드·미리보기 등)이 뷰어의 테마를 data-theme 로 지정해
     둔 경우, 여기서 'system' 을 반환하면 applyTheme 이 그 속성을 지워
     뷰어가 고른 테마를 덮어쓰게 됩니다. */
  const stamped = typeof document !== 'undefined'
    ? document.documentElement.getAttribute('data-theme')
    : null
  if (stamped === 'light' || stamped === 'dark') return stamped

  return 'system'
}

/** @param {ThemeMode} mode */
export function applyTheme(mode) {
  const root = document.documentElement
  if (mode === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', mode)
  }
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* 저장 실패는 무시 — 화면은 이미 반영됨 */
  }
}

/** 앱 부팅 시 1회 호출. 깜빡임을 막으려면 <head> 인라인 스크립트에서 호출하세요. */
export function initTheme() {
  applyTheme(getStoredTheme())
}

/** @returns {boolean} 현재 실제로 렌더링되는 모드가 다크인지 */
export function isDarkActive() {
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr === 'dark') return true
  if (attr === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/* ─────────────────────────────────────────────────────────────
   색 팔레트 — 테마(라이트/다크)와는 별개의 축입니다.

   테마   : 밝기. 뷰어의 환경이나 선택을 따릅니다.
   팔레트 : 제품의 색 정체성. 조직이 한 번 정하고 바뀌지 않습니다.

   두 축을 분리해 두면 팔레트를 바꿔도 라이트·다크가 모두 따라옵니다.
   ───────────────────────────────────────────────────────────── */

const PALETTE_KEY = 'hct-palette'

/** 선택 가능한 팔레트. tokens/palettes.json 과 같은 순서를 유지하세요. */
export const PALETTES = [
  { id: 'graphite', label: '그래파이트', tagline: '무채색 강조 · 따뜻한 중성색' },
  { id: 'blue',     label: '딥블루',     tagline: '깊은 코발트 · 차가운 중성색' },
  { id: 'indigo',   label: '인디고',     tagline: '채도 낮춘 남보라 · 중립 회색' },
  { id: 'azure',    label: '애저',       tagline: '기본 파랑 (기존)' },
]

/** 제품 기본 팔레트. 조직이 정하면 이 값을 바꾸세요. */
export const DEFAULT_PALETTE = 'graphite'

export function getStoredPalette() {
  try {
    const value = localStorage.getItem(PALETTE_KEY)
    if (PALETTES.some((p) => p.id === value)) return value
  } catch {
    /* 저장소 접근 불가 */
  }
  const stamped = typeof document !== 'undefined'
    ? document.documentElement.getAttribute('data-palette')
    : null
  if (PALETTES.some((p) => p.id === stamped)) return stamped
  return DEFAULT_PALETTE
}

/** @param {string} id */
export function applyPalette(id) {
  document.documentElement.setAttribute('data-palette', id)
  try {
    localStorage.setItem(PALETTE_KEY, id)
  } catch {
    /* 저장 실패는 무시 — 화면은 이미 반영됨 */
  }
}

/** 앱 부팅 시 1회. initTheme 과 함께 호출하세요. */
export function initPalette() {
  applyPalette(getStoredPalette())
}
