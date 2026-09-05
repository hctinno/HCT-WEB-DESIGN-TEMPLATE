import { useEffect, useState } from 'react'
import { cn } from '../../lib/cn'
import { isDarkActive } from '../../lib/theme'
/* 번들러가 data URI 로 인라인합니다(vite.config 의 assetsInlineLimit).
   외부 파일 참조로 두면 정적 배포·임베드 환경에서 로고만 깨집니다. */
import logoOnLight from '../../assets/brand/hct-logo-color.png'
import logoOnDark from '../../assets/brand/hct-logo-white.png'
import markGlyph from '../../assets/brand/hct-mark-white.png'

/**
 * Logo — HCT 회사 로고.
 *
 * 자산 출처: hct-report-template 저장소의 brand/hct/.
 * 보고서와 화면이 같은 로고 파일을 쓰도록 옮겨 왔습니다.
 *
 * **밝은 면과 어두운 면에 다른 파일을 씁니다.** 로고 원색 #2F4A9C 는
 * 어두운 배경에서 대비가 2:1 수준이라 거의 보이지 않습니다. 어두운 면에는
 * 흰색 녹아웃판을 씁니다. (보고서 템플릿이 같은 이유로 두 벌을 둡니다.)
 *
 * 개발 에이전트 사용 규칙:
 *   - 어두운 사이드바 위에는 `on="dark"`, 흰 콘텐츠 위에는 `on="light"`.
 *     생략하면 현재 테마를 보고 고릅니다 — 다만 사이드바처럼 테마와 무관하게
 *     어두운 면에는 반드시 명시하세요.
 *   - 로고를 늘리거나 비율을 바꾸지 마세요. height 만 지정합니다.
 *   - 원본이 264×86 래스터입니다. 화면(24~40px)에는 충분하지만 인쇄에는
 *     부족합니다. SVG 가 확보되면 이 컴포넌트만 고치면 됩니다.
 *   - 로고 파일은 번들에 data URI 로 인라인됩니다. 경로 참조로 바꾸면
 *     정적 배포나 단일 파일 임베드에서 로고만 깨집니다.
 *
 * @param {object} props
 * @param {'light'|'dark'|'auto'} [props.on] - 로고가 놓이는 면의 밝기
 * @param {number} [props.height] - px. 비율은 자동
 * @param {boolean} [props.withWordmark] - 회사명을 텍스트로 함께 표시
 */
export function Logo({ on = 'auto', height = 24, withWordmark = false, className }) {
  const [autoDark, setAutoDark] = useState(false)

  useEffect(() => {
    if (on !== 'auto') return
    const update = () => setAutoDark(isDarkActive())
    update()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', update)
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => { mq.removeEventListener('change', update); observer.disconnect() }
  }, [on])

  const dark = on === 'dark' || (on === 'auto' && autoDark)
  const src = dark ? logoOnDark : logoOnLight

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <img
        src={src}
        alt="HCT"
        height={height}
        style={{ height, width: 'auto' }}
        className="block shrink-0"
      />
      {withWordmark && (
        <span className={cn('text-sm font-medium', dark ? 'text-sidebar-fg' : 'text-fg-secondary')}>
          주식회사 에이치시티
        </span>
      )}
    </span>
  )
}

/**
 * LogoMark — 좁은 공간용 정사각 마크.
 *
 * 워크스페이스 레일이나 접힌 사이드바처럼 폭이 없는 자리에서
 * 가로로 긴 로고를 억지로 줄이면 글자가 뭉갭니다. 이럴 때는
 * 워드마크 첫 글자 대신 **로고 자체에서 오려낸 "H"** 를 씁니다 — 타이핑한
 * 글자를 넣으면 로고의 기울어진 획 스타일과 안 맞습니다.
 *
 * 원본 로고는 "HCT" 세 글자가 위쪽 사선 하나로 이어지는 다이내믹 슬랜트
 * 형태라 획이 서로 맞닿아 있습니다. `hct-mark-*.png` 는 그 연결부 바로
 * 앞에서 잘라낸 것이라 "H"로 읽히지만, 벡터 원본이 아니라 래스터를 오려낸
 * 결과라 확대하면 계단현상이 보일 수 있습니다. SVG 가 확보되면 이 자산부터
 * 교체하세요.
 */
export function LogoMark({ size = 32, className }) {
  const padding = Math.round(size * 0.16)
  return (
    <span
      aria-label="HCT"
      style={{ width: size, height: size, padding }}
      className={cn('inline-flex shrink-0 items-center justify-center rounded-lg bg-accent-solid', className)}
    >
      <img src={markGlyph} alt="" className="block h-full w-full object-contain" />
    </span>
  )
}
