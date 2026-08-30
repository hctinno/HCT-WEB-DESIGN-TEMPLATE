import { cn } from '../../lib/cn'

/**
 * 그리드를 감싸는 껍데기 — 툴바·페이지네이션·카드.
 * 이것들이 분리되어 있어야 그리드를 보드 뷰로 갈아끼워도 주변이 그대로입니다.
 */

/** 그리드 + 툴바 + 페이지네이션을 하나의 덩어리로 묶는 카드 */
export function GridCard({ children, className }) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-line-subtle bg-bg-surface', className)}>
      {children}
    </div>
  )
}

/** 그리드 상단 줄. 좌측은 맥락(건수·뷰 전환), 우측은 액션. */
export function GridToolbar({ left, right, className }) {
  return (
    <div className={cn(
      'flex flex-wrap items-center justify-between gap-2 border-b border-line-subtle bg-bg-surface px-3 py-2',
      className,
    )}>
      <div className="flex flex-wrap items-center gap-2">{left}</div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  )
}

/**
 * 페이지네이션. 총 건수를 항상 함께 보여줍니다 —
 * 관리도구에서 "몇 건인지"는 거의 언제나 중요한 정보입니다.
 */
export function GridPagination({ page, pageSize, total, onPageChange, className }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className={cn(
      'flex items-center justify-between gap-3 border-t border-line-subtle bg-bg-surface px-3 py-2',
      className,
    )}>
      <span className="text-xs text-fg-tertiary tabular">
        전체 {total.toLocaleString('ko-KR')}건 중 {from.toLocaleString('ko-KR')}–{to.toLocaleString('ko-KR')}
      </span>
      <div className="flex items-center gap-1">
        <PagerButton onClick={() => onPageChange(page - 1)} disabled={page <= 1} label="이전 페이지">이전</PagerButton>
        <span className="px-2 text-xs text-fg-secondary tabular">{page} / {totalPages}</span>
        <PagerButton onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} label="다음 페이지">다음</PagerButton>
      </div>
    </div>
  )
}

function PagerButton({ children, onClick, disabled, label }) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled} aria-label={label}
      className={cn(
        'h-control-sm rounded-md border border-line-default bg-bg-surface px-2 text-xs font-medium text-fg-primary',
        'hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-40',
      )}
    >
      {children}
    </button>
  )
}
