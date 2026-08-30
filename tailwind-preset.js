// HCT 디자인 시스템 — Tailwind 프리셋
//
// 다른 프로젝트가 이 파일 하나로 토큰·스케일·다크모드 규칙을 전부 물려받습니다.
//
//   // 앱의 tailwind.config.js
//   import hct, { hctContent } from 'hct-web-design-template/tailwind-preset'
//
//   export default {
//     presets: [hct],
//     content: [...hctContent, './index.html', './src/**/*.{js,jsx,ts,tsx}'],
//   }
//
// `hctContent` 를 빼먹지 마세요. **Tailwind 는 프리셋의 content 를 병합하지
// 않습니다** — 앱의 content 가 프리셋 것을 통째로 덮어씁니다. 그러면
// node_modules 안의 컴포넌트가 스캔되지 않아 `bg-sidebar-bg`, `h-control-md`
// 같은 클래스가 전부 purge 되고, 화면이 스타일 없이 나옵니다.
// (실제로 이 저장소에서 그렇게 한 번 깨뜨려 보고 확인했습니다.)
//
// 빼먹었을 때를 대비해 개발 모드에서 경고하는 장치가 컴포넌트 쪽에 있습니다
// (src/components/index.js 의 스타일 점검).
//
// 중요: Tailwind 기본 색상 팔레트를 의도적으로 제거했습니다.
//       `bg-blue-500`, `text-gray-700` 같은 클래스는 이 프리셋을 쓰는 순간
//       **존재하지 않게 됩니다.** 그래야 에이전트가 임의의 색을 쓸 수 없습니다.
//       간격도 4px 배수로 제한되어 `h-7` 같은 클래스는 CSS 가 생성되지 않습니다.
//
// 요구 사항: Tailwind CSS 3.x. v4 는 설정 방식이 완전히 달라 이 프리셋이
//            동작하지 않습니다(package.json 의 peerDependencies 참고).
//
// (파일 머리말을 /* */ 가 아니라 // 로 쓴 이유: 글로브의 `**/*` 가 블록 주석을
//  그 자리에서 닫아버립니다. 실제로 여기서 한 번 겪었습니다.)
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

/**
 * 앱의 `content` 에 펼쳐 넣을 글로브.
 *
 * 프리셋에 content 를 넣어봐야 앱이 덮어쓰므로 소용이 없습니다. 경로를 손으로
 * 적게 하면 오타가 나므로 여기서 계산해 내보냅니다.
 */
export const hctContent = [join(HERE, 'dist/**/*.js')]

/** @type {import('tailwindcss').Config} */
export default {

  darkMode: ['variant', [
    '@media (prefers-color-scheme: dark) { &:not([data-theme="light"] *) }',
    '&:is([data-theme="dark"] *)',
  ]],
  theme: {
    /* 기본 팔레트를 통째로 대체 — 규격 외 색상 사용을 원천 차단 */
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',

      bg: {
        canvas: 'var(--color-bg-canvas)',
        surface: 'var(--color-bg-surface)',
        raised: 'var(--color-bg-raised)',
        sunken: 'var(--color-bg-sunken)',
        hover: 'var(--color-bg-hover)',
        active: 'var(--color-bg-active)',
        sidebar: 'var(--color-bg-sidebar)',
        overlay: 'var(--color-bg-overlay)',
      },
      fg: {
        DEFAULT: 'var(--color-text-primary)',
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        tertiary: 'var(--color-text-tertiary)',
        disabled: 'var(--color-text-disabled)',
        inverse: 'var(--color-text-inverse)',
        link: 'var(--color-text-link)',
      },
      line: {
        DEFAULT: 'var(--color-border-default)',
        subtle: 'var(--color-border-subtle)',
        strong: 'var(--color-border-strong)',
        focus: 'var(--color-border-focus)',
      },
      accent: {
        DEFAULT: 'var(--color-accent-solid)',
        solid: 'var(--color-accent-solid)',
        'solid-hover': 'var(--color-accent-solid-hover)',
        subtle: 'var(--color-accent-subtle)',
        'subtle-hover': 'var(--color-accent-subtle-hover)',
        text: 'var(--color-accent-text)',
        border: 'var(--color-accent-border)',
      },

      /* 상태 색상 — 워크플로 의미가 고정되어 있습니다 */
      success: {
        bg: 'var(--color-success-bg)', border: 'var(--color-success-border)',
        text: 'var(--color-success-text)', solid: 'var(--color-success-solid)',
      },
      warning: {
        bg: 'var(--color-warning-bg)', border: 'var(--color-warning-border)',
        text: 'var(--color-warning-text)', solid: 'var(--color-warning-solid)',
      },
      danger: {
        bg: 'var(--color-danger-bg)', border: 'var(--color-danger-border)',
        text: 'var(--color-danger-text)', solid: 'var(--color-danger-solid)',
      },
      info: {
        bg: 'var(--color-info-bg)', border: 'var(--color-info-border)',
        text: 'var(--color-info-text)', solid: 'var(--color-info-solid)',
      },
      muted: {
        bg: 'var(--color-neutral-bg)', border: 'var(--color-neutral-border)',
        text: 'var(--color-neutral-text)', solid: 'var(--color-neutral-solid)',
      },
      review: {
        bg: 'var(--color-review-bg)', border: 'var(--color-review-border)',
        text: 'var(--color-review-text)', solid: 'var(--color-review-solid)',
      },

      /* 사이드바 전용 — 본문과 밝기가 다를 수 있습니다 */
      sidebar: {
        bg: 'var(--color-sidebar-bg)',
        fg: 'var(--color-sidebar-fg)',
        muted: 'var(--color-sidebar-fg-muted)',
        subtle: 'var(--color-sidebar-fg-subtle)',
        hover: 'var(--color-sidebar-hover)',
        'active-bg': 'var(--color-sidebar-active-bg)',
        'active-fg': 'var(--color-sidebar-active-fg)',
        border: 'var(--color-sidebar-border)',
        'badge-bg': 'var(--color-sidebar-badge-bg)',
        'badge-fg': 'var(--color-sidebar-badge-fg)',
        rail: 'var(--color-sidebar-rail-bg)',
      },

      /* 차트 계열 색 — 고정 순서로만 배정합니다 */
      chart: {
        1: 'var(--chart-1)', 2: 'var(--chart-2)', 3: 'var(--chart-3)',
        4: 'var(--chart-4)', 5: 'var(--chart-5)', 6: 'var(--chart-6)',
        grid: 'var(--chart-grid)', axis: 'var(--chart-axis)',
      },
    },

    fontFamily: {
      sans: 'var(--font-sans)',
      mono: 'var(--font-mono)',
    },

    /* 고밀도 타입 스케일 — 본문 14px */
    fontSize: {
      micro: ['11px', { lineHeight: '14px' }],
      xs: ['12px', { lineHeight: '16px' }],
      sm: ['13px', { lineHeight: '18px' }],
      base: ['14px', { lineHeight: '20px' }],
      md: ['16px', { lineHeight: '24px' }],
      lg: ['20px', { lineHeight: '28px' }],
      xl: ['24px', { lineHeight: '32px' }],
      metric: ['28px', { lineHeight: '34px', letterSpacing: '-0.01em' }],
      'metric-lg': ['34px', { lineHeight: '40px', letterSpacing: '-0.02em' }],
    },

    /* 4px 기준 간격 — 임의 값(p-[13px]) 사용 금지 */
    spacing: {
      0: '0px', px: '1px', 0.5: '2px', 1: '4px', 1.5: '6px', 2: '8px',
      2.5: '10px', 3: '12px', 4: '16px', 5: '20px', 6: '24px', 8: '32px',
      10: '40px', 12: '48px', 16: '64px', 20: '80px', 24: '96px',
    },

    borderRadius: {
      none: '0px', sm: '3px', DEFAULT: '6px', md: '6px',
      lg: '8px', xl: '12px', full: '9999px',
    },

    boxShadow: {
      none: 'none',
      sm: 'var(--shadow-sm)',
      DEFAULT: 'var(--shadow-sm)',
      md: 'var(--shadow-md)',
      lg: 'var(--shadow-lg)',
      overlay: 'var(--shadow-overlay)',
    },

    screens: {
      sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px',
    },

    zIndex: {
      auto: 'auto', 0: '0', base: '0', sticky: '10', sidebar: '20',
      topbar: '30', drawer: '40', overlay: '50', modal: '60',
      popover: '70', toast: '80', palette: '90',
    },

    extend: {
      /* 앱 셸 고정 규격 */
      width: {
        sidebar: 'var(--layout-sidebar-width)',
        'sidebar-collapsed': 'var(--layout-sidebar-collapsed-width)',
        rail: 'var(--layout-rail-width)',
        panel: 'var(--layout-right-panel-width)',
        'panel-wide': 'var(--layout-right-panel-wide-width)',
      },
      height: {
        topbar: 'var(--layout-topbar-height)',
        'control-xs': 'var(--control-height-xs)',
        'control-sm': 'var(--control-height-sm)',
        'control-md': 'var(--control-height-md)',
        'control-lg': 'var(--control-height-lg)',
        'row-compact': 'var(--row-height-compact)',
        'row-default': 'var(--row-height-default)',
        'row-relaxed': 'var(--row-height-relaxed)',
      },
      maxWidth: { content: 'var(--layout-content-max-width)' },
      transitionDuration: {
        instant: 'var(--duration-instant)',
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        standard: 'var(--easing-standard)',
        enter: 'var(--easing-enter)',
        exit: 'var(--easing-exit)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in var(--duration-fast) var(--easing-enter)',
        'slide-in-right': 'slide-in-right var(--duration-normal) var(--easing-standard)',
        'scale-in': 'scale-in var(--duration-fast) var(--easing-enter)',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
}
