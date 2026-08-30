import { useId } from 'react'
import { cn } from '../../lib/cn'

/**
 * 입력 컴포넌트 모음.
 *
 * 개발 에이전트 사용 규칙:
 *   - 모든 입력에는 라벨이 있어야 합니다. 시각적으로 숨기려면 hideLabel 을 쓰되
 *     label 자체를 생략하지 마세요.
 *   - 오류는 error prop 으로 전달합니다. 빨간 테두리만으로 표시하지 않고
 *     반드시 메시지를 함께 보여줍니다(색맹 접근성).
 *   - FormRow 안에서 쓸 때는 메시지를 FormRow 가 그리므로 필드에는
 *     `invalid` 만 넘깁니다. FormRow 의 렌더 프롭이 주는 값이 바로 이겁니다:
 *       <FormRow label="이름" error={...}>
 *         {({ id, invalid }) => <TextField id={id} invalid={invalid} ... />}
 *       </FormRow>
 *     `invalid` 는 테두리와 aria-invalid 만 담당하고 메시지는 만들지 않습니다.
 */

const FIELD_BASE = cn(
  'w-full rounded-md border bg-bg-surface px-2 text-base text-fg-primary',
  'placeholder:text-fg-tertiary',
  'transition-colors duration-instant',
  'disabled:cursor-not-allowed disabled:bg-bg-sunken disabled:text-fg-disabled',
)

export function TextField({
  label,
  hideLabel = false,
  hint,
  error,
  invalid = false,
  size = 'md',
  iconLeft,
  className,
  id,
  ...rest
}) {
  const bad = Boolean(error) || invalid
  const autoId = useId()
  const fieldId = id ?? autoId
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
  const heights = { sm: 'h-control-sm text-sm', md: 'h-control-md', lg: 'h-control-lg' }

  return (
    <div className={cn('w-full', className)}>
      <label
        htmlFor={fieldId}
        className={cn(
          'mb-1 block text-xs font-medium text-fg-secondary',
          hideLabel && 'sr-only',
        )}
      >
        {label}
      </label>
      <div className="relative">
        {iconLeft && (
          <span className="pointer-events-none absolute left-2 top-1/2 flex -translate-y-1/2 text-fg-tertiary">
            {iconLeft}
          </span>
        )}
        <input
          id={fieldId}
          aria-invalid={bad ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            FIELD_BASE,
            heights[size] ?? heights.md,
            iconLeft && 'pl-6',
            bad ? 'border-danger-border' : 'border-line-default',
            'focus:border-line-focus focus:outline-none focus:ring-1 focus:ring-line-focus',
          )}
          {...rest}
        />
      </div>
      {error ? (
        <p id={`${fieldId}-error`} className="mt-1 text-xs text-danger-text">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1 text-xs text-fg-tertiary">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function SelectField({ label, hideLabel = false, hint, error, invalid = false, options = [], size = 'md', className, id, ...rest }) {
  const bad = Boolean(error) || invalid
  const autoId = useId()
  const fieldId = id ?? autoId
  const heights = { sm: 'h-control-sm text-sm', md: 'h-control-md', lg: 'h-control-lg' }

  return (
    <div className={cn('w-full', className)}>
      <label htmlFor={fieldId} className={cn('mb-1 block text-xs font-medium text-fg-secondary', hideLabel && 'sr-only')}>
        {label}
      </label>
      <select
        id={fieldId}
        aria-invalid={bad ? true : undefined}
        className={cn(
          FIELD_BASE,
          heights[size] ?? heights.md,
          'pr-6',
          bad ? 'border-danger-border' : 'border-line-default',
          'focus:border-line-focus focus:outline-none focus:ring-1 focus:ring-line-focus',
        )}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error ? (
        <p className="mt-1 text-xs text-danger-text">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-fg-tertiary">{hint}</p>
      ) : null}
    </div>
  )
}

/** 전역/목록 검색 입력. 상단바와 필터 바에서 공용으로 씁니다. */
export function SearchInput({ placeholder = '검색', size = 'md', className, ...rest }) {
  return (
    <TextField
      label="검색"
      hideLabel
      type="search"
      size={size}
      placeholder={placeholder}
      className={className}
      iconLeft={<SearchIcon />}
      {...rest}
    />
  )
}

export function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="6.25" cy="6.25" r="4.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
