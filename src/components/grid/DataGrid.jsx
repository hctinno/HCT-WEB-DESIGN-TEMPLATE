import { useCallback, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { GridCell } from './GridCell'
import { groupRecords } from '../../lib/query'
import { SkeletonTable } from '../state/Skeleton'
import { NoResults, ErrorState } from '../state/EmptyState'
import { useGridKeyboard } from '../../lib/useGridKeyboard'
import { useVirtualRows } from '../../lib/useVirtualRows'
import { useBottomBar } from '../../lib/useBottomBar'

/**
 * DataGrid — 관리도구의 중심 컴포넌트.
 *
 * 이전의 DataTable 이 "데이터를 보여주는" 것이었다면, DataGrid 는
 * "데이터를 다루는" 것입니다. 지라·노션·리니어의 목록이 강력한 이유는
 * 목록에서 바로 작업이 끝나기 때문입니다. 상세 페이지로 갈 필요가 없습니다.
 *
 * 담당하는 것:
 *   - 다중 선택 (클릭, Shift 범위 선택, 전체 선택)
 *   - 선택 시 벌크 액션 바
 *   - 셀 인라인 편집 (낙관적 반영)
 *   - 호버 시에만 드러나는 행 액션
 *   - 필드 기준 그룹핑 + 그룹 접기
 *   - 키보드 조작 (↑↓/jk 이동, Enter 열기, x 선택, Shift 범위, ⌘A 전체, Esc 해제)
 *     ('?' 도움말은 ShortcutHelp 가 전역에서 받습니다 — 여기서 처리하지 않습니다)
 *   - 로딩·에러·빈 결과
 *
 * 개발 에이전트 사용 규칙:
 *   - columns 를 직접 만들지 말고 fields 스키마를 넘기세요.
 *     visibleFields 로 어떤 열을 보일지만 고릅니다.
 *   - onEditRecord 를 넘기면 인라인 편집이 켜집니다. 넘기지 않으면 읽기 전용입니다.
 *   - 선택 기능이 필요 없으면 selectable={false} 로 끄세요. 기본은 켜짐입니다.
 *   - 수백 건을 넘으면 virtualize 를 켜세요. 보이는 행만 그립니다.
 *     그룹핑과는 함께 쓸 수 없습니다(행 높이가 균일하지 않아 계산이 틀립니다).
 *     이 컴포넌트가 그룹핑이 켜지면 가상화를 자동으로 끕니다.
 *   - **primaryField 를 반드시 지정하세요.** 인라인 편집과 "상세 열기"는 둘 다
 *     클릭이라 충돌합니다. 노션이 쓰는 해법을 그대로 따릅니다:
 *       주 필드(제목) 클릭 → 레코드를 엽니다
 *       나머지 필드 클릭   → 그 자리에서 편집합니다
 *     이걸 화면마다 다르게 정하면 사용자가 어디를 눌러야 할지 매번 헷갈립니다.
 *
 * @param {object} props
 * @param {import('../../lib/fields').Field[]} props.fields  - 정규화된 필드 스키마
 * @param {string[]} [props.visibleFields]                   - 표시할 필드 key 순서
 * @param {any[]} props.records
 * @param {(r: any) => string|number} [props.rowKey]
 * @param {(record: any, fieldKey: string, value: any) => void} [props.onEditRecord]
 * @param {string} [props.primaryField] - 이 열은 편집 대신 레코드를 엽니다 (아래 설명 참고)
 * @param {import('../../lib/fields').Field} [props.groupField] - 그룹핑 기준
 * @param {(record: any) => React.ReactNode} [props.rowActions] - 호버 시 나타나는 액션
 * @param {React.ReactNode} [props.bulkActions]                 - 선택 시 하단 바 내용
 */
export function DataGrid({
  fields = [],
  visibleFields,
  records = [],
  rowKey = (r) => r.id,
  density = 'default',
  loading = false,
  error,
  onRetry,
  onRowClick,
  activeKey,
  onEditRecord,
  primaryField,
  groupField = null,
  sort,
  onToggleSort,
  rowActions,
  bulkActions,
  selectable = true,
  selectedKeys,
  onSelectedKeysChange,
  searchQuery,
  onClearFilters,
  emptyState,
  virtualize = false,
  maxHeight = 560,
  matchingCount,
  onSelectAllMatching,
  allMatchingSelected = false,
  className,
}) {
  const [internalSelected, setInternalSelected] = useState(() => new Set())
  const selected = selectedKeys ?? internalSelected
  const setSelected = onSelectedKeysChange ?? setInternalSelected
  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set())
  const lastClickedIndex = useRef(null)

  /* 키보드 조작 — 마우스 없이 목록을 훑고 고르고 열 수 있어야 합니다 */
  const keyboard = useGridKeyboard({
    records,
    rowKey,
    onOpen: onRowClick,
    selectedKeys: selected,
    onSelectedKeysChange: setSelected,
    enabled: selectable || Boolean(onRowClick),
  })

  const columns = useMemo(() => {
    if (!visibleFields) return fields
    const map = Object.fromEntries(fields.map((f) => [f.key, f]))
    return visibleFields.map((k) => map[k]).filter(Boolean)
  }, [fields, visibleFields])

  const flatRecords = records
  const groups = useMemo(
    () => (groupField ? groupRecords(records, groupField) : null),
    [records, groupField],
  )

  const allKeys = useMemo(() => flatRecords.map(rowKey), [flatRecords, rowKey])
  const allSelected = allKeys.length > 0 && allKeys.every((k) => selected.has(k))
  const someSelected = allKeys.some((k) => selected.has(k)) && !allSelected

  const toggleAll = useCallback(() => {
    setSelected(allSelected ? new Set() : new Set(allKeys))
  }, [allSelected, allKeys, setSelected])

  /**
   * 행 선택. Shift 를 누르면 마지막 선택 지점부터 범위 선택합니다.
   * 로그 100줄에서 20줄을 고를 때 이게 없으면 20번 클릭해야 합니다.
   */
  const toggleRow = useCallback((key, index, shiftKey) => {
    const next = new Set(selected)
    if (shiftKey && lastClickedIndex.current != null) {
      const [from, to] = [lastClickedIndex.current, index].sort((a, b) => a - b)
      const shouldSelect = !selected.has(key)
      for (let i = from; i <= to; i += 1) {
        const k = allKeys[i]
        if (shouldSelect) next.add(k)
        else next.delete(k)
      }
    } else {
      if (next.has(key)) next.delete(key)
      else next.add(key)
      lastClickedIndex.current = index
    }
    setSelected(next)
  }, [selected, allKeys, setSelected])

  /* 그룹핑이 켜지면 행 높이가 균일하지 않으므로 가상화를 끕니다 */
  const rowPx = { compact: 32, default: 40, relaxed: 48 }[density]
  const canVirtualize = virtualize && !groupField
  const virt = useVirtualRows({
    count: records.length,
    rowHeight: rowPx,
    enabled: canVirtualize,
  })

  if (loading) return <SkeletonTable rows={6} columns={columns.length || 4} density={density} />
  if (error) return <ErrorState description={error} onRetry={onRetry} />
  if (flatRecords.length === 0) {
    return emptyState ?? <NoResults query={searchQuery} onClearFilters={onClearFilters} />
  }

  const rowHeight = {
    compact: 'h-row-compact',
    default: 'h-row-default',
    relaxed: 'h-row-relaxed',
  }[density]

  const renderRow = (record, index) => {
    const key = rowKey(record)
    const isSelected = selected.has(key)
    const isActive = activeKey != null && key === activeKey

    return (
      <tr
        key={key}
        id={`row-${key}`}
        data-row-index={index}
        onClick={onRowClick ? () => onRowClick(record) : undefined}
        aria-selected={isSelected || undefined}
        className={cn(
          rowHeight,
          'group border-b border-line-subtle transition-colors duration-instant',
          isSelected ? 'bg-accent-subtle' : isActive ? 'bg-bg-active' : 'bg-bg-surface hover:bg-bg-hover',
          onRowClick && 'cursor-pointer',
          /* 키보드 포커스 행 — 그리드가 활성일 때만 표시합니다.
             항상 보이면 마우스 사용자에게는 정체불명의 강조로 보입니다. */
          keyboard.active && keyboard.focusedIndex === index &&
            'relative outline outline-2 -outline-offset-2 outline-line-focus',
        )}
      >
        {selectable && (
          <td className="w-8 px-2" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onChange={(e) => toggleRow(key, index, e.nativeEvent.shiftKey)}
              label={`${key} 선택`}
            />
          </td>
        )}

        {columns.map((field) => {
          /* 주 필드는 편집하지 않고 레코드를 엽니다. 그래서 stopPropagation 도 하지 않아
             행 클릭이 그대로 전달됩니다. */
          const isPrimary = field.key === primaryField
          return (
            <td
              key={field.key}
              className={cn('px-1', field.align === 'right' && 'text-right', field.align === 'center' && 'text-center')}
              onClick={onEditRecord && !isPrimary ? (e) => e.stopPropagation() : undefined}
            >
              {isPrimary ? (
                <span className={cn(
                  'block truncate px-2 py-1 font-medium text-fg-primary',
                  onRowClick && 'group-hover:text-fg-link group-hover:underline',
                )}>
                  {record[field.key]}
                </span>
              ) : (
                <GridCell
                  field={field}
                  value={record[field.key]}
                  record={record}
                  compact={density === 'compact'}
                  onChange={onEditRecord ? (v) => onEditRecord(record, field.key, v) : undefined}
                />
              )}
            </td>
          )
        })}

        {/* 행 액션 — 평소엔 없고 호버·포커스 때만 나타납니다.
            항상 보이면 목록이 버튼밭이 되어 데이터가 안 읽힙니다. */}
        {rowActions && (
          <td className="w-0 pr-2" onClick={(e) => e.stopPropagation()}>
            <div className={cn(
              'flex items-center justify-end gap-0.5',
              'opacity-0 transition-opacity duration-instant',
              'group-hover:opacity-100 group-focus-within:opacity-100',
            )}>
              {rowActions(record)}
            </div>
          </td>
        )}
      </tr>
    )
  }

  const colSpan = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)

  return (
    <div className={cn('relative', className)}>
      {/* 선택 상태를 스크린리더에 알립니다 — 시각적으로는 하단 바가 알리지만
          화면을 못 보는 사용자에게는 아무 일도 일어나지 않은 것과 같습니다 */}
      <span aria-live="polite" className="sr-only">
        {selected.size > 0 ? `${selected.size}개 선택됨` : ''}
      </span>

      {/* 포커스는 컨테이너가 받지만 표시는 현재 행에 나타납니다
          (aria-activedescendant 패턴). 컨테이너에도 테두리를 그리면 표 전체가
          둘러싸여 어느 행에 있는지가 오히려 흐려집니다. onFocus 에서
          focusedIndex 를 0 으로 올리므로 표시가 없는 순간은 없습니다.
          design-lint-disable-next-line no-focus-outline-removal */}
      <div
        {...keyboard.containerProps}
        ref={(el) => {
          keyboard.containerProps.ref.current = el
          if (canVirtualize) virt.scrollRef.current = el
        }}
        style={canVirtualize ? { maxHeight, overflowY: 'auto' } : undefined}
        /* design-lint-disable-next-line no-focus-outline-removal */
        className="overflow-x-auto scroll-thin focus:outline-none"
      >
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-sticky bg-bg-sunken">
            <tr>
              {selectable && (
                <th scope="col" className="w-8 border-b border-line-default px-2">
                  <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} label="전체 선택" />
                </th>
              )}
              {columns.map((field) => {
                const isSorted = sort?.[0]?.field === field.key
                const direction = sort?.[0]?.direction
                return (
                  <th
                    key={field.key}
                    scope="col"
                    style={field.width ? { width: field.width } : undefined}
                    aria-sort={isSorted ? (direction === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={cn(
                      'h-8 whitespace-nowrap border-b border-line-default px-2',
                      'text-xs font-semibold text-fg-secondary',
                      field.align === 'right' && 'text-right',
                      field.align === 'center' && 'text-center',
                    )}
                  >
                    {field.sortable && onToggleSort ? (
                      <button
                        type="button"
                        onClick={() => onToggleSort(field.key)}
                        className={cn('inline-flex items-center gap-1 hover:text-fg-primary',
                          field.align === 'right' && 'flex-row-reverse')}
                      >
                        {field.label}
                        <SortIcon active={isSorted} direction={direction} />
                      </button>
                    ) : field.label}
                  </th>
                )
              })}
              {rowActions && <th scope="col" className="w-0 border-b border-line-default" />}
            </tr>
          </thead>

          <tbody>
            {canVirtualize && virt.padTop > 0 && (
              <tr aria-hidden="true"><td colSpan={colSpan} style={{ height: virt.padTop }} /></tr>
            )}

            {groups
              ? groups.map((group) => {
                  const collapsed = collapsedGroups.has(group.key)
                  return [
                    <tr key={`g-${group.key}`} className="bg-bg-sunken">
                      <td colSpan={colSpan} className="border-b border-line-subtle px-2 py-1">
                        <button
                          type="button"
                          onClick={() => setCollapsedGroups((prev) => {
                            const next = new Set(prev)
                            if (next.has(group.key)) next.delete(group.key); else next.add(group.key)
                            return next
                          })}
                          aria-expanded={!collapsed}
                          className="flex items-center gap-1.5 text-xs font-semibold text-fg-secondary hover:text-fg-primary"
                        >
                          <Chevron open={!collapsed} />
                          {group.label}
                          <span className="tabular font-normal text-fg-tertiary">{group.records.length}</span>
                        </button>
                      </td>
                    </tr>,
                    ...(collapsed ? [] : group.records.map((r) => renderRow(r, flatRecords.indexOf(r)))),
                  ]
                })
              : (canVirtualize ? flatRecords.slice(virt.start, virt.end) : flatRecords)
                  .map((r, i) => renderRow(r, canVirtualize ? virt.start + i : i))}

            {canVirtualize && virt.padBottom > 0 && (
              <tr aria-hidden="true"><td colSpan={colSpan} style={{ height: virt.padBottom }} /></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectable && selected.size > 0 && (
        <BulkActionBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          actions={bulkActions}
          matchingCount={matchingCount}
          onSelectAllMatching={onSelectAllMatching}
          allMatchingSelected={allMatchingSelected}
        />
      )}
    </div>
  )
}

/**
 * BulkActionBar — 선택된 항목이 있을 때 화면 하단에 떠오릅니다.
 *
 * **뷰포트에 고정합니다(fixed).** 그리드 안에 sticky 로 두면 목록이 길 때
 * 화면 밖에 머물러, 선택을 해놓고도 액션을 찾지 못하는 상태가 됩니다.
 *
 * 선택 개수를 반드시 보여주고, 선택 해제 수단을 항상 제공합니다.
 * "몇 개를 지우는지 모른 채 삭제 버튼을 누르는" 상황을 막습니다.
 */
export function BulkActionBar({ count, onClear, actions, matchingCount, onSelectAllMatching, allMatchingSelected }) {
  /* 토스트가 이 바를 가리지 않도록 높이를 알립니다 */
  useBottomBar(true, 56)

  return (
    <div
      role="status"
      className={cn(
        'fixed bottom-4 left-1/2 z-toast flex w-fit -translate-x-1/2 items-center gap-3 rounded-lg',
        'border border-line-default bg-bg-raised px-3 py-2 shadow-overlay animate-scale-in',
      )}
    >
      <span className="text-base font-medium text-fg-primary tabular">
        {count.toLocaleString('ko-KR')}개 선택됨
      </span>

      {/* 페이지에 보이는 것만 선택된 상태를 드러냅니다.
          Gmail·지라의 관용구 — 이게 없으면 사용자는 5,000건을 선택했다고
          믿은 채 50건에만 작업하게 됩니다. */}
      {matchingCount != null && matchingCount > count && !allMatchingSelected && (
        <button
          type="button"
          onClick={onSelectAllMatching}
          className="text-base font-semibold text-fg-link underline underline-offset-2 hover:opacity-80"
        >
          조건에 맞는 {matchingCount.toLocaleString('ko-KR')}건 전체 선택
        </button>
      )}
      {allMatchingSelected && (
        <span className="text-xs text-fg-tertiary">조건에 맞는 전체</span>
      )}

      <span className="h-4 w-px bg-line-default" />
      <div className="flex items-center gap-1">{actions}</div>
      <button
        type="button"
        onClick={onClear}
        className="ml-1 text-xs text-fg-tertiary hover:text-fg-primary hover:underline"
      >
        선택 해제
      </button>
    </div>
  )
}

/** 3-상태 체크박스 (선택/미선택/일부선택) */
export function Checkbox({ checked, indeterminate = false, onChange, label }) {
  const ref = useRef(null)
  if (ref.current) ref.current.indeterminate = indeterminate
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className={cn(
        'h-4 w-4 cursor-pointer rounded-sm border-line-default',
        'accent-[var(--color-accent-solid)]',
      )}
    />
  )
}

function Chevron({ open }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
         className={cn('shrink-0 transition-transform duration-instant', open && 'rotate-90')}>
      <path d="M3.5 2L7 5L3.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SortIcon({ active, direction }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
         className={cn('shrink-0', active ? 'text-accent-text' : 'text-fg-disabled opacity-0 group-hover/th:opacity-100')}>
      <path d="M5 1.5L7.5 4.5h-5L5 1.5z" fill="currentColor" opacity={active && direction === 'desc' ? 0.3 : 1} />
      <path d="M5 8.5L2.5 5.5h5L5 8.5z" fill="currentColor" opacity={active && direction === 'asc' ? 0.3 : 1} />
    </svg>
  )
}
