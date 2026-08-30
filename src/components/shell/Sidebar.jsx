import { useState } from 'react'
import { cn } from '../../lib/cn'

/**
 * Sidebar — 좌측 탐색 영역.
 *
 * **전역 fg 토큰이 아니라 사이드바 전용 토큰을 씁니다.**
 * 팔레트에 따라 사이드바가 본문보다 어두울 수 있기 때문입니다(슬랙식 대비).
 * `text-fg-primary` 를 쓰면 어두운 사이드바에서 글자가 사라집니다.
 *
 * 개발 에이전트 사용 규칙:
 *   - 사이드바 안에서는 `text-sidebar-fg`, `bg-sidebar-hover` 같은
 *     sidebar-* 토큰만 쓰세요.
 *   - 항목은 SidebarItem 으로 만듭니다. <a> 를 직접 스타일링하지 마세요.
 *   - 그룹이 3개를 넘으면 SidebarGroup 의 label 로 구분하고,
 *     항목이 많은 그룹은 collapsible 을 켜세요.
 */
export function Sidebar({ header, children, footer, collapsed = false, rail }) {
  return (
    <div className="flex h-full">
      {rail}
      <nav className="flex h-full min-w-0 flex-1 flex-col bg-sidebar-bg" aria-label="주 탐색">
        {header && (
          <div className="flex h-topbar shrink-0 items-center border-b border-sidebar-border px-3">
            {header}
          </div>
        )}
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-2 py-3">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-sidebar-border p-2">{footer}</div>
        )}
      </nav>
    </div>
  )
}

/**
 * WorkspaceRail — 최좌측 아이콘 레일.
 *
 * 여러 워크스페이스·환경·테넌트를 오가는 도구의 관용구입니다.
 * 사이드바를 갈아끼우는 상위 축이라, 사이드바 안이 아니라 밖에 둡니다.
 * 아이콘만 있으므로 title 과 aria-label 이 필수입니다.
 *
 * @param {{id: string, label: string, initial?: string, badge?: number}[]} props.items
 */
export function WorkspaceRail({ items = [], activeId, onSelect, footer }) {
  return (
    <div className="flex w-rail shrink-0 flex-col items-center gap-1.5 border-r border-sidebar-border bg-sidebar-rail py-2">
      {items.map((item) => {
        const active = item.id === activeId
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect?.(item.id)}
            title={item.label}
            aria-label={item.label}
            aria-current={active ? 'true' : undefined}
            className={cn(
              'relative flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold',
              'transition-colors duration-instant',
              active
                ? 'bg-accent-solid text-fg-inverse'
                : 'bg-sidebar-hover text-sidebar-muted hover:text-sidebar-fg',
            )}
          >
            {item.initial ?? item.label.charAt(0)}
            {item.badge > 0 && !active && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sidebar-badge-bg px-1 text-micro font-bold tabular text-sidebar-badge-fg">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </button>
        )
      })}
      {footer && <div className="mt-auto">{footer}</div>}
    </div>
  )
}

/** 워크스페이스/프로젝트 전환기. 사이드바 최상단에 위치합니다. */
export function WorkspaceSwitcher({ name, subtitle, initial, onClick, collapsed = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-sidebar-hover"
    >
      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-sidebar-fg">{name}</span>
            {subtitle && (
              <span className="block truncate text-micro text-sidebar-subtle">{subtitle}</span>
            )}
          </span>
          <ChevronDown />
        </>
      ) : (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-accent-solid text-xs font-semibold text-fg-inverse">
          {initial ?? name?.charAt(0)}
        </span>
      )}
    </button>
  )
}

/**
 * 내비게이션 그룹. collapsible 을 켜면 접힙니다.
 *
 * 슬랙의 사이드바가 채널이 수십 개여도 견디는 이유가 이것입니다.
 * 섹션을 접을 수 있으면 사용자가 자기에게 필요한 것만 펼쳐 둡니다.
 */
export function SidebarGroup({ label, children, collapsed = false, collapsible = false, defaultOpen = true, count }) {
  const [open, setOpen] = useState(defaultOpen)
  const showChildren = !collapsible || open

  return (
    <div className="mb-4 last:mb-0">
      {label && !collapsed && (
        collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex w-full items-center gap-1 rounded-sm px-2 py-0.5 text-micro font-semibold uppercase tracking-[0.06em] text-sidebar-subtle hover:text-sidebar-fg"
          >
            <Chevron open={open} />
            {label}
            {count != null && <span className="tabular font-normal">{count}</span>}
          </button>
        ) : (
          <div className="px-2 pb-1 text-micro font-semibold uppercase tracking-[0.06em] text-sidebar-subtle">
            {label}
          </div>
        )
      )}
      {showChildren && <ul className="space-y-px">{children}</ul>}
    </div>
  )
}

/**
 * 내비게이션 항목.
 *
 * 안읽음 표현이 이 시스템의 핵심 관용구입니다:
 *   unread      → 글자가 굵어지고 색이 진해집니다 (배지 없이도 눈에 띔)
 *   mentions    → 빨간 배지에 숫자 (나를 직접 부른 것)
 *   badge       → 중립 카운트 (전체 건수 같은 참고 수치)
 *
 * 셋을 구분하지 않으면 모든 숫자가 똑같이 급해 보여서 아무것도 급하지 않게 됩니다.
 *
 * @param {object} props
 * @param {boolean} [props.unread]   - 안읽음 (굵게)
 * @param {number} [props.mentions]  - 나를 부른 수 (빨간 배지)
 * @param {string|number} [props.badge] - 중립 카운트
 */
export function SidebarItem({
  icon,
  label,
  active = false,
  unread = false,
  mentions,
  badge,
  href,
  onClick,
  collapsed = false,
  trailing,
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
          'group flex h-control-lg w-full items-center gap-2 rounded-md px-2 text-sm',
          'transition-colors duration-instant',
          collapsed && 'justify-center px-0',
          active
            ? 'bg-sidebar-active-bg font-semibold text-sidebar-active-fg'
            : unread
              ? 'font-semibold text-sidebar-fg hover:bg-sidebar-hover'
              : 'font-normal text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-fg',
        )}
      >
        <span className="flex h-4 w-4 shrink-0 items-center justify-center">{icon}</span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate text-left">{label}</span>
            {trailing}
            {mentions > 0 && (
              <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-sidebar-badge-bg px-1 text-micro font-bold tabular text-sidebar-badge-fg">
                {mentions > 99 ? '99+' : mentions}
              </span>
            )}
            {/* 활성 항목은 배경이 강조색이라 sidebar-subtle 로는 2.66:1 밖에
                안 나옵니다(axe: color-contrast). 그 위에서는 활성 글자색을 씁니다. */}
            {mentions == null && badge != null && (
              <span className={cn(
                'shrink-0 text-micro tabular',
                active ? 'text-sidebar-active-fg' : 'text-sidebar-subtle',
              )}>
                {badge}
              </span>
            )}
          </>
        )}
      </Tag>
    </li>
  )
}

/** 사이드바 하단의 현재 사용자 — 프레즌스 점 포함 */
export function SidebarUser({ name, status = 'online', detail, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-sidebar-hover"
    >
      <Presence status={status} name={name} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-sidebar-fg">{name}</span>
        {detail && <span className="block truncate text-micro text-sidebar-subtle">{detail}</span>}
      </span>
    </button>
  )
}

/**
 * Presence — 접속 상태 점.
 *
 * 색만으로 상태를 전달하지 않기 위해 모양도 다르게 합니다:
 * 온라인은 채운 원, 자리비움은 테두리만, 오프라인은 옅은 테두리.
 */
export function Presence({ status = 'online', name, size = 'md' }) {
  const box = size === 'sm' ? 'h-4 w-4 text-micro' : 'h-6 w-6 text-xs'
  const dot = {
    online: 'bg-success-solid border-success-solid',
    away: 'bg-transparent border-warning-solid',
    offline: 'bg-transparent border-sidebar-subtle',
  }[status] ?? 'bg-transparent border-sidebar-subtle'
  const label = { online: '접속 중', away: '자리 비움', offline: '오프라인' }[status]

  return (
    <span className="relative shrink-0">
      <span className={cn(
        'flex items-center justify-center rounded-md bg-accent-solid font-semibold text-fg-inverse',
        box,
      )}>
        {name?.charAt(0) ?? '?'}
      </span>
      <span
        title={label}
        aria-label={label}
        className={cn(
          'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2',
          'ring-2 ring-sidebar-bg',
          dot,
        )}
      />
    </span>
  )
}

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0 text-sidebar-subtle">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Chevron({ open }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
         className={cn('shrink-0 transition-transform duration-instant', open && 'rotate-90')}>
      <path d="M3.5 2L7 5L3.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
