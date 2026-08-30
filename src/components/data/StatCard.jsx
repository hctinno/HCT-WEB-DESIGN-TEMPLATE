import { cn } from '../../lib/cn'

/**
 * StatCard — 대시보드 상단의 KPI 타일.
 *
 * 개발 에이전트 사용 규칙:
 *   - 한 줄에 3~4개가 적정입니다. 6개를 넘기면 아무것도 눈에 안 들어옵니다.
 *   - 증감 표시는 반드시 delta 로 넘기세요. 직접 화살표를 그리지 마세요.
 *   - 증감의 좋고 나쁨은 지표마다 다릅니다(오류율은 감소가 좋음).
 *     invertDelta 로 색상 의미를 뒤집으세요.
 *   - 수치는 tabular 정렬이 적용되어 자릿수가 흔들리지 않습니다.
 */
export function StatCard({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  invertDelta = false,
  icon,
  footer,
  size = 'md',
  onClick,
  className,
}) {
  const isPositive = typeof delta === 'number' && delta > 0
  const isNegative = typeof delta === 'number' && delta < 0
  const isGood = invertDelta ? isNegative : isPositive
  const isBad = invertDelta ? isPositive : isNegative

  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'rounded-lg border border-line-subtle bg-bg-surface p-4 text-left',
        onClick && 'transition-colors duration-instant hover:border-line-default hover:bg-bg-hover',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-fg-tertiary">{label}</span>
        {icon && <span className="shrink-0 text-fg-tertiary">{icon}</span>}
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={cn(
            'font-semibold tabular text-fg-primary',
            size === 'lg' ? 'text-metric-lg' : 'text-metric',
          )}
        >
          {value}
        </span>
        {unit && <span className="text-sm text-fg-tertiary">{unit}</span>}
      </div>

      {(delta != null || deltaLabel) && (
        <div className="mt-1.5 flex items-center gap-1 text-xs">
          {delta != null && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-medium tabular',
                isGood && 'text-success-text',
                isBad && 'text-danger-text',
                !isGood && !isBad && 'text-fg-tertiary',
              )}
            >
              <DeltaArrow direction={isPositive ? 'up' : isNegative ? 'down' : 'flat'} />
              {Math.abs(delta)}%
            </span>
          )}
          {deltaLabel && <span className="text-fg-tertiary">{deltaLabel}</span>}
        </div>
      )}

      {footer && <div className="mt-3 border-t border-line-subtle pt-2">{footer}</div>}
    </Wrapper>
  )
}

/** KPI 카드 격자. 반응형 열 수를 통일합니다. */
export function StatGrid({ children, columns = 4, className }) {
  const cols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns] ?? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'

  return <div className={cn('grid gap-3', cols, className)}>{children}</div>
}

/**
 * ChartFrame — 차트 컨테이너.
 *
 * 차트 라이브러리는 프로젝트마다 다르므로 렌더링은 하지 않고, 제목·설명·
 * 범례·높이·로딩/빈 상태만 통일합니다. 실제 차트는 children 으로 넣으세요.
 *
 * 차트 색상은 반드시 CSS 변수를 읽어서 쓰세요:
 *   getComputedStyle(document.documentElement).getPropertyValue('--color-accent-solid')
 * 하드코딩하면 다크 모드에서 깨집니다.
 */
export function ChartFrame({
  title,
  description,
  actions,
  height = 260,
  loading = false,
  isEmpty = false,
  emptyMessage = '표시할 데이터가 없습니다',
  legend,
  children,
  className,
}) {
  return (
    <section className={cn('rounded-lg border border-line-subtle bg-bg-surface', className)}>
      <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-fg-primary">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-fg-tertiary">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>

      <div className="px-4 pb-4" style={{ minHeight: height }}>
        {loading ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="h-full w-full animate-pulse rounded-md bg-bg-sunken" />
          </div>
        ) : isEmpty ? (
          <div
            className="flex items-center justify-center rounded-md border border-dashed border-line-default text-sm text-fg-tertiary"
            style={{ height }}
          >
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </div>

      {legend && !loading && !isEmpty && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line-subtle px-4 py-2.5">
          {legend}
        </div>
      )}
    </section>
  )
}

/** 차트 범례 항목. 색 점 + 라벨 + (선택) 값. */
export function LegendItem({ color, label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-fg-secondary">
      <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
      {label}
      {value != null && <span className="font-medium tabular text-fg-primary">{value}</span>}
    </span>
  )
}

function DeltaArrow({ direction }) {
  if (direction === 'flat') {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path d="M2 5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
         className={direction === 'down' ? 'rotate-180' : undefined}>
      <path d="M5 2.5L8 6H2L5 2.5z" fill="currentColor" />
    </svg>
  )
}
