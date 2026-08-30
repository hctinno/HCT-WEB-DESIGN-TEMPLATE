import { cn } from '../../lib/cn'
import { StatusBadge } from './StatusBadge'

/**
 * 진행 표시 — 관리도구는 오래 걸리는 작업이 많습니다.
 *
 * 규칙:
 *   - 남은 시간을 모르면 **몇 건 중 몇 건인지**라도 보여주세요.
 *     "처리 중…"만 있으면 사용자는 멈춘 건지 도는 건지 모릅니다.
 *   - 부분 실패를 숨기지 마세요. 100건 중 3건이 실패했다면 그 3건이
 *     무엇인지 볼 수 있어야 합니다. "완료"라고만 하면 거짓말입니다.
 */

/** 값이 있는 진행 막대 */
/**
 * @param {string} [props.label] - 눈에 보이는 라벨. 있으면 접근 가능한 이름도 됩니다.
 * @param {string} [props.name]  - 라벨을 화면에 안 쓸 때의 접근 가능한 이름.
 *
 * 둘 다 없으면 스크린리더에는 "진행률 23" 이라고만 읽혀 무엇의 진행인지
 * 알 수 없습니다(axe: aria-progressbar-name, serious). 하나는 반드시 주세요.
 */
export function Progress({ value, max = 100, label, name, tone = 'accent', size = 'md', className }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const TONE = {
    accent: 'bg-accent-solid',
    success: 'bg-success-solid',
    warning: 'bg-warning-solid',
    danger: 'bg-danger-solid',
  }
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className="text-xs text-fg-secondary">{label}</span>
          <span className="tabular text-xs text-fg-tertiary">
            {value.toLocaleString('ko-KR')} / {max.toLocaleString('ko-KR')}
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? name}
        className={cn('overflow-hidden rounded-full bg-bg-sunken', size === 'sm' ? 'h-1' : 'h-1.5')}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-normal ease-standard', TONE[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/**
 * JobStatus — 비동기 작업의 진행과 결과.
 *
 * 벌크 작업, 내보내기, 배치 재처리처럼 시간이 걸리는 일에 씁니다.
 * 부분 실패를 1급으로 다루는 것이 핵심입니다.
 *
 * @param {object} props
 * @param {'running'|'done'|'failed'|'partial'} props.state
 * @param {number} props.total
 * @param {number} props.completed
 * @param {{key: string, reason: string}[]} [props.failures]
 */
export function JobStatus({
  title,
  state,
  total,
  completed,
  failures = [],
  onRetryFailed,
  onCancel,
  onDismiss,
  className,
}) {
  const TONE = { running: 'accent', done: 'success', partial: 'warning', failed: 'danger' }[state]
  const STATUS = { running: 'inProgress', done: 'done', partial: 'warning', failed: 'failed' }[state]

  return (
    <div className={cn('rounded-lg border border-line-subtle bg-bg-surface p-3', className)}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-base font-medium text-fg-primary">{title}</span>
            <StatusBadge status={STATUS} size="sm" dot />
          </div>
          {state === 'partial' && (
            <p className="mt-0.5 text-xs text-warning-text">
              {completed - failures.length}건 성공 · {failures.length}건 실패
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {state === 'running' && onCancel && (
            <button type="button" onClick={onCancel}
                    className="h-control-sm rounded-md px-2 text-xs font-medium text-fg-tertiary hover:bg-bg-hover hover:text-fg-primary">
              취소
            </button>
          )}
          {state !== 'running' && onDismiss && (
            <button type="button" onClick={onDismiss} aria-label="닫기"
                    className="flex h-control-sm w-control-sm items-center justify-center rounded-md text-fg-tertiary hover:bg-bg-hover">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <Progress value={completed} max={total} tone={TONE} />

      {/* 실패한 항목을 숨기지 않습니다 — 무엇이 왜 실패했는지 보여야 합니다 */}
      {failures.length > 0 && (
        <div className="mt-2.5 rounded-md border border-danger-border bg-danger-bg px-2.5 py-2">
          <p className="text-xs font-semibold text-danger-text">실패한 항목 {failures.length}건</p>
          <ul className="mt-1 space-y-0.5">
            {failures.slice(0, 4).map((f) => (
              <li key={f.key} className="flex gap-2 text-xs text-danger-text">
                <span className="shrink-0 font-medium tabular">{f.key}</span>
                <span className="min-w-0 truncate opacity-80">{f.reason}</span>
              </li>
            ))}
            {failures.length > 4 && (
              <li className="text-xs text-danger-text opacity-70">외 {failures.length - 4}건</li>
            )}
          </ul>
          {onRetryFailed && (
            <button type="button" onClick={onRetryFailed}
                    className="mt-1.5 text-xs font-semibold text-danger-text underline underline-offset-2">
              실패한 항목만 다시 시도
            </button>
          )}
        </div>
      )}
    </div>
  )
}
