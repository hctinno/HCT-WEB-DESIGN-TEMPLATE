import { useState } from 'react'
import { cn } from '../../lib/cn'
import { isQueryActive } from '../../lib/query'

/**
 * 뷰 시스템 UI — 저장된 뷰가 곧 내비게이션이 되는 구조.
 *
 * 지라에서 필터가 강력한 이유, 노션에서 데이터베이스가 강력한 이유는
 * **사용자가 만든 뷰가 일급 객체**이기 때문입니다. 개발자가 화면을 추가하는 게
 * 아니라, 사용자가 자기 뷰를 만듭니다.
 *
 * 개발 에이전트 사용 규칙:
 *   - 화면을 새로 만들기 전에 "이건 기존 목록의 저장된 뷰로 되는 것 아닌가?"를
 *     먼저 물으세요. 대부분 그렇습니다. 화면 수가 늘면 유지보수가 무너집니다.
 *   - 저장된 뷰는 질의 객체(query)를 통째로 담습니다. 필터·정렬·그룹·뷰 타입 전부.
 */

/**
 * ViewTabs — 저장된 뷰 탭. 노션 데이터베이스 상단의 뷰 탭에 해당합니다.
 *
 * @param {object} props
 * @param {{id: string, name: string, query: object, viewType: string, count?: number}[]} props.views
 * @param {string} props.activeViewId
 * @param {boolean} props.dirty - 현재 질의가 저장된 뷰와 달라졌는가
 */
export function ViewTabs({
  views = [],
  activeViewId,
  onSelectView,
  onCreateView,
  onSaveView,
  onResetView,
  dirty = false,
  className,
}) {
  return (
    <div className={cn('flex items-center gap-1 border-b border-line-subtle px-3', className)}>
      <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto scroll-thin">
        {views.map((view) => {
          const active = view.id === activeViewId
          return (
            <button
              key={view.id}
              type="button"
              onClick={() => onSelectView?.(view)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap px-2 text-base',
                'transition-colors duration-instant',
                active
                  ? 'font-semibold text-fg-primary after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:bg-accent-solid'
                  : 'font-normal text-fg-tertiary hover:text-fg-primary',
              )}
            >
              {view.name}
              {view.count != null && (
                <span className="tabular text-xs text-fg-tertiary">{view.count}</span>
              )}
              {active && dirty && (
                <span title="저장되지 않은 변경" className="h-1.5 w-1.5 rounded-full bg-warning-solid" />
              )}
            </button>
          )
        })}

        {onCreateView && (
          <button
            type="button"
            onClick={onCreateView}
            aria-label="새 뷰 만들기"
            title="새 뷰 만들기"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-fg-tertiary hover:bg-bg-hover hover:text-fg-primary"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M6 2.5v7M2.5 6h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* 저장되지 않은 변경이 있을 때만 저장/되돌리기가 나타납니다 */}
      {dirty && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onResetView}
            className="h-control-sm rounded-md px-2 text-xs font-medium text-fg-tertiary hover:bg-bg-hover hover:text-fg-primary"
          >
            되돌리기
          </button>
          <button
            type="button"
            onClick={onSaveView}
            className="h-control-sm rounded-md bg-accent-solid px-2 text-xs font-medium text-fg-inverse hover:bg-accent-solid-hover"
          >
            뷰 저장
          </button>
        </div>
      )}
    </div>
  )
}

/** 뷰 타입 전환 — 같은 데이터를 표로 볼지 보드로 볼지 */
export const VIEW_TYPES = {
  table: { label: '표', icon: TableIcon },
  board: { label: '보드', icon: BoardIcon },
}

export function ViewSwitcher({ value = 'table', onChange, available = ['table', 'board'], className }) {
  return (
    <div role="tablist" className={cn('inline-flex items-center gap-0.5 rounded-md bg-bg-sunken p-0.5', className)}>
      {available.map((type) => {
        const { label, icon: Icon } = VIEW_TYPES[type] ?? {}
        if (!label) return null
        const selected = value === type
        return (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange?.(type)}
            title={`${label} 보기`}
            className={cn(
              'flex h-control-sm items-center gap-1 rounded-sm px-2 text-xs font-medium',
              'transition-colors duration-instant',
              selected ? 'bg-bg-surface text-fg-primary shadow-sm' : 'text-fg-tertiary hover:text-fg-primary',
            )}
          >
            <Icon />
            {label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * GroupByPicker — 그룹핑 기준 선택.
 * 표에서는 그룹 헤더, 보드에서는 컬럼이 됩니다. 같은 설정이 두 뷰에 다르게 나타납니다.
 */
export function GroupByPicker({ fields = [], value, onChange, required = false, className }) {
  const groupable = fields.filter((f) => f.groupable)
  if (groupable.length === 0) return null

  return (
    <label className={cn('inline-flex items-center gap-1.5 text-xs text-fg-tertiary', className)}>
      그룹
      <select
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value || null)}
        className={cn(
          'h-control-sm rounded-md border border-line-default bg-bg-surface px-1.5 text-xs text-fg-primary',
          'focus:border-line-focus focus:outline-none focus:ring-1 focus:ring-line-focus',
        )}
      >
        {!required && <option value="">없음</option>}
        {groupable.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
      </select>
    </label>
  )
}

/**
 * 사이드바에 저장된 뷰를 노출합니다. 지라 사이드바의 "내 필터"에 해당합니다.
 * 정적 메뉴가 아니라 사용자가 만든 것이 내비게이션이 되는 지점입니다.
 */
/**
 * 저장된 뷰 목록.
 *
 * `<li>` 들만 내보냅니다 — `<ul>` 은 감싸는 SidebarGroup 이 이미 만듭니다.
 * 여기서 또 `<ul>` 을 만들면 ul 안에 ul 이 직접 들어가 목록 구조가 깨집니다
 * (axe: list, serious). 사이드바 밖에서 쓸 일이 생기면 그때 `<ul>` 로 감싸세요.
 */
export function SavedViewList({ views = [], activeViewId, onSelectView, collapsed = false }) {
  return (
    <>
      {views.map((view) => {
        const active = view.id === activeViewId
        return (
          <li key={view.id}>
            <button
              type="button"
              onClick={() => onSelectView?.(view)}
              title={collapsed ? view.name : undefined}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-control-lg w-full items-center gap-2 rounded-md px-2 text-sm',
                'transition-colors duration-instant',
                collapsed && 'justify-center px-0',
                active
                  ? 'bg-sidebar-active-bg font-semibold text-sidebar-active-fg'
                  : 'font-normal text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-fg',
              )}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center opacity-70">
                {isQueryActive(view.query) ? <FilterIcon /> : <TableIcon />}
              </span>
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1 truncate text-left">{view.name}</span>
                  {view.count != null && (
                    /* SidebarItem 의 배지와 같은 문제 — 활성 항목은 배경이
                       강조색이라 sidebar-subtle 로는 2.66:1 입니다. */
                    <span className={cn(
                      'shrink-0 tabular text-micro',
                      active ? 'text-sidebar-active-fg' : 'text-sidebar-subtle',
                    )}>
                      {view.count}
                    </span>
                  )}
                </>
              )}
            </button>
          </li>
        )
      })}
    </>
  )
}

function TableIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="1.25" y="1.75" width="9.5" height="8.5" rx="1.25" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.25 4.5h9.5M4.5 4.5v5.75" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function BoardIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="1.25" y="1.75" width="3.2" height="8.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="6.5" y="1.75" width="3.2" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M1.5 2.5h9L7.25 6.5v3.25l-2.5 1.25V6.5L1.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}
