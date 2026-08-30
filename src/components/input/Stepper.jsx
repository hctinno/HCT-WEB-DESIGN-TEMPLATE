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
  const now = steps[current]

  return (
    <div className={className}>
      {/*
        좁은 화면에서는 단계 이름이 "1 파... 2 열... 3 확..." 으로 잘려
        무슨 단계인지 알 수 없게 됩니다. 네 단계를 390px 에 나란히 넣을 방법은
        없으므로, 지금 어디인지만 온전한 문장으로 보여줍니다.
        (실제로 390px 에서 그렇게 깨진 것을 보고 고쳤습니다.)
      */}
      <div className="sm:hidden">
        <p className="text-xs font-medium text-fg-tertiary">
          <span className="tabular">{current + 1}</span> / {steps.length} 단계
        </p>
        <p className="mt-0.5 text-base font-semibold text-fg-primary">{now?.label}</p>
        <div className="mt-2 flex gap-1" aria-hidden="true">
          {steps.map((step, i) => (
            <span
              key={step.key ?? i}
              className={cn(
                'h-1 flex-1 rounded-full',
                i < current ? 'bg-success-solid' : i === current ? 'bg-accent-solid' : 'bg-line-default',
              )}
            />
          ))}
        </div>
      </div>

    <ol className={cn('hidden items-center gap-1 sm:flex')}>
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
    </div>
  )
}
