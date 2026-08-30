import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { formatRelative, formatValue } from '../../lib/fields'
import { GridCell, Avatar, CellDisplay } from '../grid/GridCell'
import { StatusBadge } from '../feedback/StatusBadge'

/**
 * ObjectDetail — 지라 이슈 화면에 해당합니다.
 *
 * 이전의 우측 패널은 속성을 나열하고 "저장" 버튼을 단 읽기 전용 폼이었습니다.
 * 실제 관리도구의 상세 화면은 **살아있는 객체**입니다:
 *
 *   - 제목·필드를 그 자리에서 고치면 즉시 반영됩니다 (저장 버튼 없음)
 *   - 상태는 워크플로 전환으로 바뀝니다 (아무 값이나 되는 게 아님)
 *   - 누가 언제 무엇을 바꿨는지 이력이 남습니다
 *   - 댓글과 변경 이력이 하나의 시간순 피드에 섞입니다
 *
 * 마지막 항목이 중요합니다. 지라·리니어·깃허브 모두 "댓글 탭 / 이력 탭"으로
 * 나누지 않고 한 줄기로 보여줍니다. 무슨 일이 있었는지 재구성하려면
 * "누가 상태를 바꿨고 → 그래서 누가 뭐라고 했는지"가 이어져 읽혀야 합니다.
 */

/**
 * @param {object} props
 * @param {any} props.record
 * @param {import('../../lib/fields').Field[]} props.fields
 * @param {string[]} [props.detailFields] - 속성 영역에 보일 필드 key
 * @param {(fieldKey: string, value: any) => void} props.onEdit
 * @param {Array} [props.activity] - 활동 항목 (아래 ActivityFeed 참고)
 */
export function ObjectDetail({
  record,
  fields = [],
  detailFields,
  titleField = 'title',
  statusField = 'status',
  onEdit,
  activity = [],
  onAddComment,
  watchers = [],
  onToggleWatch,
  isWatching = false,
  onPrev,
  onNext,
  position,
  headerExtra,
  children,
  className,
}) {
  const fieldByKey = Object.fromEntries(fields.map((f) => [f.key, f]))
  const statusFieldDef = fieldByKey[statusField]
  const keys = detailFields ?? fields.filter((f) => f.key !== titleField && f.key !== statusField).map((f) => f.key)

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      {/* 레코드 간 이동 — 목록으로 돌아갔다가 다시 여는 왕복을 없앱니다.
          지라·리니어가 상세 화면에 이 컨트롤을 두는 이유입니다. 검토는 보통
          한 건이 아니라 여러 건을 연달아 보는 일이라, 왕복 비용이 곧 작업 속도입니다. */}
      {(onPrev || onNext) && (
        <div className="flex shrink-0 items-center gap-1 border-b border-line-subtle px-3 py-1.5">
          <button
            type="button"
            onClick={onPrev}
            disabled={!onPrev}
            aria-label="이전 항목"
            className={NAV_BTN}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!onNext}
            aria-label="다음 항목"
            className={NAV_BTN}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {position && (
            <span className="tabular text-xs text-fg-tertiary">
              {position.index} / {position.total}
            </span>
          )}
        </div>
      )}

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <div className="px-4 pb-4 pt-3">
          {/* 제목 — 클릭하면 그 자리에서 편집 */}
          <InlineTitle
            value={record[titleField]}
            onChange={onEdit ? (v) => onEdit(titleField, v) : undefined}
          />

          {/* 상태 전환 + 워처 */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {statusFieldDef && (
              <StatusTransition
                field={statusFieldDef}
                value={record[statusField]}
                onChange={onEdit ? (v) => onEdit(statusField, v) : undefined}
              />
            )}
            {onToggleWatch && (
              <button
                type="button"
                onClick={onToggleWatch}
                aria-pressed={isWatching}
                className={cn(
                  'inline-flex h-control-sm items-center gap-1 rounded-md border px-1.5 text-xs',
                  isWatching
                    ? 'border-accent-border bg-accent-subtle font-medium text-accent-text'
                    : 'border-line-default bg-bg-surface text-fg-secondary hover:bg-bg-hover',
                )}
              >
                <EyeIcon />
                {isWatching ? '보는 중' : '지켜보기'}
                {watchers.length > 0 && <span className="tabular">{watchers.length}</span>}
              </button>
            )}
            {headerExtra}
          </div>
        </div>

        {/* 속성 — 각 줄이 인라인 편집 가능 */}
        <section className="border-t border-line-subtle px-4 py-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-fg-tertiary">
            세부 정보
          </h3>
          <dl className="space-y-1">
            {keys.map((key) => {
              const field = fieldByKey[key]
              if (!field) return null
              return (
                <div key={key} className="flex items-start gap-2">
                  <dt className="w-[84px] shrink-0 pt-1 text-xs text-fg-tertiary">{field.label}</dt>
                  <dd className="min-w-0 flex-1">
                    <GridCell
                      field={field}
                      value={record[key]}
                      record={record}
                      onChange={onEdit ? (v) => onEdit(key, v) : undefined}
                    />
                  </dd>
                </div>
              )
            })}
          </dl>
        </section>

        {children && <section className="border-t border-line-subtle px-4 py-3">{children}</section>}

        <section className="border-t border-line-subtle px-4 py-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-fg-tertiary">
            활동
          </h3>
          <ActivityFeed items={activity} fields={fields} />
        </section>
      </div>

      {onAddComment && <CommentComposer onSubmit={onAddComment} />}
    </div>
  )
}

const NAV_BTN = cn(
  'flex h-control-sm w-control-sm items-center justify-center rounded-md',
  'text-fg-secondary hover:bg-bg-hover hover:text-fg-primary',
  'disabled:cursor-not-allowed disabled:opacity-30',
)

/** 제목 인라인 편집. 저장 버튼 없이 Enter/blur 로 확정됩니다. */
export function InlineTitle({ value, onChange, placeholder = '제목 없음' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const ref = useRef(null)

  useEffect(() => { setDraft(value ?? '') }, [value])
  useEffect(() => { if (editing) { ref.current?.focus(); ref.current?.select() } }, [editing])

  if (!onChange) {
    return <h2 className="text-md font-semibold leading-6 text-fg-primary">{value || placeholder}</h2>
  }

  if (editing) {
    return (
      <textarea
        ref={ref}
        rows={2}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { setEditing(false); if (draft !== value) onChange(draft) }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); setEditing(false); if (draft !== value) onChange(draft) }
          if (e.key === 'Escape') { setDraft(value ?? ''); setEditing(false) }
        }}
        /* 예외: 편집 시작과 동시에 포커스가 오고, 항상 켜진 ring 이 포커스 표시입니다. */
        // design-lint-disable-next-line no-focus-outline-removal
        className="w-full resize-none rounded-md border border-line-focus bg-bg-surface px-1.5 py-1 text-md font-semibold leading-6 text-fg-primary outline-none ring-1 ring-line-focus"
      />
    )
  }

  return (
    <h2
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setEditing(true) } }}
      title="클릭해서 편집"
      className="cursor-text rounded-md px-1.5 py-1 -mx-1.5 text-md font-semibold leading-6 text-fg-primary hover:bg-bg-hover"
    >
      {value || <span className="text-fg-disabled">{placeholder}</span>}
    </h2>
  )
}

/**
 * StatusTransition — 상태 변경.
 *
 * 일반 select 가 아니라 "전환" 개념입니다. 지라에서 상태를 바꾸는 것은
 * 필드 편집이 아니라 워크플로를 진행시키는 행위입니다.
 * 그래서 현재 상태를 크게 보여주고, 갈 수 있는 다음 상태를 나열합니다.
 */
export function StatusTransition({ field, value, onChange, allowed }) {
  const [open, setOpen] = useState(false)
  const current = field.options?.find((o) => o.value === value)
  const targets = (field.options ?? []).filter(
    (o) => o.value !== value && (!allowed || allowed.includes(o.value)),
  )

  if (!onChange) {
    return current?.status
      ? <StatusBadge status={current.status} dot>{current.label}</StatusBadge>
      : <span className="text-base text-fg-primary">{current?.label ?? '—'}</span>
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex h-control-sm items-center gap-1.5 rounded-md border border-line-default bg-bg-surface px-1.5 hover:bg-bg-hover"
      >
        {current?.status
          ? <StatusBadge status={current.status} dot size="sm">{current.label}</StatusBadge>
          : <span className="text-xs text-fg-primary">{current?.label ?? '상태 없음'}</span>}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" className="text-fg-tertiary">
          <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-overlay" onClick={() => setOpen(false)} aria-hidden="true" />
          <ul role="listbox" className="absolute left-0 top-8 z-popover w-[176px] rounded-md border border-line-default bg-bg-raised py-1 shadow-lg">
            <li className="px-2 py-1 text-micro font-semibold uppercase tracking-[0.06em] text-fg-tertiary">
              다음 상태로 전환
            </li>
            {targets.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => { setOpen(false); onChange(o.value) }}
                  className="flex w-full items-center gap-2 px-2 py-1 text-left hover:bg-bg-hover"
                >
                  {o.status
                    ? <StatusBadge status={o.status} dot size="sm">{o.label}</StatusBadge>
                    : <span className="text-base text-fg-primary">{o.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

/**
 * ActivityFeed — 변경 이력과 댓글이 한 줄기로 흐릅니다.
 *
 * 항목 형태:
 *   { id, type: 'comment', actor, at, body }
 *   { id, type: 'change',  actor, at, field, from, to }
 *   { id, type: 'created', actor, at }
 */
export function ActivityFeed({ items = [], fields = [] }) {
  const fieldByKey = Object.fromEntries(fields.map((f) => [f.key, f]))

  if (items.length === 0) {
    return <p className="py-2 text-xs text-fg-tertiary">아직 활동이 없습니다.</p>
  }

  return (
    <ol className="space-y-2.5">
      {items.map((item) => (
        <li key={item.id} className="flex gap-2">
          <span className="mt-0.5 shrink-0"><Avatar name={item.actor} size="md" /></span>

          <div className="min-w-0 flex-1">
            {item.type === 'comment' ? (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-medium text-fg-primary">{item.actor}</span>
                  <time className="text-micro text-fg-tertiary">{formatRelative(item.at)}</time>
                </div>
                <div className="mt-1 rounded-md border border-line-subtle bg-bg-sunken px-2.5 py-2 text-base leading-5 text-fg-secondary">
                  {item.body}
                </div>
              </>
            ) : item.type === 'created' ? (
              <p className="text-sm leading-5 text-fg-tertiary">
                <span className="font-medium text-fg-secondary">{item.actor}</span>
                {' 님이 생성 '}
                <time className="text-micro">{formatRelative(item.at)}</time>
              </p>
            ) : (
              <p className="flex flex-wrap items-center gap-1 text-sm leading-5 text-fg-tertiary">
                <span className="font-medium text-fg-secondary">{item.actor}</span>
                <span>{fieldByKey[item.field]?.label ?? item.field}</span>
                <ChangeValue field={fieldByKey[item.field]} value={item.from} muted />
                <span aria-hidden="true">→</span>
                <ChangeValue field={fieldByKey[item.field]} value={item.to} />
                <time className="text-micro">{formatRelative(item.at)}</time>
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

function ChangeValue({ field, value, muted = false }) {
  if (value == null || value === '') {
    return <span className="text-fg-disabled">없음</span>
  }
  if (field?.type === 'select') {
    const option = field.options?.find((o) => o.value === value)
    if (option?.status) {
      return <span className={muted ? 'opacity-60' : undefined}>
        <StatusBadge status={option.status} size="sm">{option.label}</StatusBadge>
      </span>
    }
  }
  return (
    <span className={cn('font-medium', muted ? 'text-fg-tertiary line-through' : 'text-fg-primary')}>
      {field ? formatValue(field, value) : String(value)}
    </span>
  )
}

/** 댓글 입력 — 하단에 고정됩니다. 슬랙·지라 모두 입력창이 항상 손 닿는 곳에 있습니다. */
export function CommentComposer({ onSubmit, placeholder = '댓글 남기기…' }) {
  const [value, setValue] = useState('')
  const submit = () => {
    const text = value.trim()
    if (!text) return
    onSubmit(text)
    setValue('')
  }

  return (
    <div className="shrink-0 border-t border-line-subtle bg-bg-surface p-3">
      <textarea
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          /* Cmd/Ctrl+Enter 로 전송 — 줄바꿈과 전송을 구분합니다 */
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); submit() }
        }}
        placeholder={placeholder}
        aria-label="댓글"
        className={cn(
          'w-full resize-none rounded-md border border-line-default bg-bg-surface px-2 py-1.5 text-base text-fg-primary',
          'placeholder:text-fg-tertiary',
          'focus:border-line-focus focus:outline-none focus:ring-1 focus:ring-line-focus',
        )}
      />
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-micro text-fg-tertiary">⌘↵ 로 전송</span>
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim()}
          className="h-control-sm rounded-md bg-accent-solid px-2.5 text-xs font-medium text-fg-inverse hover:bg-accent-solid-hover disabled:opacity-40"
        >
          댓글
        </button>
      </div>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M1 6s2-3.25 5-3.25S11 6 11 6s-2 3.25-5 3.25S1 6 1 6z" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="6" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
