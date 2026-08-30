import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * useGridKeyboard — 목록을 마우스 없이 조작합니다.
 *
 * 관리도구를 하루 종일 쓰는 사람에게 이건 편의 기능이 아니라 속도의 전부입니다.
 * 지라·리니어·슈퍼휴먼·Gmail 이 모두 같은 관용구를 씁니다:
 *
 *   ↑ / ↓ 또는 k / j   행 이동
 *   Enter              열기
 *   x 또는 Space       선택 토글
 *   Shift + ↑ / ↓      선택 확장
 *   ⌘/Ctrl + A         전체 선택
 *   Esc                선택 해제 · 포커스 해제
 *   ?                  단축키 도움말
 *
 * j/k 를 함께 받는 이유는 Vim 관용구가 이 계열 도구의 사실상 표준이기 때문입니다.
 *
 * 접근성: 로빙 포커스 대신 컨테이너 하나가 포커스를 갖고
 * aria-activedescendant 로 현재 행을 가리킵니다. 행마다 tabindex 를 주면
 * Tab 키로 목록을 빠져나가는 데 수십 번을 눌러야 합니다.
 *
 * @param {object} options
 * @param {any[]} options.records
 * @param {(r: any) => string|number} options.rowKey
 * @param {(r: any) => void} [options.onOpen]
 * @param {Set} options.selectedKeys
 * @param {(next: Set) => void} options.onSelectedKeysChange
 * @param {boolean} [options.enabled]
 *
 * '?' (단축키 도움말)는 여기서 다루지 않습니다 — ShortcutHelp 가 전역에서 받습니다.
 */
export function useGridKeyboard({
  records = [],
  rowKey = (r) => r.id,
  onOpen,
  selectedKeys,
  onSelectedKeysChange,
  enabled = true,
}) {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [active, setActive] = useState(false)
  const containerRef = useRef(null)
  const anchorRef = useRef(null)

  /* 목록이 줄어들면 포커스가 범위를 벗어납니다 */
  useEffect(() => {
    setFocusedIndex((i) => (i >= records.length ? records.length - 1 : i))
  }, [records.length])

  const move = useCallback((delta, extend) => {
    setFocusedIndex((current) => {
      const next = current < 0
        ? (delta > 0 ? 0 : records.length - 1)
        : Math.max(0, Math.min(records.length - 1, current + delta))

      if (extend && onSelectedKeysChange) {
        if (anchorRef.current == null) anchorRef.current = current < 0 ? next : current
        const [from, to] = [anchorRef.current, next].sort((a, b) => a - b)
        const set = new Set(selectedKeys)
        for (let i = from; i <= to; i += 1) set.add(rowKey(records[i]))
        onSelectedKeysChange(set)
      } else {
        anchorRef.current = next
      }
      return next
    })
  }, [records, rowKey, selectedKeys, onSelectedKeysChange])

  const toggleSelect = useCallback((index) => {
    if (!onSelectedKeysChange || index < 0 || !records[index]) return
    const key = rowKey(records[index])
    const set = new Set(selectedKeys)
    if (set.has(key)) set.delete(key)
    else set.add(key)
    anchorRef.current = index
    onSelectedKeysChange(set)
  }, [records, rowKey, selectedKeys, onSelectedKeysChange])

  const onKeyDown = useCallback((event) => {
    if (!enabled) return

    /* 입력 중일 때는 목록 단축키가 가로채면 안 됩니다 */
    const tag = event.target?.tagName
    const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      || event.target?.isContentEditable
    if (isTyping) return

    const key = event.key

    if (key === 'ArrowDown' || key === 'j') {
      event.preventDefault(); move(1, event.shiftKey); return
    }
    if (key === 'ArrowUp' || key === 'k') {
      event.preventDefault(); move(-1, event.shiftKey); return
    }
    if (key === 'Home') { event.preventDefault(); setFocusedIndex(0); return }
    if (key === 'End') { event.preventDefault(); setFocusedIndex(records.length - 1); return }
    if (key === 'Enter') {
      if (focusedIndex >= 0 && records[focusedIndex]) {
        event.preventDefault(); onOpen?.(records[focusedIndex])
      }
      return
    }
    if (key === 'x' || key === ' ') {
      event.preventDefault(); toggleSelect(focusedIndex); return
    }
    if ((event.metaKey || event.ctrlKey) && key.toLowerCase() === 'a') {
      event.preventDefault()
      onSelectedKeysChange?.(new Set(records.map(rowKey)))
      return
    }
    if (key === 'Escape') {
      if (selectedKeys?.size > 0) { event.preventDefault(); onSelectedKeysChange?.(new Set()) }
      else { setFocusedIndex(-1); containerRef.current?.blur() }
    }
    /* '?' 는 여기서 처리하지 않습니다. ShortcutHelp 가 문서 전역에서 받습니다.
       두 곳에서 같은 키를 처리하면 서로를 토글해 아무 일도 일어나지 않습니다
       (실제로 그렇게 만들었다가 렌더링 테스트에서 잡혔습니다). */
  }, [enabled, move, focusedIndex, records, rowKey, toggleSelect, selectedKeys, onSelectedKeysChange, onOpen])

  /* 포커스된 행이 화면 밖으로 나가면 따라 스크롤합니다 */
  useEffect(() => {
    if (focusedIndex < 0 || !containerRef.current) return
    const row = containerRef.current.querySelector(`[data-row-index="${focusedIndex}"]`)
    row?.scrollIntoView({ block: 'nearest' })
  }, [focusedIndex])

  return {
    containerRef,
    focusedIndex,
    active,
    /** 그리드 컨테이너에 펼쳐 넣으세요 */
    containerProps: {
      ref: containerRef,
      tabIndex: 0,
      role: 'grid',
      onKeyDown,
      onFocus: () => { setActive(true); setFocusedIndex((i) => (i < 0 && records.length ? 0 : i)) },
      onBlur: () => setActive(false),
      'aria-activedescendant': focusedIndex >= 0 && records[focusedIndex]
        ? `row-${rowKey(records[focusedIndex])}`
        : undefined,
    },
    setFocusedIndex,
  }
}

/** 단축키 도움말에 표시할 목록 — 실제 처리 로직과 한곳에서 관리합니다 */
export const GRID_SHORTCUTS = [
  { keys: ['↑', '↓'], alt: ['k', 'j'], label: '행 이동' },
  { keys: ['Enter'], label: '상세 열기' },
  { keys: ['X'], alt: ['Space'], label: '선택 토글' },
  { keys: ['Shift', '↑↓'], label: '선택 확장' },
  { keys: ['⌘', 'A'], label: '전체 선택' },
  { keys: ['Esc'], label: '선택 해제' },
  { keys: ['⌘', 'K'], label: '명령 팔레트' },
  { keys: ['?'], label: '이 도움말' },
]
