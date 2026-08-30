import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * useVirtualRows — 보이는 행만 그립니다.
 *
 * 5,000건짜리 목록을 전부 DOM 에 올리면 스크롤이 끊기고 브라우저가 버벅입니다.
 * 화면에 보이는 30~40행 + 여유분만 그리고, 위아래를 빈 공간으로 밀어냅니다.
 *
 * 왜 라이브러리를 쓰지 않는가:
 *   행 높이가 토큰으로 고정되어 있어(32/40/48px) 계산이 단순합니다. 가변 높이
 *   측정이 필요 없으므로 40줄이면 충분하고, 의존성 하나를 아낍니다.
 *
 * 주의 — 가상화가 깨뜨리는 것들:
 *   - **Ctrl+F 브라우저 검색**이 안 보이는 행을 찾지 못합니다. 그래서 목록 자체의
 *     검색이 반드시 있어야 합니다(이 시스템의 QueryBar 가 그 역할).
 *   - 화면 밖 행은 DOM 에 없으므로 스크린리더가 훑을 수 없습니다.
 *     총 건수를 aria 로 알리고, 표 보기/내보내기 같은 대안을 두세요.
 *   - 그룹 헤더가 섞이면 행 높이가 균일하지 않아 계산이 틀립니다.
 *     그룹핑과 가상화는 함께 쓰지 마세요(이 시스템은 그룹핑 시 가상화를 끕니다).
 *
 * @param {object} options
 * @param {number} options.count      - 전체 행 수
 * @param {number} options.rowHeight  - 행 높이(px)
 * @param {number} [options.overscan] - 화면 밖 여유 행 수
 * @param {boolean} [options.enabled]
 */
export function useVirtualRows({ count, rowHeight, overscan = 8, enabled = true }) {
  const scrollRef = useRef(null)
  const [range, setRange] = useState({ start: 0, end: Math.min(count, 40) })
  const [viewportHeight, setViewportHeight] = useState(0)

  const recompute = useCallback(() => {
    const el = scrollRef.current
    if (!el || !enabled) return
    const top = el.scrollTop
    const height = el.clientHeight
    setViewportHeight(height)
    const visible = Math.ceil(height / rowHeight)
    const start = Math.max(0, Math.floor(top / rowHeight) - overscan)
    const end = Math.min(count, start + visible + overscan * 2)
    setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }))
  }, [count, rowHeight, overscan, enabled])

  useEffect(() => {
    if (!enabled) return
    const el = scrollRef.current
    if (!el) return
    recompute()
    el.addEventListener('scroll', recompute, { passive: true })
    const ro = new ResizeObserver(recompute)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', recompute)
      ro.disconnect()
    }
  }, [recompute, enabled])

  /* 목록이 바뀌면(필터 등) 범위를 다시 잡습니다 */
  useEffect(() => { recompute() }, [count, recompute])

  /** 특정 행이 보이도록 스크롤 — 키보드 이동과 함께 씁니다 */
  const scrollToIndex = useCallback((index) => {
    const el = scrollRef.current
    if (!el) return
    const top = index * rowHeight
    const bottom = top + rowHeight
    if (top < el.scrollTop) el.scrollTop = top
    else if (bottom > el.scrollTop + el.clientHeight) el.scrollTop = bottom - el.clientHeight
  }, [rowHeight])

  if (!enabled) {
    return {
      scrollRef,
      start: 0,
      end: count,
      padTop: 0,
      padBottom: 0,
      scrollToIndex,
      virtualized: false,
    }
  }

  return {
    scrollRef,
    start: range.start,
    end: range.end,
    padTop: range.start * rowHeight,
    padBottom: Math.max(0, (count - range.end) * rowHeight),
    scrollToIndex,
    virtualized: true,
    viewportHeight,
  }
}
