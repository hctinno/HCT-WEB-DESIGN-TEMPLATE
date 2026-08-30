import { useState } from 'react'
import { cn } from '../../lib/cn'
import { OPERATORS } from '../../lib/fields'
import {
  addCondition, updateCondition, removeCondition,
  activeFilterChips, queryToText, isQueryActive,
} from '../../lib/query'
import { Tag } from '../feedback/StatusBadge'
import { Avatar } from '../grid/GridCell'

/**
 * FilterBuilder — 지라 JQL 빌더, 노션 필터 패널에 해당합니다.
 *
 * 이전의 FilterButton 은 클릭해도 아무것도 안 나오는 껍데기였습니다.
 * 실제로 필요한 것은 **조건을 쌓고, 읽고, 저장할 수 있는 구조**입니다.
 *
 * 두 가지 모드를 함께 제공합니다:
 *   빌더 모드 → 처음 쓰는 사람이 클릭으로 조건을 만듭니다
 *   텍스트 모드 → 숙련 사용자가 질의를 읽고 공유합니다
 *
 * 지라가 JQL을 UI 위에 노출한 이유가 이것입니다. 숙련도가 올라가면
 * 클릭보다 타이핑이 빠르고, 질의를 남에게 붙여넣어 줄 수 있습니다.
 *
 * @param {object} props
 * @param {import('../../lib/fields').Field[]} props.fields
 * @param {object} props.query
 * @param {(next: object) => void} props.onChange
 */
export function FilterBuilder({ fields = [], query, onChange, className }) {
  const [addOpen, setAddOpen] = useState(false)
  const fieldByKey = Object.fromEntries(fields.map((f) => [f.key, f]))

  const set = (next) => onChange?.(next)

  return (
    <div className={cn('rounded-md border border-line-default bg-bg-surface', className)}>
      <div className="flex items-center justify-between gap-2 border-b border-line-subtle px-2.5 py-1.5">
        <span className="text-xs font-semibold text-fg-secondary">필터</span>
        {query.conditions.length > 1 && (
          <label className="flex items-center gap-1 text-xs text-fg-tertiary">
            결합
            <select
              value={query.match}
              onChange={(e) => set({ ...query, match: e.target.value })}
              className="h-control-xs rounded-sm border border-line-default bg-bg-surface px-1 text-xs text-fg-primary focus:border-line-focus focus:outline-none focus:ring-1 focus:ring-line-focus"
            >
              <option value="all">모두 만족 (AND)</option>
              <option value="any">하나라도 (OR)</option>
            </select>
          </label>
        )}
      </div>

      <div className="space-y-1.5 p-2">
        {query.conditions.length === 0 && (
          <p className="px-1 py-2 text-xs text-fg-tertiary">
            조건이 없습니다. 아래에서 필드를 골라 조건을 추가하세요.
          </p>
        )}

        {query.conditions.map((condition, index) => {
          const field = fieldByKey[condition.field]
          if (!field) return null
          const operator = OPERATORS[condition.operator]

          return (
            <div key={index} className="flex flex-wrap items-center gap-1.5">
              <span className="w-8 shrink-0 text-right text-micro text-fg-tertiary">
                {index === 0 ? '조건' : (query.match === 'any' ? 'OR' : 'AND')}
              </span>

              {/* 필드 */}
              <select
                value={condition.field}
                onChange={(e) => {
                  const nextField = fieldByKey[e.target.value]
                  const nextOp = nextField.operators[0]
                  set(updateCondition(query, index, {
                    field: e.target.value,
                    operator: nextOp,
                    value: OPERATORS[nextOp]?.arity === 'many' ? [] : '',
                  }))
                }}
                className={SELECT_CLS}
              >
                {fields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>

              {/* 연산자 */}
              <select
                value={condition.operator}
                onChange={(e) => {
                  const nextOp = e.target.value
                  set(updateCondition(query, index, {
                    operator: nextOp,
                    value: OPERATORS[nextOp]?.arity === 'many' ? [] : '',
                  }))
                }}
                className={SELECT_CLS}
              >
                {field.operators.map((op) => (
                  <option key={op} value={op}>{OPERATORS[op].label}</option>
                ))}
              </select>

              {/* 값 — 연산자 항수에 따라 입력이 달라집니다 */}
              {operator?.arity !== 0 && (
                <ValueInput
                  field={field}
                  multiple={operator?.arity === 'many'}
                  value={condition.value}
                  onChange={(v) => set(updateCondition(query, index, { value: v }))}
                />
              )}

              <button
                type="button"
                onClick={() => set(removeCondition(query, index))}
                aria-label="조건 삭제"
                className="flex h-control-sm w-control-sm shrink-0 items-center justify-center rounded-md text-fg-tertiary hover:bg-bg-hover hover:text-danger-text"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )
        })}

        <div className="relative pt-0.5">
          <button
            type="button"
            onClick={() => setAddOpen((v) => !v)}
            className="ml-10 flex h-control-sm items-center gap-1 rounded-md px-1.5 text-xs font-medium text-fg-link hover:bg-bg-hover"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
              <path d="M5.5 2v7M2 5.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            조건 추가
          </button>

          {addOpen && (
            <>
              <div className="fixed inset-0 z-overlay" onClick={() => setAddOpen(false)} aria-hidden="true" />
              <ul
                role="listbox"
                className="absolute left-10 top-8 z-popover max-h-[224px] w-[192px] overflow-y-auto scroll-thin rounded-md border border-line-default bg-bg-raised py-1 shadow-lg"
              >
                {fields.map((f) => (
                  <li key={f.key}>
                    <button
                      type="button"
                      onClick={() => { set(addCondition(query, f)); setAddOpen(false) }}
                      className="flex w-full items-center gap-2 px-2 py-1 text-left text-base text-fg-primary hover:bg-bg-hover"
                    >
                      <span className="text-micro uppercase text-fg-tertiary">{f.type}</span>
                      <span className="truncate">{f.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const SELECT_CLS = cn(
  'h-control-sm shrink-0 rounded-md border border-line-default bg-bg-surface px-1.5 text-xs text-fg-primary',
  'focus:border-line-focus focus:outline-none focus:ring-1 focus:ring-line-focus',
)

/** 필드 타입 + 다중 여부에 따라 달라지는 값 입력 */
function ValueInput({ field, value, onChange, multiple }) {
  if (field.type === 'select' || field.type === 'tags' || field.type === 'user') {
    const options = field.options
      ?? [...new Set()].map((v) => ({ value: v, label: v }))

    if (multiple) {
      const list = Array.isArray(value) ? value : []
      return (
        <div className="flex flex-wrap items-center gap-1">
          {options?.map((o) => {
            const on = list.includes(o.value)
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(on ? list.filter((v) => v !== o.value) : [...list, o.value])}
                aria-pressed={on}
                className={cn(
                  'h-control-sm rounded-md border px-1.5 text-xs transition-colors duration-instant',
                  on
                    ? 'border-accent-border bg-accent-subtle font-medium text-accent-text'
                    : 'border-line-default bg-bg-surface text-fg-secondary hover:bg-bg-hover',
                )}
              >
                {o.label}
              </button>
            )
          })}
          {!options && (
            <input className={INPUT_CLS} value={list.join(', ')}
                   onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
          )}
        </div>
      )
    }

    return (
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={SELECT_CLS}>
        <option value="">선택…</option>
        {options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    )
  }

  const type = field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      placeholder="값"
      className={cn(INPUT_CLS, type === 'number' && 'w-20 text-right tabular')}
    />
  )
}

const INPUT_CLS = cn(
  'h-control-sm w-[128px] shrink-0 rounded-md border border-line-default bg-bg-surface px-1.5 text-xs text-fg-primary',
  'placeholder:text-fg-tertiary',
  'focus:border-line-focus focus:outline-none focus:ring-1 focus:ring-line-focus',
)

/**
 * QueryBar — 질의를 한 줄로 요약해 보여주고, 펼치면 빌더가 나옵니다.
 *
 * **적용된 조건은 항상 눈에 보여야 합니다.** 사용자가 "왜 결과가 이것뿐이지?"
 * 라고 묻게 되는 화면은 결함입니다.
 */
export function QueryBar({
  fields = [],
  query,
  onChange,
  onSaveView,
  resultCount,
  className,
}) {
  const [open, setOpen] = useState(false)
  const [showText, setShowText] = useState(false)
  const fieldByKey = Object.fromEntries(fields.map((f) => [f.key, f]))
  const chips = activeFilterChips(query, fieldByKey)
  const active = isQueryActive(query)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-[240px]">
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-fg-tertiary">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <circle cx="5.75" cy="5.75" r="3.75" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8.75 8.75L11.5 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="search"
            aria-label="검색"
            placeholder="전체 검색"
            value={query.search}
            onChange={(e) => onChange({ ...query, search: e.target.value })}
            className={cn(
              'h-control-md w-full rounded-md border border-line-default bg-bg-surface pl-6 pr-2 text-base text-fg-primary',
              'placeholder:text-fg-tertiary',
              'focus:border-line-focus focus:outline-none focus:ring-1 focus:ring-line-focus',
            )}
          />
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={cn(
            'inline-flex h-control-md items-center gap-1.5 rounded-md border px-2 text-base',
            'transition-colors duration-instant',
            query.conditions.length > 0
              ? 'border-accent-border bg-accent-subtle font-medium text-accent-text'
              : 'border-line-default bg-bg-surface text-fg-secondary hover:bg-bg-hover',
          )}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M1.5 2.5h9L7.25 6.5v3.25l-2.5 1.25V6.5L1.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
          필터
          {query.conditions.length > 0 && (
            <span className="tabular rounded-full bg-accent-solid px-1.5 text-micro font-semibold text-fg-inverse">
              {query.conditions.length}
            </span>
          )}
        </button>

        {resultCount != null && (
          <span className="tabular text-xs text-fg-tertiary">{resultCount.toLocaleString('ko-KR')}건</span>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowText((v) => !v)}
            title="질의를 텍스트로 보기"
            className="h-control-sm rounded-md px-1.5 text-xs font-medium text-fg-tertiary hover:bg-bg-hover hover:text-fg-primary"
          >
            {showText ? '빌더' : '질의문'}
          </button>
          {active && onSaveView && (
            <button
              type="button"
              onClick={onSaveView}
              className="h-control-sm rounded-md px-1.5 text-xs font-medium text-fg-link hover:bg-bg-hover"
            >
              뷰로 저장
            </button>
          )}
        </div>
      </div>

      {/* 적용된 조건 요약 — 항상 보입니다 */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <Tag
              key={chip.id}
              onRemove={() =>
                chip.id === '__search__'
                  ? onChange({ ...query, search: '' })
                  : onChange(removeCondition(query, chip.index))
              }
            >
              <span className="text-fg-tertiary">{chip.label}</span>
              <span className="font-medium text-fg-primary">{chip.value}</span>
            </Tag>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...query, search: '', conditions: [] })}
            className="ml-1 text-xs font-medium text-fg-link hover:underline"
          >
            전체 해제
          </button>
        </div>
      )}

      {showText && (
        <pre className="overflow-x-auto scroll-thin rounded-md border border-line-subtle bg-bg-sunken px-2.5 py-2 font-mono text-xs text-fg-secondary">
          {queryToText(query, fieldByKey) || '조건 없음 — 전체'}
        </pre>
      )}

      {open && <FilterBuilder fields={fields} query={query} onChange={onChange} />}
    </div>
  )
}
