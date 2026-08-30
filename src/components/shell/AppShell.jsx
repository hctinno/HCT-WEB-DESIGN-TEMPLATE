import { useEffect, useState } from 'react'
import { cn } from '../../lib/cn'
import { verifyStyles } from '../../lib/verifyStyles'

/**
 * AppShell — 모든 화면의 최상위 골격.
 *
 * 노션·지라·슬랙이 공유하는 구조입니다:
 *   [사이드바] [상단바 + 콘텐츠] [우측 패널(선택)]
 *
 * 개발 에이전트 사용 규칙:
 *   - 모든 페이지는 반드시 AppShell 안에 들어갑니다. 예외 없습니다.
 *   - 사이드바/상단바 높이·너비를 직접 지정하지 마세요. 토큰이 정합니다.
 *   - children 은 페이지 콘텐츠만 담습니다. 자체 헤더를 또 만들지 마세요.
 *
 * @param {object} props
 * @param {React.ReactNode} props.sidebar      - <Sidebar /> 결과
 * @param {React.ReactNode} props.topbar       - <Topbar /> 결과
 * @param {React.ReactNode} props.children     - 페이지 콘텐츠
 * @param {React.ReactNode} [props.rightPanel] - <RightPanel /> 결과 (없으면 미표시)
 * @param {boolean} [props.sidebarCollapsed]
 * @param {(next: boolean) => void} [props.onSidebarCollapsedChange]
 */
export function AppShell({
  sidebar,
  topbar,
  children,
  rightPanel,
  sidebarCollapsed = false,
  onSidebarCollapsedChange,
}) {
  /* lg 미만에서는 사이드바가 오버레이로 전환됩니다 */
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  /* 설치가 제대로 됐는지 개발 모드에서 한 번 확인합니다. 배럴에 두면
     트리셰이킹이 지워버릴 수 있어, 앱이 반드시 렌더하는 여기에 둡니다. */
  useEffect(verifyStyles, [])

  useEffect(() => {
    if (!mobileNavOpen) return
    const onKey = (e) => e.key === 'Escape' && setMobileNavOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileNavOpen])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-canvas text-fg-primary">
      {/* 건너뛰기 링크 — 평소엔 숨어 있다가 Tab 첫 타에 나타납니다.
          이게 없으면 키보드 사용자는 화면을 바꿀 때마다 사이드바 항목 전체를
          Tab 으로 통과해야 본문에 닿습니다. */}
      <a
        href="#main-content"
        className={cn(
          'sr-only-focusable absolute left-3 top-3 z-palette rounded-md',
          'border border-line-focus bg-bg-raised px-3 py-2 text-base font-medium text-fg-primary shadow-lg',
        )}
      >
        본문으로 건너뛰기
      </a>

      {/* --- 사이드바: lg 이상에서 고정 --- */}
      <aside
        className={cn(
          'z-sidebar hidden shrink-0 border-r border-line-subtle bg-bg-sidebar',
          'transition-[width] duration-normal ease-standard lg:block',
          sidebarCollapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
        )}
      >
        {sidebar}
      </aside>

      {/* --- 사이드바: lg 미만에서 오버레이 --- */}
      {mobileNavOpen && (
        <>
          <div
            className="fixed inset-0 z-overlay bg-bg-overlay animate-fade-in lg:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-drawer w-sidebar border-r border-line-subtle bg-bg-sidebar animate-slide-in-right lg:hidden">
            {sidebar}
          </aside>
        </>
      )}

      {/* --- 상단바 + 콘텐츠 --- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-topbar flex h-topbar shrink-0 items-center border-b border-line-subtle bg-bg-surface">
          <button
            type="button"
            className="mx-2 flex h-control-md w-control-md items-center justify-center rounded-md text-fg-secondary hover:bg-bg-hover lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="탐색 메뉴 열기"
          >
            <MenuIcon />
          </button>
          <button
            type="button"
            className="mx-2 hidden h-control-md w-control-md items-center justify-center rounded-md text-fg-secondary hover:bg-bg-hover lg:flex"
            onClick={() => onSidebarCollapsedChange?.(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            aria-expanded={!sidebarCollapsed}
          >
            <SidebarIcon />
          </button>
          <div className="min-w-0 flex-1">{topbar}</div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="scroll-thin min-w-0 flex-1 overflow-y-auto" id="main-content">
            {children}
          </main>

          {/* --- 우측 패널: lg 이상 고정, 미만에서는 전체 화면 --- */}
          {rightPanel && (
            <div className="fixed inset-0 z-drawer bg-bg-surface lg:static lg:z-base lg:w-panel lg:shrink-0 lg:border-l lg:border-line-subtle">
              {rightPanel}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 페이지 콘텐츠 래퍼. AppShell 의 children 안에서 사용합니다.
 * 좌우 여백과 최대 폭을 통일해, 어떤 에이전트가 만들어도 같은 정렬이 나옵니다.
 */
export function PageContainer({ children, className, fullWidth = false }) {
  return (
    <div
      className={cn(
        'px-6 py-5',
        !fullWidth && 'mx-auto max-w-content',
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * 페이지 헤더. 제목 + 설명 + 우측 액션.
 * 모든 페이지가 같은 제목 체계를 갖도록 강제합니다.
 */
export function PageHeader({ title, description, actions, breadcrumb }) {
  return (
    <div className="mb-5">
      {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-fg-primary">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-fg-tertiary">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function SidebarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 3v10" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
