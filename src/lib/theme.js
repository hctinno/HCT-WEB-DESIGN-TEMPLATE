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
    /* 저장소 접근 불가 — 시스템 설정으로 처리 */
  }
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
