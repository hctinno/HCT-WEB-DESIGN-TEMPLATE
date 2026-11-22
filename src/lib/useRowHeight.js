import { useEffect, useState } from 'react'

/**
 * 표 행 높이를 CSS 토큰(--row-height-*)에서 px 로 읽습니다.
 *
 * 왜 숫자로 적지 않는가:
 *   행 높이는 기본 32 / 40 / 48px 이지만, 손가락 입력 기기(pointer: coarse)에서는
 *   adaptive.css 가 촘촘 · 기본 행을 44px 로 올립니다(Apple HIG 최소 누름 영역).
 *   가상 스크롤이 32 · 40 을 그대로 쓰면 실제 행과 계산이 어긋나 스크롤할수록
 *   행이 밀리고 빈 칸이 생깁니다. 그래서 그려진 값을 읽고, 포인터가 바뀌면 다시 읽습니다.
 *
 * 서버 렌더링 · 토큰이 없는 환경에서는 기본값을 씁니다.
 */
export const ROW_HEIGHT_FALLBACK = { compact: 32, default: 40, relaxed: 48 }

export function readRowHeight(density) {
  const fallback = ROW_HEIGHT_FALLBACK[density] ?? ROW_HEIGHT_FALLBACK.default
  if (typeof window === 'undefined' || typeof getComputedStyle !== 'function') return fallback
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(`--row-height-${density}`))
  return Number.isFinite(v) && v > 0 ? v : fallback
}

export function useRowHeightPx(density) {
  const [px, setPx] = useState(() => readRowHeight(density))
  useEffect(() => {
    const update = () => setPx(readRowHeight(density))
    update()
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia('(pointer: coarse)') : null
    mq?.addEventListener?.('change', update)
    return () => mq?.removeEventListener?.('change', update)
  }, [density])
  return px
}
