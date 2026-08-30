import { cn } from '../../lib/cn'

/**
 * StatusBadge — 관리도구 통일성의 핵심 컴포넌트.
 *
 * 지라처럼 "상태 = 색상"이 성립하려면, 어떤 에이전트가 만든 화면이든
 * '진행중'이 항상 같은 파란색이어야 합니다. 그래서 색상 선택권을 주지 않고
 * 워크플로 상태 이름만 받습니다.
 *
 * 개발 에이전트 사용 규칙:
 *   - tone 을 직접 고르기 전에 status(워크플로 이름)로 표현할 수 있는지 먼저 보세요.
 *   - 색상만으로 의미를 전달하지 않습니다. 라벨 텍스트가 항상 함께 보입니다.
 *   - 새 상태가 필요하면 임의 색을 쓰지 말고 WORKFLOW_STATUS 에 추가하세요.
 */

/** 워크플로 상태 → 색조 + 기본 한글 라벨 */
export const WORKFLOW_STATUS = {
  todo:       { tone: 'neutral', label: '대기' },
  inProgress: { tone: 'info',    label: '진행중' },
  inReview:   { tone: 'review',  label: '검토중' },
  blocked:    { tone: 'danger',  label: '차단됨' },
  done:       { tone: 'success', label: '완료' },
  warning:    { tone: 'warning', label: '주의' },
  failed:     { tone: 'danger',  label: '실패' },
  active:     { tone: 'success', label: '활성' },
  inactive:   { tone: 'neutral', label: '비활성' },
  pending:    { tone: 'warning', label: '보류' },
}

const TONES = {
  neutral: 'bg-muted-bg text-muted-text border-muted-border',
  info:    'bg-info-bg text-info-text border-info-border',
  success: 'bg-success-bg text-success-text border-success-border',
  warning: 'bg-warning-bg text-warning-text border-warning-border',
  danger:  'bg-danger-bg text-danger-text border-danger-border',
  review:  'bg-review-bg text-review-text border-review-border',
}

const DOT_TONES = {
  neutral: 'bg-muted-solid',
  info:    'bg-info-solid',
  success: 'bg-success-solid',
  warning: 'bg-warning-solid',
  danger:  'bg-danger-solid',
  review:  'bg-review-solid',
}

/**
 * @param {object} props
 * @param {keyof typeof WORKFLOW_STATUS} [props.status] - 권장. 색과 라벨이 자동 결정됩니다.
 * @param {keyof typeof TONES} [props.tone]             - status 로 표현 불가할 때만 사용.
 * @param {React.ReactNode} [props.children]            - 라벨 덮어쓰기
 * @param {boolean} [props.dot]                         - 점 표시 (밀집 테이블에서 유용)
 * @param {'sm'|'md'} [props.size]
 */
export function StatusBadge({ status, tone, children, dot = false, size = 'md', className }) {
  const preset = status ? WORKFLOW_STATUS[status] : undefined
  const resolvedTone = tone ?? preset?.tone ?? 'neutral'
  const label = children ?? preset?.label ?? status ?? ''

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-sm border font-medium',
        size === 'sm' ? 'h-4 px-1 text-micro' : 'h-5 px-1.5 text-xs',
        TONES[resolvedTone] ?? TONES.neutral,
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT_TONES[resolvedTone])} />}
      {label}
    </span>
  )
}

/** 중립 태그(라벨·카테고리). 상태가 아닌 분류에 씁니다. */
export function Tag({ children, onRemove, className }) {
  return (
    <span className={cn(
      'inline-flex h-5 items-center gap-1 rounded-sm border border-line-subtle bg-bg-sunken px-1.5 text-xs text-fg-secondary',
      className,
    )}>
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="태그 제거"
          className="text-fg-tertiary hover:text-fg-primary"
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
            <path d="M2 2l5 5M7 2L2 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </span>
  )
}

/** 인라인 알림 배너. 페이지 상단 경고·안내용. */
export function Banner({ tone = 'info', title, children, onDismiss, action, className }) {
  const ICONS = { info: 'ℹ', success: '✓', warning: '!', danger: '!', neutral: 'ℹ', review: 'ℹ' }
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex gap-2.5 rounded-md border px-3 py-2.5', TONES[tone] ?? TONES.info, className)}
    >
      <span className="mt-px shrink-0 text-sm font-bold" aria-hidden="true">{ICONS[tone]}</span>
      <div className="min-w-0 flex-1">
        {title && <div className="text-base font-semibold">{title}</div>}
        {children && <div className={cn('text-sm', title && 'mt-0.5')}>{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="닫기" className="shrink-0 opacity-70 hover:opacity-100">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  )
}
