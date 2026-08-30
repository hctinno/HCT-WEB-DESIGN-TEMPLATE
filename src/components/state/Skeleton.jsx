import { cn } from '../../lib/cn'

/**
 * Skeleton — 로딩 상태.
 *
 * 개발 에이전트 사용 규칙:
 *   - 스피너 하나를 화면 가운데 띄우지 마세요. 레이아웃이 흔들립니다.
 *     실제 콘텐츠와 같은 모양의 스켈레톤을 보여주면 체감 속도가 빨라집니다.
 *   - 200ms 이내에 끝나는 로딩에는 아무것도 표시하지 않는 편이 낫습니다.
 */
export function Skeleton({ className, ...rest }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative overflow-hidden rounded-sm bg-bg-sunken',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer',
        'after:bg-gradient-to-r after:from-transparent after:via-bg-hover after:to-transparent',
        className,
      )}
      {...rest}
    />
  )
}

/** 텍스트 여러 줄 */
export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}

/** 테이블 로딩 — 실제 행 높이와 열 수를 맞춥니다. */
export function SkeletonTable({ rows = 6, columns = 4, density = 'default' }) {
  const rowHeight = {
    compact: 'h-row-compact',
    default: 'h-row-default',
    relaxed: 'h-row-relaxed',
  }[density]

  return (
    <div role="status" aria-label="불러오는 중" className="w-full">
      <div className="flex h-8 items-center gap-4 border-b border-line-subtle bg-bg-sunken px-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-2.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={cn('flex items-center gap-4 border-b border-line-subtle px-3', rowHeight)}>
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className={cn('h-3', c === 0 ? 'flex-[1.6]' : 'flex-1')} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** KPI 카드 로딩 */
export function SkeletonStatCard() {
  return (
    <div className="rounded-lg border border-line-subtle bg-bg-surface p-4">
      <Skeleton className="h-2.5 w-20" />
      <Skeleton className="mt-3 h-6 w-24" />
      <Skeleton className="mt-2 h-2.5 w-16" />
    </div>
  )
}
