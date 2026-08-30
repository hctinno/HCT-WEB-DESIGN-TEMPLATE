import { useEffect, useRef } from 'react'
import { cn } from '../../lib/cn'
import { Modal } from './Modal'
import { GRID_SHORTCUTS } from '../../lib/useGridKeyboard'

/**
 * ShortcutHelp — `?` 로 열리는 단축키 안내.
 *
 * 단축키는 **발견되지 않으면 없는 것과 같습니다.** 지라·리니어·슬랙·깃허브가
 * 모두 `?` 를 도움말에 배정한 이유입니다. 이 관용구를 따르세요.
 *
 * 목록은 lib/useGridKeyboard.js 의 GRID_SHORTCUTS 에서 가져옵니다.
 * 처리 로직과 안내가 한곳에 있어야 서로 어긋나지 않습니다.
 */
export function ShortcutHelp({ open, onClose, extra = [] }) {
  /* 어디서든 ? 로 열립니다 — 목록에 포커스가 없어도.
     이 컴포넌트가 '?' 의 유일한 주인입니다. 다른 곳에서 같은 키를 처리하면
     서로를 토글해 아무 일도 일어나지 않습니다. */
  const openRef = useRef(open)
  openRef.current = open

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return
      if (e.key === '?') { e.preventDefault(); onClose(!openRef.current) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <Modal
      open={open}
      onClose={() => onClose(false)}
      title="단축키"
      description="목록에 포커스가 있을 때 동작합니다."
      size="sm"
    >
      <dl className="space-y-1.5">
        {[...GRID_SHORTCUTS, ...extra].map((s) => (
          <div key={s.label} className="flex items-center justify-between gap-4">
            <dt className="text-base text-fg-secondary">{s.label}</dt>
            <dd className="flex shrink-0 items-center gap-1">
              {s.keys.map((k) => <Key key={k}>{k}</Key>)}
              {s.alt && (
                <>
                  <span className="px-0.5 text-micro text-fg-tertiary">또는</span>
                  {s.alt.map((k) => <Key key={k}>{k}</Key>)}
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  )
}

function Key({ children }) {
  return (
    <kbd className={cn(
      'inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-line-default',
      'bg-bg-sunken px-1.5 font-sans text-xs text-fg-secondary',
    )}>
      {children}
    </kbd>
  )
}
