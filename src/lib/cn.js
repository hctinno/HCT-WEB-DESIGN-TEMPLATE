import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * 클래스 이름 결합 헬퍼.
 *
 * 단순 문자열 연결이 아니라 **충돌을 해소**합니다. 이게 중요한 이유:
 *
 *   cn('w-full', 'w-[240px]')   → 'w-[240px]'   (뒤에 온 것이 이김)
 *   'w-full ' + 'w-[240px]'     → 둘 다 남고, CSS 순서가 승자를 정함 (예측 불가)
 *
 * 컴포넌트에 className 을 넘겨 기본값을 덮어쓰는 일이 흔하므로,
 * 이 동작이 없으면 "왜 내 className 이 안 먹지?" 하는 상황이 계속 생깁니다.
 *
 * tailwind-merge 는 표준 Tailwind 스케일만 알고 있으므로, 이 시스템이 추가한
 * 커스텀 값(h-control-md, text-metric, w-sidebar 등)을 아래에서 등록합니다.
 * tailwind-preset.js 에 새 스케일을 추가하면 여기도 함께 갱신하세요.
 * 빠뜨려도 **오류가 나지 않습니다** — 두 클래스가 나란히 남고 승자를 CSS
 * 순서가 정합니다. 그래서 test/cn.test.mjs 가 프리셋의 모든 커스텀 값에
 * 대해 실제로 충돌이 해소되는지 확인합니다.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      /* 컨트롤·행 높이 (tailwind.config.js > extend.height) */
      h: [
        { h: ['topbar', 'control-xs', 'control-sm', 'control-md', 'control-lg',
              'row-compact', 'row-default', 'row-relaxed'] },
      ],
      /* 셸 고정 너비 (tailwind.config.js > extend.width) */
      w: [
        { w: ['sidebar', 'sidebar-collapsed', 'panel', 'panel-wide', 'rail'] },
      ],
      /* 고밀도 타입 스케일 (tailwind.config.js > theme.fontSize) */
      'font-size': [
        { text: ['micro', 'sm', 'base', 'md', 'lg', 'xl', 'metric', 'metric-lg'] },
      ],
      /* 콘텐츠 최대 폭 */
      'max-w': [{ 'max-w': ['content'] }],
    },
  },
})

/**
 * @param  {...any} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
