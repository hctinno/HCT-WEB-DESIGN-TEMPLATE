import { cn } from '../../lib/cn'

/**
 * Stepper — 여러 단계로 나뉜 작업의 진행 표시.
 *
 * 가져오기·마법사처럼 되돌아갈 수 있는 흐름에 씁니다.
 *
 * 규칙:
 *   - **지나온 단계로는 되돌아갈 수 있어야 합니다.** 앞 단계에서 잘못 고른 걸
 *     알아챘는데 처음부터 다시 해야 하면 사용자는 창을 닫습니다.
 *   - 아직 못 간 단계는 클릭할 수 없습니다. 순서에 의미가 있으니까요.
 *   - 단계 이름은 명사가 아니라 **그 단계에서 하는 일**로 씁니다
 *     ("파일" 보다 "파일 올리기").
 */
export function Stepper({ steps = [], current = 0, onStepClick, className }) {
  return (
    <ol className={cn('flex items-center gap-1', className)}>
      {steps.map((step, i) => {
        const done = i < current
        const active = i === current
        const clickable = done && onStepClick

        return (
          <li key={step.key ?? i} className="flex min-w-0 flex-1 items-center gap-1">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(i)}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-left',
                clickable && 'hover:bg-bg-hover',
                !clickable && 'cursor-default',
              )}
            >
              <span className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-micro font-bold',
                done ? 'bg-success-solid text-fg-inverse'
                  : active ? 'bg-accent-solid text-fg-inverse'
                    : 'border border-line-default text-fg-tertiary',
              )}>
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M2 5.2l2 2 4-4" stroke="currentColor" strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : i + 1}
              </span>
              <span className={cn(
                'min-w-0 truncate text-sm',
                active ? 'font-semibold text-fg-primary'
                  : done ? 'text-fg-secondary' : 'text-fg-tertiary',
              )}>
                {step.label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <span className={cn('h-px min-w-4 flex-1', done ? 'bg-success-solid' : 'bg-line-default')} />
            )}
          </li>
        )
      })}
    </ol>
  )
}
