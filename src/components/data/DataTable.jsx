import { cn } from '../../lib/cn'
import { SkeletonTable } from '../state/Skeleton'
import { NoResults, ErrorState } from '../state/EmptyState'

/**
 * DataTable — 관리도구에서 가장 많이 쓰이는 컴포넌트.
 *
 * 지라형 고밀도를 기본으로 합니다: 32~40px 행, 13px 셀, 명확한 구분선.
 *
 * 개발 에이전트 사용 규칙:
 *   - <table> 을 직접 만들지 마세요. 반드시 이 컴포넌트를 씁니다.
 *   - loading / error / 빈 결과 세 가지 상태를 모두 넘기세요. 이 컴포넌트가
 *     알아서 스켈레톤·에러·빈 화면을 렌더링합니다.
 *   - 숫자 열은 align:'right' 로 지정하세요. 자릿수가 자동 정렬됩니다.
 *   - 열이 6개를 넘으면 우선순위가 낮은 열은 숨기고 상세 패널로 보내세요.
 *
 * @param {object} props
 * @param {Array<{
 *   key: string,
 *   header: string,
 *   width?: string,
 *   align?: 'left'|'right'|'center',
 *   sortable?: boolean,
 *   render?: (row: any, index: number) => React.ReactNode
 * }>} props.columns
 * @param {any[]} props.rows
 * @param {(row: any) => string|number} [props.rowKey]
 * @param {'compact'|'default'|'relaxed'} [props.density]
 * @param {boolean} [props.loading]
 * @param {string} [props.error]
 * @param {(row: any) => void} [props.onRowClick]
 * @param {string|number} [props.selectedKey] - 우측 패널과 연동된 선택 행
 * @param {{key: string, direction: 'asc'|'desc'}} [props.sort]
 * @param {(key: string) => void} [props.onSortChange]
 */
export function DataTable({
  columns = [],
  rows = [],
  rowKey = (row) => row.id,
  density = 'default',
  loading = false,
  error,
  onRetry,
  onRowClick,
  selectedKey,
  sort,
  onSortChange,
  emptyState,
  searchQuery,
  onClearFilters,
  stickyHeader = true,
  className,
}) {
  if (loading) {
    return <SkeletonTable rows={6} columns={columns.length || 4} density={density} />
  }

  if (error) {
    return <ErrorState description={error} onRetry={onRetry} />
  }

  if (rows.length === 0) {
    return (
      emptyState ?? <NoResults query={searchQuery} onClearFilters={onClearFilters} />
    )
  }

  const rowHeight = {
    compact: 'h-row-compact',
    default: 'h-row-default',
    relaxed: 'h-row-relaxed',
  }[density]

  const cellText = density === 'compact' ? 'text-sm' : 'text-base'

  return (
    <div className={cn('w-full overflow-x-auto scroll-thin', className)}>
      <table className="w-full border-collapse text-left">
        <thead
          className={cn(
            'bg-bg-sunken',
            stickyHeader && 'sticky top-0 z-sticky',
          )}
        >
          <tr>
            {columns.map((col) => {
              const isSorted = sort?.key === col.key
              return (
                <th
                  key={col.key}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  aria-sort={isSorted ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cn(
                    'h-8 whitespace-nowrap border-b border-line-default px-3',
                    'text-xs font-semibold text-fg-secondary',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                  )}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSortChange?.(col.key)}
                      className={cn(
                        'inline-flex items-center gap-1 hover:text-fg-primary',
                        col.align === 'right' && 'flex-row-reverse',
                      )}
                    >
                      {col.header}
                      <SortIcon active={isSorted} direction={sort?.direction} />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const key = rowKey(row)
            const selected = selectedKey != null && key === selectedKey
            return (
              <tr
                key={key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                aria-selected={selected || undefined}
                className={cn(
                  rowHeight,
                  'border-b border-line-subtle transition-colors duration-instant',
                  selected ? 'bg-accent-subtle' : 'bg-bg-surface hover:bg-bg-hover',
                  onRowClick && 'cursor-pointer',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-3 text-fg-primary',
                      cellText,
                      col.align === 'right' && 'text-right tabular',
                      col.align === 'center' && 'text-center',
                    )}
                  >
                    {col.render ? col.render(row, index) : row[col.key]}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/**
 * 테이블 툴바 — 검색·필터·액션이 놓이는 줄.
 * 테이블 바로 위에 붙여 하나의 카드처럼 보이게 합니다.
 */
export function TableToolbar({ left, right, className }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 border-b border-line-subtle bg-bg-surface px-3 py-2',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">{left}</div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  )
}

/**
 * 페이지네이션. 총 건수를 항상 함께 보여줍니다
 * — 관리도구에서 "몇 건인지"는 거의 언제나 중요한 정보입니다.
 */
export function TablePagination({ page, pageSize, total, onPageChange, className }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-t border-line-subtle bg-bg-surface px-3 py-2',
        className,
      )}
    >
      <span className="text-xs text-fg-tertiary tabular">
        전체 {total.toLocaleString('ko-KR')}건 중 {from.toLocaleString('ko-KR')}–{to.toLocaleString('ko-KR')}
      </span>
      <div className="flex items-center gap-1">
        <PagerButton onClick={() => onPageChange(page - 1)} disabled={page <= 1} label="이전 페이지">
          이전
        </PagerButton>
        <span className="px-2 text-xs text-fg-secondary tabular">
          {page} / {totalPages}
        </span>
        <PagerButton onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} label="다음 페이지">
          다음
        </PagerButton>
      </div>
    </div>
  )
}

function PagerButton({ children, onClick, disabled, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'h-control-sm rounded-md border border-line-default bg-bg-surface px-2 text-xs font-medium text-fg-primary',
        'hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-40',
      )}
    >
      {children}
    </button>
  )
}

/** 테이블 + 툴바 + 페이지네이션을 감싸는 카드. 시각적으로 하나의 덩어리가 됩니다. */
export function TableCard({ children, className }) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-line-subtle bg-bg-surface', className)}>
      {children}
    </div>
  )
}

function SortIcon({ active, direction }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
         className={cn('shrink-0', active ? 'text-accent-text' : 'text-fg-disabled')}>
      <path d="M5 1.5L7.5 4.5h-5L5 1.5z" fill="currentColor" opacity={active && direction === 'desc' ? 0.3 : 1} />
      <path d="M5 8.5L2.5 5.5h5L5 8.5z" fill="currentColor" opacity={active && direction === 'asc' ? 0.3 : 1} />
    </svg>
  )
}
