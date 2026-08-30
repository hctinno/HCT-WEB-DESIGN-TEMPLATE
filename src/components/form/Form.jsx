import { useId } from 'react'
import { cn } from '../../lib/cn'
import { Button } from '../input/Button'
import { useBottomBar } from '../../lib/useBottomBar'

/**
 * 폼 레이아웃 — 관리도구의 설정·편집 화면.
 *
 * 개발 에이전트 사용 규칙:
 *   - 라벨을 필드 위에 두는 배치와 옆에 두는 배치를 한 화면에서 섞지 마세요.
 *     이 시스템은 **좌측 라벨 + 우측 컨트롤**을 기본으로 합니다. 설정 화면에서
 *     스캔하기 좋고, 필드 이름 길이가 달라도 컨트롤 시작점이 정렬됩니다.
 *   - 섹션마다 저장 버튼을 두지 마세요. 변경이 생기면 하단 저장 바가 뜹니다.
 *   - 필수 표시는 별표가 아니라 '선택'을 표시하는 쪽이 낫습니다. 대부분이
 *     필수인 화면에서 별표가 도배되면 아무 의미가 없습니다.
 */

/** 폼 전체를 감싸고 Enter 제출을 처리합니다 */
export function Form({ onSubmit, children, className }) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit?.() }}
      noValidate
      className={cn('flex flex-col', className)}
    >
      {children}
    </form>
  )
}

/**
 * 섹션. 제목 + 설명 + 필드들.
 * 설정 화면은 섹션 단위로 읽히므로 제목이 곧 목차가 됩니다.
 */
export function FormSection({ id, title, description, children, actions, className }) {
  return (
    <section id={id} className={cn('border-b border-line-subtle py-5 first:pt-0 last:border-b-0', className)}>
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="scroll-mt-4 text-md font-semibold text-fg-primary">{title}</h2>
          {description && (
            <p className="mt-0.5 max-w-[560px] text-sm leading-5 text-fg-tertiary">{description}</p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

/**
 * 필드 한 줄. 좌측 라벨 + 우측 컨트롤.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {string} [props.hint]     - 컨트롤 아래 설명
 * @param {string} [props.error]    - 있으면 hint 대신 표시됩니다
 * @param {boolean} [props.optional] - '선택' 배지
 */
/** 라벨 열 + 필드 열. FormRow 와 FormActions 가 공유합니다. */
const FORM_GRID = 'grid gap-1 sm:grid-cols-[180px_1fr] sm:gap-4'

export function FormRow({ label, hint, error, optional = false, htmlFor, children, className }) {
  const autoId = useId()
  const id = htmlFor ?? autoId
  return (
    <div className={cn(FORM_GRID, className)}>
      <label htmlFor={id} className="pt-1.5 text-base font-medium text-fg-secondary">
        {label}
        {optional && <span className="ml-1.5 text-xs font-normal text-fg-tertiary">선택</span>}
      </label>
      <div className="min-w-0">
        {typeof children === 'function' ? children({ id, invalid: Boolean(error) }) : children}
        {error ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-danger-text">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0">
              <circle cx="6" cy="6" r="4.75" stroke="currentColor" strokeWidth="1.2" />
              <path d="M6 3.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="6" cy="8.4" r="0.7" fill="currentColor" />
            </svg>
            {error}
          </p>
        ) : hint ? (
          <p className="mt-1 text-xs text-fg-tertiary">{hint}</p>
        ) : null}
      </div>
    </div>
  )
}

/**
 * 폼 안의 버튼 줄. FormRow 와 **같은 격자**를 써서 필드 열에 맞춥니다.
 *
 * 이걸 안 쓰고 각자 `pl-[196px]` 같은 값을 넣으면, 나중에 라벨 열 너비를
 * 바꿀 때 화면마다 버튼이 어긋납니다. 격자 정의는 한 곳에만 있어야 합니다.
 */
export function FormActions({ children, className }) {
  return (
    <div className={cn(FORM_GRID, className)}>
      <span aria-hidden="true" className="hidden sm:block" />
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

/**
 * 오류 요약 — 제출 실패 시 폼 상단에.
 *
 * 긴 폼에서 아래쪽 필드가 틀리면 화면 밖이라 안 보입니다. 요약에서 클릭해
 * 해당 필드로 이동할 수 있어야 합니다. 접근성 관점에서도 제출 실패는
 * 반드시 알려야 합니다(role="alert").
 */
export function FormErrorSummary({ errors = {}, labels = {}, onFocusField, className }) {
  const entries = Object.entries(errors)
  if (entries.length === 0) return null

  return (
    <div
      role="alert"
      className={cn('rounded-md border border-danger-border bg-danger-bg px-3 py-2.5', className)}
    >
      <p className="text-base font-semibold text-danger-text">
        {entries.length}개 항목을 확인해 주세요
      </p>
      <ul className="mt-1.5 space-y-0.5">
        {entries.map(([key, message]) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => onFocusField?.(key)}
              className="text-sm text-danger-text underline underline-offset-2 hover:opacity-80"
            >
              {labels[key] ?? key}: {message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * SaveBar — 변경이 생겼을 때만 하단에 떠오릅니다.
 *
 * 섹션마다 저장 버튼을 두는 대신 이 하나를 씁니다.
 * 무엇이 바뀌었는지 개수를 보여주는 게 중요합니다 — 긴 설정 화면에서
 * "내가 뭘 건드렸더라"를 사용자가 기억하고 있지 않습니다.
 */
export function SaveBar({ dirty, changedCount, onSave, onReset, saving = false, error }) {
  /* 훅은 조건부로 호출할 수 없으므로 dirty 를 인자로 넘깁니다 */
  useBottomBar(dirty, 64)
  if (!dirty) return null

  return (
    <div
      role="region"
      aria-label="저장하지 않은 변경"
      className={cn(
        'fixed bottom-4 left-1/2 z-toast flex w-[min(560px,calc(100vw-32px))] -translate-x-1/2',
        'items-center gap-3 rounded-lg border border-line-default bg-bg-raised px-3 py-2.5',
        'shadow-overlay animate-scale-in',
      )}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warning-bg text-warning-text">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <circle cx="6" cy="6" r="2.5" fill="currentColor" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium text-fg-primary">저장하지 않은 변경 {changedCount}건</p>
        {error && <p className="mt-0.5 text-xs text-danger-text">{error}</p>}
      </div>
      <Button variant="ghost" size="sm" onClick={onReset} disabled={saving}>되돌리기</Button>
      <Button variant="primary" size="sm" onClick={onSave} loading={saving}>저장</Button>
    </div>
  )
}

/** 설정 화면의 좌측 목차 */
export function SettingsNav({ sections = [], activeId, onSelect, className }) {
  return (
    <nav aria-label="설정 항목" className={cn('w-[180px] shrink-0', className)}>
      <ul className="sticky top-4 space-y-px">
        {sections.map((s) => {
          const active = s.id === activeId
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect?.(s.id)}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'flex h-control-lg w-full items-center rounded-md px-2 text-base',
                  'transition-colors duration-instant',
                  active
                    ? 'bg-accent-subtle font-semibold text-accent-text'
                    : 'font-normal text-fg-secondary hover:bg-bg-hover hover:text-fg-primary',
                )}
              >
                {s.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/**
 * 켜고 끄는 스위치. 체크박스보다 상태가 즉시 읽힙니다.
 *
 * `label` 은 **항상 필요합니다** — 없으면 스크린리더에는 "스위치, 켜짐"
 * 이라고만 읽혀 무엇의 스위치인지 알 수 없습니다. 다만 격자(타입 × 채널)
 * 안에서는 열 머리글이 이미 설명하고 있어 라벨을 또 그리면 화면이
 * 무너집니다. 그럴 때 `hideLabel` 로 **숨기되 지우지는 않습니다.**
 */
export function Switch({ checked, onChange, label, hideLabel = false, description, disabled = false, id }) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="flex items-start gap-2.5">
      <button
        type="button"
        role="switch"
        id={fieldId}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        aria-label={hideLabel ? label : undefined}
        className={cn(
          'relative mt-0.5 h-4 w-8 shrink-0 rounded-full transition-colors duration-fast',
          checked ? 'bg-accent-solid' : 'bg-line-strong',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-bg-surface',
            'transition-transform duration-fast ease-standard',
            /* 이동 거리 = 트랙 32 - 손잡이 12 - 좌우 여백 4 = 16px */
            checked ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </button>
      {!hideLabel && (label || description) && (
        <label htmlFor={fieldId} className="min-w-0 cursor-pointer">
          {label && <span className="block text-base text-fg-primary">{label}</span>}
          {description && <span className="block text-xs text-fg-tertiary">{description}</span>}
        </label>
      )}
    </div>
  )
}

/** 라디오 카드 — 선택지가 설명을 필요로 할 때 */
export function RadioCards({ options = [], value, onChange, name, className }) {
  return (
    <div role="radiogroup" className={cn('grid gap-2 sm:grid-cols-2', className)}>
      {options.map((o) => {
        const selected = o.value === value
        return (
          <label
            key={o.value}
            className={cn(
              'flex cursor-pointer items-start gap-2 rounded-md border p-2.5',
              'transition-colors duration-instant',
              selected
                ? 'border-accent-border bg-accent-subtle'
                : 'border-line-default bg-bg-surface hover:bg-bg-hover',
            )}
          >
            <input
              type="radio"
              name={name}
              checked={selected}
              onChange={() => onChange?.(o.value)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent-solid)]"
            />
            <span className="min-w-0">
              <span className={cn('block text-base', selected ? 'font-semibold text-accent-text' : 'text-fg-primary')}>
                {o.label}
              </span>
              {o.description && (
                <span className="mt-0.5 block text-xs leading-4 text-fg-tertiary">{o.description}</span>
              )}
            </span>
          </label>
        )
      })}
    </div>
  )
}
