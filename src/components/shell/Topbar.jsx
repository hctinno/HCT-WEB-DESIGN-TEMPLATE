import { cn } from '../../lib/cn'

/**
 * Topbar — 상단 컨텍스트 바.
 *
 * 좌측은 "지금 어디에 있는가"(브레드크럼), 우측은 전역 액션입니다.
 * 페이지 제목은 여기가 아니라 PageHeader 에 넣습니다. 중복 금지.
 */
export function Topbar({ breadcrumb, search, actions }) {
  return (
    <div className="flex h-full items-center gap-3 pr-3">
      <div className="min-w-0 flex-1">{breadcrumb}</div>
      {search && <div className="hidden w-[280px] shrink-0 md:block">{search}</div>}
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  )
}

/**
 * 브레드크럼. 현재 위치를 알려줍니다.
 *
 * @param {object} props
 * @param {{label: string, href?: string}[]} props.items - 마지막 항목이 현재 페이지
 */
export function Breadcrumb({ items = [] }) {
  return (
    <nav aria-label="위치" className="flex min-w-0 items-center gap-1 text-sm">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-1">
            {i > 0 && <span className="shrink-0 text-fg-disabled">/</span>}
            {isLast ? (
              <span className="truncate font-medium text-fg-primary" aria-current="page">
                {item.label}
              </span>
            ) : (
              <a
                href={item.href ?? '#'}
                className="truncate text-fg-tertiary hover:text-fg-primary hover:underline"
              >
                {item.label}
              </a>
            )}
          </span>
        )
      })}
    </nav>
  )
}

/**
 * 상단바 아이콘 버튼. 반드시 aria-label 을 넘겨야 합니다.
 */
export function TopbarIconButton({ icon, label, onClick, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'relative flex h-control-md w-control-md items-center justify-center rounded-md',
        'text-fg-secondary transition-colors duration-instant',
        'hover:bg-bg-hover hover:text-fg-primary',
      )}
    >
      {icon}
      {badge != null && (
        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-danger-solid" />
      )}
    </button>
  )
}
