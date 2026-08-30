import { useEffect, useRef, useState } from 'react'

/**
 * useMeasuredWidth — 컨테이너의 실제 픽셀 폭.
 *
 * SVG 차트에 왜 필요한가:
 *   viewBox 를 고정 폭(예: 640)으로 두고 `width:100%` 를 주면, 기본
 *   preserveAspectRatio 가 가로세로 비를 유지하려고 **letterbox** 를 만듭니다.
 *   넓은 컨테이너에서 차트가 가운데 640px 만 차지하고 양옆이 비어 버립니다.
 *   (실제로 그렇게 만들었다가 렌더링에서 발견했습니다.)
 *
 *   preserveAspectRatio="none" 으로 늘리면 선 굵기와 글자가 가로로 찌그러집니다.
 *   그래서 정답은 **컨테이너 폭을 재서 viewBox 를 그 폭으로 맞추는 것**입니다.
 *   그러면 1픽셀이 1단위가 되어 왜곡이 없습니다.
 */
export function useMeasuredWidth(fallback = 640) {
  const ref = useRef(null)
  const [width, setWidth] = useState(fallback)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setWidth(Math.max(240, Math.round(el.clientWidth)))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return [ref, width]
}
