import { cn } from '../../lib/cn'

/**
 * Sidebar — 좌측 탐색 영역.
 *
 * 구조는 슬랙/지라를 따릅니다:
 *   [워크스페이스 전환기] [내비게이션 그룹들] [하단 고정 영역]
 *
 * 개발 에이전트 사용 규칙:
 *   - 항목은 반드시 SidebarItem 으로 만듭니다. <a> 를 직접 스타일링하지 마세요.
 *   - 그룹이 3개를 넘으면 SidebarGroup 의 label 로 반드시 구분합니다.
 *   - collapsed 상태에서 라벨은 숨기되 title 속성으로 접근성을 유지합니다.
 */
export function Sidebar({ header, children, footer, collapsed = false }) {
  return (
    <nav className="flex h-full flex-col" aria-label="주 탐색">
      {header && (
        <div className="flex h-topbar shrink-0 items-center border-b border-line-subtle px-3">
          {header}
        </div>
      )}
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {children}
      </div>
      {footer && (
        <div className="shrink-0 border-t border-line-subtle p-2">{footer}</div>
      )}
    </nav>
  )
}

/**
 * 워크스페이스/프로젝트 전환기. 사이드바 최상단에 위치합니다.
 */
export function WorkspaceSwitcher({ name, subtitle, initial, onClick, collapsed = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-bg-hover"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-accent-solid text-xs font-semibold text-fg-inverse">
        {initial ?? name?.charAt(0)}
      </span>
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-fg-primary">{name}</span>
            {subtitle && (
              <span className="block truncate text-micro text-fg-tertiary">{subtitle}</span>
            )}
          </span>
          <ChevronDown />
        </>
      )}
    </button>
  )
}

/**
 * 내비게이션 그룹. label 이 있으면 섹션 제목이 붙습니다.
 */
export function SidebarGroup({ label, children, collapsed = false }) {
  return (
    <div className="mb-4 last:mb-0">
      {label && !collapsed && (
        <div className="px-2 pb-1 text-micro font-semibold uppercase tracking-[0.06em] text-fg-tertiary">
          {label}
        </div>
      )}
      <ul className="space-y-px">{children}</ul>
    </div>
  )
}

/**
 * 내비게이션 항목.
 *
 * @param {object} props
 * @param {React.ReactNode} props.icon   - 16px 아이콘. 항목마다 반드시 있어야 합니다(접힘 상태 대비).
 * @param {string} props.label
 * @param {boolean} [props.active]
 * @param {string|number} [props.badge]  - 미읽음 수 등
 * @param {string} [props.href]
 * @param {() => void} [props.onClick]
 * @param {boolean} [props.collapsed]
 */
export function SidebarItem({
  icon,
  label,
  active = false,
  badge,
  href,
  onClick,
  collapsed = false,
}) {
  const Tag = href ? 'a' : 'button'
  return (
    <li>
      <Tag
        href={href}
        onClick={onClick}
        type={href ? undefined : 'button'}
        title={collapsed ? label : undefined}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex h-control-lg w-full items-center gap-2 rounded-md px-2 text-sm',
          'transition-colors duration-instant',
          collapsed && 'justify-center px-0',
          active
            ? 'bg-accent-subtle font-semibold text-accent-text'
            : 'font-normal text-fg-secondary hover:bg-bg-hover hover:text-fg-primary',
        )}
      >
        <span className="flex h-4 w-4 shrink-0 items-center justify-center">{icon}</span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate text-left">{label}</span>
            {badge != null && (
              <span className="shrink-0 rounded-full bg-muted-bg px-1.5 text-micro font-medium tabular text-muted-text">
                {badge}
              </span>
            )}
          </>
        )}
      </Tag>
    </li>
  )
}

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0 text-fg-tertiary">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
