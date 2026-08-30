import { cn } from '../../lib/cn'
import { Tag } from '../feedback/StatusBadge'

/**
 * FilterBar — 지라식 필터 줄.
 *
 * 개발 에이전트 사용 규칙:
 *   - 적용된 필터는 반드시 눈에 보여야 합니다. 사용자가 "왜 결과가 이것뿐이지?"
 *     라고 묻게 되는 화면은 결함입니다.
 *   - 필터가 하나라도 걸려 있으면 "초기화"를 항상 제공합니다.
 */
export function FilterBar({ children, activeFilters = [], onRemoveFilter, onClearAll, className }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap items-center gap-2">{children}</div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-fg-tertiary">적용됨:</span>
          {activeFilters.map((f) => (
            <Tag key={f.key} onRemove={onRemoveFilter ? () => onRemoveFilter(f.key) : undefined}>
              <span className="text-fg-tertiary">{f.label}</span>
              <span className="font-medium text-fg-primary">{f.value}</span>
            </Tag>
          ))}
          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="ml-1 text-xs font-medium text-fg-link hover:underline"
            >
              전체 초기화
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * 필터 드롭다운 버튼. 값이 선택되면 강조 상태가 됩니다.
 */
export function FilterButton({ label, value, active = false, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-control-md items-center gap-1.5 rounded-md border px-2 text-base',
        'transition-colors duration-instant',
        active
          ? 'border-accent-border bg-accent-subtle font-medium text-accent-text'
          : 'border-line-default bg-bg-surface text-fg-secondary hover:bg-bg-hover',
        className,
      )}
    >
      <span>{label}</span>
      {value && <span className="font-medium">{value}</span>}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" className="shrink-0 opacity-60">
        <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

/**
 * 세그먼트 컨트롤 — 상호배타적 뷰 전환(전체/내것/보관 등).
 * 탭보다 가볍고, 목록 상단에 적합합니다.
 */
export function SegmentedControl({ options = [], value, onChange, size = 'md', className }) {
  const heights = { sm: 'h-control-sm text-xs', md: 'h-control-md text-base' }
  return (
    <div
      role="tablist"
      className={cn('inline-flex items-center gap-0.5 rounded-md bg-bg-sunken p-0.5', className)}
    >
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange?.(o.value)}
            className={cn(
              'rounded-sm px-2.5 font-medium transition-colors duration-instant',
              heights[size] ?? heights.md,
              selected
                ? 'bg-bg-surface text-fg-primary shadow-sm'
                : 'text-fg-tertiary hover:text-fg-primary',
            )}
          >
            {o.label}
            {o.count != null && (
              <span className="ml-1.5 tabular text-fg-tertiary">{o.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** 밀도 전환. 지라·리니어처럼 사용자가 행 높이를 고를 수 있게 합니다. */
export function DensityToggle({ value = 'default', onChange, className }) {
  return (
    <SegmentedControl
      size="sm"
      className={className}
      value={value}
      onChange={onChange}
      options={[
        { value: 'compact', label: '조밀' },
        { value: 'default', label: '기본' },
        { value: 'relaxed', label: '여유' },
      ]}
    />
  )
}
