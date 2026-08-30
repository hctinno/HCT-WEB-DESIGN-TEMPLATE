import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { Avatar } from '../grid/GridCell'

/**
 * Combobox — 검색 가능한 선택 입력 (타입어헤드).
 *
 * `<select>` 는 선택지가 10개를 넘으면 무너집니다. 담당자 200명, 시스템 50개
 * 같은 목록에서 사용자는 스크롤이 아니라 타이핑으로 찾습니다.
 *
 * 개발 에이전트 사용 규칙:
 *   - 선택지가 10개를 넘으면 SelectField 대신 이걸 쓰세요.
 *   - 값이 여럿이면 multiple 을 켜세요. 태그로 표시되고 Backspace 로 지웁니다.
 *   - 키보드만으로 완결되어야 합니다: ↑↓ 이동, Enter 선택, Esc 닫기, Backspace 삭제.
 *
 * 접근성: WAI-ARIA combobox 패턴을 따릅니다. 입력이 combobox 역할을 갖고
 * aria-activedescendant 로 강조 항목을 가리킵니다.
 */
export function Combobox({
  label,
  hideLabel = false,
  options = [],
  value,
  onChange,
  multiple = false,
  placeholder = '검색해서 선택',
  hint,
  error,
  disabled = false,
  showAvatar = false,
  emptyMessage = '일치하는 항목이 없습니다',
  className,
  id,
}) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const listId = `${fieldId}-list`

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const wrapRef = useRef(null)

  const selected = multiple ? (Array.isArray(value) ? value : []) : value

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const pool = multiple ? options.filter((o) => !selected.includes(o.value)) : options
    if (!q) return pool
    return pool.filter((o) => o.label.toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q))
  }, [options, search, multiple, selected])

  useEffect(() => { setActiveIndex(0) }, [search, open])

  /* 바깥 클릭으로 닫기 */
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const commit = (option) => {
    if (multiple) {
      onChange?.([...selected, option.value])
      setSearch('')
      /* 여러 개를 연달아 고르는 흐름이므로 닫지 않습니다 */
      inputRef.current?.focus()
    } else {
      onChange?.(option.value)
      setSearch('')
      setOpen(false)
    }
  }

  const removeAt = (index) => {
    if (!multiple) return
    onChange?.(selected.filter((_, i) => i !== index))
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) { setOpen(true); return }
      setActiveIndex((i) => (i + 1) % Math.max(1, filtered.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + filtered.length) % Math.max(1, filtered.length))
    } else if (e.key === 'Enter') {
      if (open && filtered[activeIndex]) { e.preventDefault(); commit(filtered[activeIndex]) }
    } else if (e.key === 'Escape') {
      if (open) { e.preventDefault(); e.stopPropagation(); setOpen(false) }
    } else if (e.key === 'Backspace' && multiple && !search && selected.length > 0) {
      /* 입력이 비었을 때 Backspace 는 마지막 태그를 지웁니다 — 태그 UI 의 관용구 */
      e.preventDefault()
      removeAt(selected.length - 1)
    }
  }

  const selectedLabel = !multiple
    ? options.find((o) => o.value === value)?.label ?? ''
    : ''

  return (
    <div className={cn('w-full', className)} ref={wrapRef}>
      <label htmlFor={fieldId} className={cn('mb-1 block text-xs font-medium text-fg-secondary', hideLabel && 'sr-only')}>
        {label}
      </label>

      <div className="relative">
        <div
          className={cn(
            'flex min-h-control-md w-full flex-wrap items-center gap-1 rounded-md border bg-bg-surface px-1.5 py-1',
            'transition-colors duration-instant',
            error ? 'border-danger-border' : 'border-line-default',
            /* 포커스 표시는 이 껍데기가 담당합니다 — 안의 input 이 아니라
               태그+입력 전체가 하나의 컨트롤로 보여야 하기 때문입니다 */
            'focus-within:border-line-focus focus-within:ring-1 focus-within:ring-line-focus',
            disabled && 'cursor-not-allowed bg-bg-sunken',
          )}
          onClick={() => { if (!disabled) { setOpen(true); inputRef.current?.focus() } }}
        >
          {multiple && selected.map((v, i) => {
            const o = options.find((x) => x.value === v)
            return (
              <span key={v} className="inline-flex h-5 items-center gap-1 rounded-sm border border-line-subtle bg-bg-sunken px-1.5 text-xs text-fg-primary">
                {showAvatar && <Avatar name={o?.label ?? String(v)} />}
                {o?.label ?? String(v)}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeAt(i) }}
                  aria-label={`${o?.label ?? v} 제거`}
                  className="text-fg-tertiary hover:text-fg-primary"
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
                    <path d="M2 2l5 5M7 2L2 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </button>
              </span>
            )
          })}

          <input
            ref={inputRef}
            id={fieldId}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && filtered[activeIndex] ? `${listId}-${activeIndex}` : undefined}
            aria-invalid={error ? true : undefined}
            disabled={disabled}
            value={open ? search : (multiple ? '' : selectedLabel)}
            placeholder={multiple && selected.length > 0 ? '' : placeholder}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
            onKeyDown={onKeyDown}
            className={cn(
              /* 포커스 링은 위 껍데기의 focus-within 이 그립니다. 여기서도 outline 을
                 그리면 테두리가 이중으로 겹칩니다.
                 design-lint-disable-next-line no-focus-outline-removal */
              'min-w-[80px] flex-1 bg-transparent text-base text-fg-primary outline-none',
              'placeholder:text-fg-tertiary disabled:cursor-not-allowed',
            )}
          />

          <span className="pointer-events-none shrink-0 text-fg-tertiary">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        {open && (
          <ul
            id={listId}
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+4px)] z-popover max-h-[220px] overflow-y-auto scroll-thin rounded-md border border-line-default bg-bg-raised py-1 shadow-lg"
          >
            {filtered.length === 0 ? (
              <li className="px-2 py-2 text-center text-sm text-fg-tertiary">{emptyMessage}</li>
            ) : filtered.map((o, i) => (
              <li key={o.value} id={`${listId}-${i}`} role="option" aria-selected={i === activeIndex}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => commit(o)}
                  className={cn(
                    'flex w-full items-center gap-2 px-2 py-1 text-left text-base',
                    i === activeIndex ? 'bg-accent-subtle text-accent-text' : 'text-fg-primary',
                  )}
                >
                  {showAvatar && <Avatar name={o.label} />}
                  <span className="min-w-0 flex-1 truncate">
                    <Highlight text={o.label} query={search} />
                  </span>
                  {o.hint && <span className="shrink-0 text-xs text-fg-tertiary">{o.hint}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error ? (
        <p className="mt-1 text-xs text-danger-text">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-fg-tertiary">{hint}</p>
      ) : null}
    </div>
  )
}

/** 검색어와 일치하는 부분을 굵게 — 왜 이 항목이 나왔는지 보여줍니다 */
function Highlight({ text, query }) {
  const q = query.trim()
  if (!q) return text
  const index = text.toLowerCase().indexOf(q.toLowerCase())
  if (index < 0) return text
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-transparent font-semibold text-accent-text">{text.slice(index, index + q.length)}</mark>
      {text.slice(index + q.length)}
    </>
  )
}
