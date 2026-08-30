import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { formatValue, formatRelative, isEmptyValue } from '../../lib/fields'
import { StatusBadge, Tag } from '../feedback/StatusBadge'

/**
 * GridCell — 필드 타입에 따라 표시와 편집을 모두 담당합니다.
 *
 * 노션·지라·리니어 중 어느 것도 "보기 화면 → 편집 버튼 → 폼 → 저장" 을 하지 않습니다.
 * 셀을 클릭하면 그 자리에서 편집되고 즉시 반영됩니다. 이 컴포넌트가 그 동작을 담당합니다.
 *
 * 편집 규약 (모든 타입 공통):
 *   클릭/Enter  편집 시작
 *   Enter       확정
 *   Esc         취소 (원래 값 복구)
 *   blur        확정
 *
 * 개발 에이전트 사용 규칙:
 *   - 셀 렌더링을 화면마다 새로 만들지 마세요. 필드 타입을 늘리는 쪽이 맞습니다.
 *   - 편집 불가 필드는 스키마에서 editable: false 로 지정합니다.
 *     화면에서 조건문으로 막지 마세요.
 */
export function GridCell({ field, value, record, onChange, readOnly = false, compact = false }) {
  const [editing, setEditing] = useState(false)
  const editable = field.editable !== false && !readOnly && Boolean(onChange)

  const commit = (next) => {
    setEditing(false)
    if (next !== value) onChange?.(next)
  }

  if (editing) {
    return <CellEditor field={field} value={value} onCommit={commit} onCancel={() => setEditing(false)} />
  }

  const display = <CellDisplay field={field} value={value} record={record} compact={compact} />

  if (!editable) {
    return <div className="truncate px-2 py-1">{display}</div>
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(true) }
      }}
      title="클릭해서 편집"
      className={cn(
        'min-h-6 cursor-text truncate rounded-sm px-2 py-1',
        'transition-colors duration-instant',
        /* 편집 가능함을 평소엔 숨기고 호버 시에만 드러냅니다 — 노션의 밀도 비결 */
        'hover:bg-bg-hover hover:ring-1 hover:ring-line-default',
        isEmptyValue(value) && 'text-fg-disabled',
      )}
    >
      {isEmptyValue(value) ? <span className="text-fg-disabled">—</span> : display}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   표시
   ───────────────────────────────────────────────────────────── */

export function CellDisplay({ field, value, record, compact = false }) {
  if (isEmptyValue(value)) return <span className="text-fg-disabled">—</span>

  switch (field.type) {
    case 'select': {
      const option = field.options?.find((o) => o.value === value)
      /* 옵션이 워크플로 상태를 가리키면 StatusBadge 의 고정 색을 씁니다.
         화면마다 색이 달라지는 것을 막는 지점입니다. */
      if (option?.status) {
        return <StatusBadge status={option.status} dot size={compact ? 'sm' : 'md'}>{option.label}</StatusBadge>
      }
      return <span className="truncate">{option?.label ?? String(value)}</span>
    }

    case 'tags': {
      const list = Array.isArray(value) ? value : [value]
      return (
        <span className="flex flex-wrap items-center gap-1">
          {list.slice(0, 3).map((t) => <Tag key={t}>{t}</Tag>)}
          {list.length > 3 && <span className="text-xs text-fg-tertiary">+{list.length - 3}</span>}
        </span>
      )
    }

    case 'user': {
      const name = typeof value === 'object' ? value.name : value
      return (
        <span className="flex items-center gap-1.5 truncate">
          <Avatar name={name} />
          <span className="truncate">{name}</span>
        </span>
      )
    }

    case 'checkbox':
      return (
        <span className={cn('inline-flex h-4 w-4 items-center justify-center rounded-sm border',
          value ? 'border-accent-solid bg-accent-solid text-fg-inverse' : 'border-line-default')}>
          {value && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      )

    case 'date':
      return <span className="tabular" title={formatValue(field, value)}>{formatRelative(value)}</span>

    case 'number':
      return <span className="tabular">{formatValue(field, value)}</span>

    case 'link':
      return (
        <a href={value} target="_blank" rel="noreferrer"
           onClick={(e) => e.stopPropagation()}
           className="truncate text-fg-link hover:underline">{value}</a>
      )

    default:
      return <span className="truncate">{String(value)}</span>
  }
}

/** 이름에서 만든 이니셜 아바타. 사진이 없어도 사람을 구분할 수 있게 합니다. */
export function Avatar({ name, size = 'sm' }) {
  const initial = (name ?? '?').trim().charAt(0)
  /* 이름 해시로 색조를 고릅니다 — 임의 색이 아니라 토큰 안에서만 고릅니다 */
  const TONES = ['bg-info-solid', 'bg-success-solid', 'bg-review-solid', 'bg-warning-solid', 'bg-muted-solid']
  let hash = 0
  for (let i = 0; i < (name ?? '').length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 997
  const box = size === 'md' ? 'h-5 w-5 text-micro' : 'h-4 w-4 text-micro'
  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-fg-inverse',
        box, TONES[hash % TONES.length])}
    >
      {initial}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────
   편집
   ───────────────────────────────────────────────────────────── */

function CellEditor({ field, value, onCommit, onCancel }) {
  const ref = useRef(null)
  const [draft, setDraft] = useState(value ?? '')

  useEffect(() => {
    ref.current?.focus()
    if (ref.current?.select) ref.current.select()
  }, [])

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && field.type !== 'longtext') { e.preventDefault(); onCommit(draft) }
    if (e.key === 'Escape') { e.preventDefault(); onCancel() }
  }

  /* 예외: 에디터는 열리는 즉시 포커스를 받고, 항상 켜져 있는 ring 이 포커스 표시
     역할을 합니다. outline 을 겹치면 테두리가 이중으로 보입니다. */
  // design-lint-disable-next-line no-focus-outline-removal
  const base = 'w-full rounded-sm border border-line-focus bg-bg-surface px-1.5 py-0.5 text-base outline-none ring-1 ring-line-focus'

  switch (field.type) {
    case 'select':
      return (
        <select
          ref={ref}
          value={draft ?? ''}
          onChange={(e) => onCommit(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onCancel}
          className={base}
        >
          <option value="">—</option>
          {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )

    case 'checkbox':
      /* 체크박스는 편집 모드가 따로 없습니다. 클릭 = 토글. */
      return null

    case 'number':
      return (
        <input
          ref={ref} type="number" className={cn(base, 'text-right tabular')}
          value={draft ?? ''} onChange={(e) => setDraft(e.target.value === '' ? '' : Number(e.target.value))}
          onKeyDown={onKeyDown} onBlur={() => onCommit(draft)}
        />
      )

    case 'date':
      return (
        <input
          ref={ref} type="date" className={base}
          value={toDateInput(draft)} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown} onBlur={() => onCommit(draft)}
        />
      )

    case 'longtext':
      return (
        <textarea
          ref={ref} rows={3} className={cn(base, 'resize-y')}
          value={draft ?? ''} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown} onBlur={() => onCommit(draft)}
        />
      )

    case 'tags':
      return (
        <input
          ref={ref} className={base}
          value={Array.isArray(draft) ? draft.join(', ') : (draft ?? '')}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => onCommit(
            String(Array.isArray(draft) ? draft.join(',') : draft)
              .split(',').map((s) => s.trim()).filter(Boolean),
          )}
          placeholder="쉼표로 구분"
        />
      )

    default:
      return (
        <input
          ref={ref} className={base}
          value={draft ?? ''} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown} onBlur={() => onCommit(draft)}
        />
      )
  }
}

function toDateInput(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}
