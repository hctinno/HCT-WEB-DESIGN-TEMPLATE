import { useState } from 'react'
import { cn } from '../../lib/cn'

/**
 * ColumnSettings — 어떤 열을 볼지 사용자가 고릅니다.
 *
 * DataGrid 에 visibleFields prop 은 처음부터 있었지만, 그 값을 바꿀 수단이
 * 없으면 개발자만 쓸 수 있는 기능입니다. 관리도구는 사람마다 보는 열이
 * 다릅니다 — 운영자는 오류수를, 기획자는 담당자를 봅니다.
 *
 * 주 필드는 끌 수 없습니다. 제목이 사라진 목록은 읽을 수 없습니다.
 */
export function ColumnSettings({ fields = [], visibleFields = [], onChange, primaryField, className }) {
  const [open, setOpen] = useState(false)
  const visible = new Set(visibleFields)

  const toggle = (key) => {
    const next = fields
      .map((f) => f.key)
      .filter((k) => (k === key ? !visible.has(k) : visible.has(k)))
    onChange?.(next)
  }

  const hiddenCount = fields.length - visible.size

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'inline-flex h-control-sm items-center gap-1.5 rounded-md border px-2 text-xs font-medium',
          'transition-colors duration-instant',
          hiddenCount > 0
            ? 'border-accent-border bg-accent-subtle text-accent-text'
            : 'border-line-default bg-bg-surface text-fg-secondary hover:bg-bg-hover',
        )}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <rect x="1.25" y="1.75" width="9.5" height="8.5" rx="1.25" stroke="currentColor" strokeWidth="1.3" />
          <path d="M4.5 1.75v8.5M7.5 1.75v8.5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        열
        {hiddenCount > 0 && <span className="tabular">{visible.size}/{fields.length}</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-overlay" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-8 z-popover w-[200px] rounded-md border border-line-default bg-bg-raised py-1 shadow-lg">
            <p className="px-2 py-1 text-micro font-semibold uppercase tracking-[0.06em] text-fg-tertiary">
              표시할 열
            </p>
            <ul className="max-h-[280px] overflow-y-auto scroll-thin">
              {fields.map((f) => {
                const locked = f.key === primaryField
                const on = visible.has(f.key)
                return (
                  <li key={f.key}>
                    <label className={cn(
                      'flex items-center gap-2 px-2 py-1 text-base',
                      locked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-bg-hover',
                    )}>
                      <input
                        type="checkbox"
                        checked={on || locked}
                        disabled={locked}
                        onChange={() => toggle(f.key)}
                        className="h-4 w-4 rounded-sm border-line-default accent-[var(--color-accent-solid)]"
                      />
                      <span className="min-w-0 flex-1 truncate text-fg-primary">{f.label}</span>
                      {locked && <span className="text-micro text-fg-tertiary">고정</span>}
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
