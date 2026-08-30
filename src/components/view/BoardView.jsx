import { useState } from 'react'
import { cn } from '../../lib/cn'
import { groupRecords } from '../../lib/query'
import { CellDisplay, Avatar } from '../grid/GridCell'
import { StatusBadge } from '../feedback/StatusBadge'

/**
 * BoardView — 칸반 보드. 같은 데이터의 두 번째 투영입니다.
 *
 * 지라 보드의 핵심은 "보기 좋은 카드"가 아니라 **드래그가 곧 상태 전환**이라는 점입니다.
 * 카드를 옮기면 그 필드 값이 바뀌고, 표 뷰로 돌아가면 그 변경이 반영되어 있습니다.
 * 두 뷰가 같은 레코드를 보고 있기 때문입니다.
 *
 * 개발 에이전트 사용 규칙:
 *   - groupField 는 반드시 select 타입이어야 합니다. 컬럼이 선택지에서 나옵니다.
 *   - 빈 컬럼을 숨기지 마세요. 끌어다 놓을 자리가 사라집니다.
 *   - onMoveRecord 를 넘기지 않으면 읽기 전용 보드가 됩니다.
 *
 * @param {object} props
 * @param {import('../../lib/fields').Field} props.groupField - 컬럼 기준 (select)
 * @param {(record: any, nextValue: string) => void} [props.onMoveRecord]
 * @param {string[]} [props.cardFields] - 카드에 표시할 필드 key 들
 */
export function BoardView({
  fields = [],
  records = [],
  groupField,
  cardFields = [],
  titleField = 'title',
  rowKey = (r) => r.id,
  onMoveRecord,
  onCardClick,
  activeKey,
  cardActions,
  className,
}) {
  const [dragging, setDragging] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)

  const columns = groupRecords(records, groupField) ?? []
  const fieldByKey = Object.fromEntries(fields.map((f) => [f.key, f]))

  const handleDrop = (columnKey) => {
    setDragOverColumn(null)
    if (!dragging) return
    const record = records.find((r) => String(rowKey(r)) === String(dragging))
    setDragging(null)
    if (!record) return
    if (String(record[groupField.key]) === String(columnKey)) return
    onMoveRecord?.(record, columnKey === '__empty__' ? null : columnKey)
  }

  return (
    <div className={cn('flex gap-3 overflow-x-auto scroll-thin px-3 py-3', className)}>
      {columns.map((column) => {
        const isOver = dragOverColumn === column.key
        return (
          <section
            key={column.key}
            onDragOver={(e) => { if (onMoveRecord) { e.preventDefault(); setDragOverColumn(column.key) } }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={() => handleDrop(column.key)}
            className={cn(
              'flex w-[280px] shrink-0 flex-col rounded-lg border transition-colors duration-fast',
              isOver
                ? 'border-accent-border bg-accent-subtle'
                : 'border-line-subtle bg-bg-sunken',
            )}
          >
            <header className="flex items-center gap-2 px-2.5 py-2">
              {column.option?.status
                ? <StatusBadge status={column.option.status} dot size="sm">{column.label}</StatusBadge>
                : <span className="text-xs font-semibold text-fg-secondary">{column.label}</span>}
              <span className="tabular text-xs text-fg-tertiary">{column.records.length}</span>
            </header>

            <div className="flex min-h-16 flex-1 flex-col gap-2 px-2 pb-2">
              {column.records.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-line-default py-6 text-xs text-fg-disabled">
                  {onMoveRecord ? '여기로 끌어다 놓기' : '항목 없음'}
                </div>
              ) : (
                column.records.map((record) => {
                  const key = rowKey(record)
                  return (
                    <article
                      key={key}
                      draggable={Boolean(onMoveRecord)}
                      onDragStart={() => setDragging(String(key))}
                      onDragEnd={() => { setDragging(null); setDragOverColumn(null) }}
                      onClick={onCardClick ? () => onCardClick(record) : undefined}
                      className={cn(
                        'group rounded-md border bg-bg-surface p-2.5 shadow-sm',
                        'transition-colors duration-instant',
                        onMoveRecord && 'cursor-grab active:cursor-grabbing',
                        String(key) === String(dragging) && 'opacity-40',
                        activeKey != null && key === activeKey
                          ? 'border-accent-border ring-1 ring-line-focus'
                          : 'border-line-subtle hover:border-line-default',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 text-base font-medium leading-5 text-fg-primary">
                          {record[titleField]}
                        </p>
                        {cardActions && (
                          <span className="opacity-0 transition-opacity duration-instant group-hover:opacity-100">
                            {cardActions(record)}
                          </span>
                        )}
                      </div>

                      {cardFields.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                          {cardFields.map((k) => {
                            const field = fieldByKey[k]
                            if (!field || record[k] == null) return null
                            return (
                              <span key={k} className="text-xs text-fg-tertiary">
                                <CellDisplay field={field} value={record[k]} record={record} compact />
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </article>
                  )
                })
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
