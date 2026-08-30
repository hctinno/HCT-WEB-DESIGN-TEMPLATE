import { cn } from '../../lib/cn'

/**
 * Button — 모든 버튼의 단일 진입점.
 *
 * 개발 에이전트 사용 규칙:
 *   - <button> 을 직접 스타일링하지 마세요. 반드시 이 컴포넌트를 씁니다.
 *   - 한 화면에 primary 는 하나뿐입니다. 나머지는 secondary/ghost 입니다.
 *   - 파괴적 동작(삭제 등)에만 danger 를 씁니다.
 *   - 아이콘만 있는 버튼은 aria-label 이 필수입니다.
 */

const VARIANTS = {
  /** 화면의 주 행동. 페이지당 1개. */
  primary:
    'bg-accent-solid text-fg-inverse hover:bg-accent-solid-hover border border-transparent',
  /** 기본 보조 행동. 대부분의 버튼이 여기 해당합니다. */
  secondary:
    'bg-bg-surface text-fg-primary border border-line-default hover:bg-bg-hover',
  /** 툴바·아이콘 등 배경이 필요 없는 경우. */
  ghost:
    'bg-transparent text-fg-secondary border border-transparent hover:bg-bg-hover hover:text-fg-primary',
  /** 삭제·해지 등 되돌리기 어려운 행동. */
  danger:
    'bg-danger-solid text-fg-inverse hover:opacity-90 border border-transparent',
  /** 파괴적이지만 부차적인 행동. */
  'danger-subtle':
    'bg-transparent text-danger-text border border-danger-border hover:bg-danger-bg',
}

const SIZES = {
  xs: 'h-control-xs px-1.5 text-xs gap-1 rounded-sm',
  sm: 'h-control-sm px-2 text-xs gap-1 rounded-md',
  md: 'h-control-md px-3 text-base gap-1.5 rounded-md',
  lg: 'h-control-lg px-4 text-base gap-2 rounded-md',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  iconLeft,
  iconRight,
  loading = false,
  disabled = false,
  className,
  children,
  ...rest
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium',
        'transition-colors duration-instant ease-standard',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant] ?? VARIANTS.secondary,
        SIZES[size] ?? SIZES.md,
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  )
}

/** 아이콘 전용 버튼. label 은 필수입니다(스크린리더). */
export function IconButton({ icon, label, variant = 'ghost', size = 'md', className, ...rest }) {
  const box = { xs: 'w-control-xs', sm: 'w-control-sm', md: 'w-control-md', lg: 'w-control-lg' }
  return (
    <Button
      variant={variant}
      size={size}
      aria-label={label}
      title={label}
      className={cn('px-0', box[size], className)}
      {...rest}
    >
      {icon}
    </Button>
  )
}

/** 버튼 묶음. 간격을 통일합니다. */
export function ButtonGroup({ children, className }) {
  return <div className={cn('flex items-center gap-2', className)}>{children}</div>
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="animate-spin">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.75" opacity="0.25" />
      <path d="M12.5 7A5.5 5.5 0 007 1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}
