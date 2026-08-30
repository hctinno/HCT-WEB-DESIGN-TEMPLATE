import { cn } from '../../lib/cn'

/**
 * EmptyState / ErrorState — 관리도구에서 가장 자주 빠뜨리는 화면입니다.
 *
 * 개발 에이전트 사용 규칙:
 *   - 목록·테이블·차트를 만들 때 데이터가 0건인 경우를 반드시 처리하세요.
 *     빈 테이블 헤더만 덩그러니 남기는 것은 이 디자인 시스템에서 결함입니다.
 *   - 세 가지를 구분해서 쓰세요:
 *       EmptyState  → 아직 데이터가 없음 (생성 유도)
 *       NoResults   → 필터·검색 결과가 없음 (필터 해제 유도)
 *       ErrorState  → 불러오기 실패 (재시도 유도)
 */
export function EmptyState({ icon, title, description, action, size = 'md', className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        size === 'sm' ? 'px-4 py-8' : 'px-6 py-16',
        className,
      )}
    >
      {icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-bg-sunken text-fg-tertiary">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-fg-primary">{title}</h3>
      {description && (
        <p className="mt-1 max-w-[380px] text-sm text-fg-tertiary">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** 검색·필터 결과 없음. 필터를 지울 수단을 반드시 제공합니다. */
export function NoResults({ query, onClearFilters, className }) {
  return (
    <EmptyState
      className={className}
      icon={
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      }
      title="결과가 없습니다"
      description={
        query
          ? `'${query}'에 해당하는 항목을 찾지 못했습니다. 검색어나 필터를 조정해 보세요.`
          : '조건에 맞는 항목이 없습니다. 필터를 조정해 보세요.'
      }
      action={
        onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="h-control-md rounded-md border border-line-default bg-bg-surface px-3 text-base font-medium text-fg-primary hover:bg-bg-hover"
          >
            필터 초기화
          </button>
        )
      }
    />
  )
}

/** 데이터 로드 실패. 무엇이 실패했는지와 재시도 수단을 함께 제공합니다. */
export function ErrorState({ title = '불러오지 못했습니다', description, onRetry, detail, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-danger-bg text-danger-text">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 6v4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="13.5" r="0.9" fill="currentColor" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-fg-primary">{title}</h3>
      {description && <p className="mt-1 max-w-[380px] text-sm text-fg-tertiary">{description}</p>}
      {detail && (
        <pre className="mt-3 max-w-full overflow-x-auto rounded-md bg-bg-sunken px-3 py-2 text-left text-xs text-fg-tertiary">
          {detail}
        </pre>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 h-control-md rounded-md border border-line-default bg-bg-surface px-3 text-base font-medium text-fg-primary hover:bg-bg-hover"
        >
          다시 시도
        </button>
      )}
    </div>
  )
}
