import { useEffect } from 'react'

/**
 * useBottomBar — 화면 하단 중앙을 두고 다투는 요소들을 조정합니다.
 *
 * 이 시스템에는 하단 중앙에 뜨는 것이 셋 있습니다:
 *   BulkActionBar  행을 선택했을 때
 *   SaveBar        폼에 저장하지 않은 변경이 있을 때
 *   Toast          행동의 결과를 알릴 때
 *
 * 각자 `fixed bottom-4 left-1/2` 로 자리를 잡으면 둘이 동시에 뜨는 순간
 * 겹칩니다. 저장 버튼이 토스트에 가려 눌리지 않는 식입니다.
 * (실제로 그렇게 만들었다가 렌더링 테스트에서 클릭이 막혀 발견했습니다.)
 *
 * 해법: 상주형 바(BulkActionBar·SaveBar)가 자기 높이를 CSS 변수로 알리고,
 * 토스트는 그만큼 위로 올라갑니다. 서로를 몰라도 자리가 겹치지 않습니다.
 *
 * @param {boolean} active - 바가 화면에 있는가
 * @param {number} height  - 바가 차지하는 높이(px, 여백 포함)
 */
export function useBottomBar(active, height = 56) {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return
    const root = document.documentElement
    const previous = root.style.getPropertyValue('--bottom-bar-offset')
    root.style.setProperty('--bottom-bar-offset', `${height}px`)
    return () => {
      if (previous) root.style.setProperty('--bottom-bar-offset', previous)
      else root.style.removeProperty('--bottom-bar-offset')
    }
  }, [active, height])
}
