import { cn } from '../../lib/cn'
import { SkeletonText } from '../state/Skeleton'
import { StatusBadge } from '../feedback/StatusBadge'

/**
 * MetricTile — 지표 타일. 이전 StatCard 를 대체합니다.
 *
 * StatCard 와의 차이:
 *   - 클릭하면 그 숫자를 만든 레코드 목록으로 **드릴다운**합니다
 *   - 임계값 상태(정상/주의/위험)를 색으로 표현합니다
 *   - 증감의 **비교 대상 값**을 함께 밝힙니다 ("12% 증가"만으로는 부족)
 *   - 스파크라인으로 추세를 보여줍니다
 *
 * 개발 에이전트 사용 규칙:
 *   - 지표를 서버가 준 숫자 하나로 다루지 마세요. lib/metrics.js 의 Metric
 *     (질의 + 집계)으로 정의해야 드릴다운이 성립합니다.
 *   - onDrillDown 을 반드시 연결하세요. 클릭해도 아무 일 없는 지표는
 *     사용자를 막다른 길에 세웁니다.
 *   - 낮을수록 좋은 지표에는 lowerIsBetter 를 지정하세요.
 */
export function MetricTile({
  label,
  value,
  unit,
  count,
  delta,
  previous,
  compareLabel = '이전 기간',
  lowerIsBetter = false,
  state = 'ok',
  series,
  threshold,
  onDrillDown,
  className,
}) {
  const rising = typeof delta === 'number' && delta > 0
  const falling = typeof delta === 'number' && delta < 0
  const good = lowerIsBetter ? falling : rising
  const bad = lowerIsBetter ? rising : falling

  const Wrapper = onDrillDown ? 'button' : 'div'

  return (
    <Wrapper
      type={onDrillDown ? 'button' : undefined}
      onClick={onDrillDown}
      className={cn(
        'group relative w-full overflow-hidden rounded-lg border bg-bg-surface p-3 text-left',
        'transition-colors duration-instant',
        STATE_BORDER[state],
        onDrillDown && 'hover:border-line-strong hover:bg-bg-hover',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-fg-tertiary">{label}</span>
        {state !== 'ok' && (
          <StatusBadge tone={state === 'danger' ? 'danger' : 'warning'} size="sm">
            {state === 'danger' ? '임계 초과' : '주의'}
          </StatusBadge>
        )}
      </div>

      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className={cn('text-metric font-semibold tabular', STATE_TEXT[state])}>
          {typeof value === 'number' ? value.toLocaleString('ko-KR') : value}
        </span>
        {unit && <span className="text-sm text-fg-tertiary">{unit}</span>}
      </div>

      {/* 증감 — 비교 대상 값을 반드시 함께 밝힙니다 */}
      {delta != null && (
        <div className="mt-1 flex flex-wrap items-baseline gap-1 text-xs">
          <span className={cn(
            'inline-flex items-center gap-0.5 font-medium tabular',
            good && 'text-success-text', bad && 'text-danger-text',
            !good && !bad && 'text-fg-tertiary',
          )}>
            <Arrow direction={rising ? 'up' : falling ? 'down' : 'flat'} />
            {/* 0% 를 '-0%' 로 쓰면 방향이 있는 것처럼 읽힙니다 */}
            {delta === 0 ? '변동 없음' : `${Math.abs(delta)}%`}
          </span>
          <span className="text-fg-tertiary">
            {compareLabel} {typeof previous === 'number' ? previous.toLocaleString('ko-KR') : previous}
            {unit ? ` ${unit}` : ''}
          </span>
        </div>
      )}

      {series && series.length > 0 && (
        <Sparkline data={series} state={state} className="mt-2" />
      )}

      {threshold?.danger != null && (
        <p className="mt-1.5 text-micro text-fg-tertiary tabular">
          임계 {lowerIsBetter ? '≤' : '≥'} {threshold.danger.toLocaleString('ko-KR')}{unit ? ` ${unit}` : ''}
        </p>
      )}

      {onDrillDown && (
        <span className={cn(
          'absolute bottom-2.5 right-3 flex items-center gap-0.5 text-micro font-medium text-fg-link',
          'opacity-0 transition-opacity duration-instant group-hover:opacity-100',
        )}>
          {count != null ? `${count.toLocaleString('ko-KR')}건 보기` : '목록 보기'}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </Wrapper>
  )
}

/** 증감 화살표. 변화 없음은 가로줄로 — 0%를 화살표로 그리면 방향이 있는 것처럼 보입니다. */
function Arrow({ direction }) {
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

const STATE_BORDER = {
  ok: 'border-line-subtle',
  warn: 'border-warning-border',
  danger: 'border-danger-border',
}
const STATE_TEXT = {
  ok: 'text-fg-primary',
  warn: 'text-fg-primary',
  danger: 'text-danger-text',
}

/** 스파크라인 — 값 하나보다 추세가 훨씬 많은 것을 말해줍니다 */
export function Sparkline({ data = [], state = 'ok', height = 24, className }) {
  const values = data.map((d) => (typeof d === 'number' ? d : d.count))
  const max = Math.max(...values, 1)
  const stroke = state === 'danger'
    ? 'var(--color-danger-solid)'
    : state === 'warn' ? 'var(--color-warning-solid)' : 'var(--color-accent-solid)'

  const step = 100 / Math.max(1, values.length - 1)
  const points = values.map((v, i) => `${i * step},${100 - (v / max) * 100}`).join(' ')

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ height }}
      className={cn('w-full', className)}
      aria-hidden="true"
    >
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="3" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/**
 * BreakdownList — 지표를 차원별로 분해합니다.
 *
 * "오류 412건"보다 "인증 380 / 결제 28 / 수집 4"가 훨씬 유용합니다.
 * 각 행이 자기 질의를 들고 있어 클릭하면 그 조건으로 목록에 들어갑니다.
 */
export function BreakdownList({ items = [], onDrillDown, max, emptyMessage = '데이터 없음', className }) {
  if (items.length === 0) {
    return <p className={cn('py-4 text-center text-xs text-fg-tertiary', className)}>{emptyMessage}</p>
  }
  const peak = max ?? Math.max(...items.map((i) => i.count), 1)

  return (
    <ul className={cn('space-y-1.5', className)}>
      {items.map((item) => (
        <li key={item.key}>
          <button
            type="button"
            onClick={onDrillDown ? () => onDrillDown(item) : undefined}
            disabled={!onDrillDown}
            className={cn(
              'group w-full rounded-md px-1.5 py-1 text-left',
              onDrillDown && 'hover:bg-bg-hover',
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate text-base text-fg-primary">
                {item.option?.status
                  ? <StatusBadge status={item.option.status} dot size="sm">{item.label}</StatusBadge>
                  : item.label}
              </span>
              <span className="shrink-0 tabular text-xs text-fg-secondary">
                {item.count.toLocaleString('ko-KR')}
                <span className="ml-1 text-fg-tertiary">{item.share}%</span>
              </span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-bg-sunken">
              <div
                className={cn('h-full rounded-full',
                  item.option?.status ? BAR_BY_STATUS[item.option.status] ?? 'bg-accent-solid' : 'bg-accent-solid')}
                style={{ width: `${Math.max(2, (item.count / peak) * 100)}%` }}
              />
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}

/** 막대 색을 뱃지 색과 맞춥니다. 같은 행에서 색이 어긋나면 다른 정보로 읽힙니다. */
const BAR_BY_STATUS = {
  todo: 'bg-muted-solid',
  inProgress: 'bg-info-solid',
  inReview: 'bg-review-solid',
  blocked: 'bg-danger-solid',
  done: 'bg-success-solid',
  failed: 'bg-danger-solid',
}

/**
 * 위젯 껍데기 — 제목·액션·본문의 간격을 통일합니다.
 *
 * loading 을 켜면 제목은 그대로 두고 본문만 스켈레톤이 됩니다. 위젯 전체를
 * 감추면 격자가 다시 짜여서 옆 위젯까지 자리를 옮깁니다 — 다 불러온 뒤에
 * 사용자가 보던 곳이 딴 데 가 있습니다.
 */
export function Widget({ title, description, actions, children, footer, loading = false, className }) {
  return (
    <section className={cn('flex flex-col rounded-lg border border-line-subtle bg-bg-surface', className)}>
      <div className="flex items-start justify-between gap-2 px-3 pb-2 pt-2.5">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-fg-primary">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-fg-tertiary">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
      <div className="min-h-0 flex-1 px-3 pb-3">
        {loading
          ? <div role="status" aria-label="불러오는 중"><SkeletonText lines={5} /></div>
          : children}
      </div>
      {footer && <div className="border-t border-line-subtle px-3 py-2">{footer}</div>}
    </section>
  )
}

/**
 * WidgetGrid — 위젯·차트가 늘어서는 격자.
 *
 * StatGrid 와 나뉘어 있는 이유는 **접히는 지점이 다르기 때문**입니다.
 * 지표 타일은 640px(sm)부터 두 열로 놔도 읽히지만, 축과 범례가 있는 차트를
 * 640px 에서 반으로 자르면 눈금이 겹쳐서 못 읽습니다. 위젯은 1024px(lg)
 * 전까지 한 열입니다.
 *
 * 넓은 위젯 하나와 좁은 위젯 하나를 나란히 두려면 columns={3} 에
 * `className="lg:col-span-2"` 를 넓은 쪽에 주세요.
 *
 * @param {2|3} [props.columns] - lg 이상에서의 열 수
 */
export function WidgetGrid({ children, columns = 2, className }) {
  const cols = columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
  return <div className={cn('grid gap-3', cols, className)}>{children}</div>
}
