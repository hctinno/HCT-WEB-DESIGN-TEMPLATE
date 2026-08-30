import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/cn'

/**
 * CommandPalette — Cmd/Ctrl+K 전역 명령 팔레트.
 *
 * 노션·지라·슬랙이 모두 갖고 있는 기능이며, 관리도구에서 숙련 사용자의
 * 체감 속도를 가장 크게 좌우합니다. 화면이 늘어나도 탐색 비용이 늘지 않습니다.
 *
 * 개발 에이전트 사용 규칙:
 *   - 새 화면을 추가하면 이 팔레트에 항목을 등록하세요. 사이드바에만 추가하고
 *     끝내면 화면이 늘어날수록 사이드바가 감당하지 못합니다.
 *   - 항목은 그룹(group)으로 묶습니다. 그룹 이름은 사이드바 그룹과 일치시키세요.
 *
 * @param {object} props
 * @param {Array<{
 *   id: string, label: string, group?: string, hint?: string,
 *   icon?: React.ReactNode, keywords?: string[], onSelect: () => void
 * }>} props.commands
 */
export function CommandPalette({ open, onOpenChange, commands = [], placeholder = '명령 또는 검색어 입력' }) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  /* 전역 단축키 등록 */
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => {
      const haystack = [c.label, c.group, c.hint, ...(c.keywords ?? [])]
        .filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [commands, query])

  /* 그룹 순서를 유지하면서 묶기 */
  const groups = useMemo(() => {
    const map = new Map()
    filtered.forEach((c) => {
      const key = c.group ?? '기타'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(c)
    })
    return [...map.entries()]
  }, [filtered])

  /* 방향키 탐색용 평탄화 인덱스 */
  const flat = useMemo(() => groups.flatMap(([, items]) => items), [groups])

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, flat.length - 1)))
  }, [flat.length])

  if (!open) return null

  const runCommand = (cmd) => {
    onOpenChange(false)
    cmd.onSelect?.()
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onOpenChange(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % Math.max(1, flat.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + flat.length) % Math.max(1, flat.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const cmd = flat[activeIndex]
      if (cmd) runCommand(cmd)
    }
  }

  let runningIndex = -1

  return (
    <div className="fixed inset-0 z-palette flex items-start justify-center p-4 pt-[12vh]">
      <div className="fixed inset-0 bg-bg-overlay animate-fade-in" onClick={() => onOpenChange(false)} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="명령 팔레트"
        className="relative z-palette w-full max-w-[560px] animate-scale-in overflow-hidden rounded-lg border border-line-subtle bg-bg-raised shadow-overlay"
      >
        <div className="flex items-center gap-2 border-b border-line-subtle px-3">
          <span className="text-fg-tertiary">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <circle cx="6.75" cy="6.75" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.25 10.25L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0) }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            aria-label="명령 검색"
            aria-activedescendant={flat[activeIndex] ? `cmd-${flat[activeIndex].id}` : undefined}
            /* 예외: 팔레트는 열리는 즉시 이 입력에 포커스가 가고, 오버레이 자체가
               포커스 맥락을 나타냅니다. 링을 겹쳐 그리면 시각적으로 산만해집니다. */
            // design-lint-disable-next-line no-focus-outline-removal
            className="h-10 flex-1 bg-transparent text-base text-fg-primary outline-none placeholder:text-fg-tertiary"
          />
          <kbd className="rounded-sm border border-line-default bg-bg-sunken px-1.5 py-0.5 text-micro text-fg-tertiary">
            ESC
          </kbd>
        </div>

        <div ref={listRef} role="listbox" className="scroll-thin max-h-[380px] overflow-y-auto py-1.5">
          {flat.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-fg-tertiary">
              일치하는 명령이 없습니다
            </div>
          ) : (
            groups.map(([group, items]) => (
              <div key={group} className="mb-1 last:mb-0">
                <div className="px-3 py-1 text-micro font-semibold uppercase tracking-[0.06em] text-fg-tertiary">
                  {group}
                </div>
                {items.map((cmd) => {
                  runningIndex += 1
                  const isActive = runningIndex === activeIndex
                  const myIndex = runningIndex
                  return (
                    <button
                      key={cmd.id}
                      id={`cmd-${cmd.id}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIndex(myIndex)}
                      onClick={() => runCommand(cmd)}
                      className={cn(
                        'flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-base',
                        isActive ? 'bg-accent-subtle text-accent-text' : 'text-fg-primary',
                      )}
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-fg-tertiary">
                        {cmd.icon}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{cmd.label}</span>
                      {cmd.hint && (
                        <span className="shrink-0 text-xs text-fg-tertiary">{cmd.hint}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-line-subtle bg-bg-sunken px-3 py-1.5 text-micro text-fg-tertiary">
          <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> 이동</span>
          <span className="flex items-center gap-1"><Kbd>↵</Kbd> 실행</span>
          <span className="flex items-center gap-1"><Kbd>⌘</Kbd><Kbd>K</Kbd> 열기/닫기</span>
        </div>
      </div>
    </div>
  )
}

function Kbd({ children }) {
  return (
    <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded-sm border border-line-default bg-bg-surface px-1 font-sans text-micro">
      {children}
    </kbd>
  )
}

/** 상단바에 놓는 팔레트 트리거 버튼. 슬랙/노션의 검색창 위치입니다. */
export function CommandPaletteTrigger({ onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-control-md w-full items-center gap-2 rounded-md border border-line-default bg-bg-sunken px-2',
        'text-sm text-fg-tertiary hover:bg-bg-hover',
        className,
      )}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
        <circle cx="5.75" cy="5.75" r="3.75" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8.75 8.75L11.5 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <span className="flex-1 text-left">검색</span>
      <kbd className="rounded-sm border border-line-default bg-bg-surface px-1 text-micro">⌘K</kbd>
    </button>
  )
}
