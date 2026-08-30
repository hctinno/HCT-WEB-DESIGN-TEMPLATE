import { useEffect, useRef } from 'react'
import { cn } from '../../lib/cn'

/**
 * Modal / Drawer — 오버레이 계열.
 *
 * 개발 에이전트 사용 규칙 (무엇을 언제 쓰는가):
 *   Modal      → 집중이 필요한 짧은 작업. 확인, 생성 폼, 삭제 경고.
 *   Drawer     → 목록 맥락을 유지한 채 보는 상세·편집. 폭이 넓게 필요할 때.
 *   RightPanel → 계속 열어두는 상시 상세 패널(셸의 일부).
 *
 * 접근성 요구사항 (아래는 이미 구현되어 있습니다):
 *   - Esc 로 닫힘, 배경 클릭으로 닫힘
 *   - 열린 동안 배경 스크롤 잠금
 *   - 열릴 때 포커스 이동, 닫힐 때 원래 위치로 복귀
 *   - role="dialog" aria-modal aria-labelledby
 */

function useOverlayBehavior(open, onClose) {
  const previousFocus = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return

    previousFocus.current = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    /* 오버레이 안으로 포커스 이동 */
    const focusTarget = containerRef.current?.querySelector(
      '[data-autofocus], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    focusTarget?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      if (previousFocus.current instanceof HTMLElement) previousFocus.current.focus()
    }
  }, [open, onClose])

  return containerRef
}

const MODAL_SIZES = {
  sm: 'max-w-[400px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[760px]',
  xl: 'max-w-[1000px]',
}

export function Modal({ open, onClose, title, description, size = 'md', footer, children, className }) {
  const containerRef = useOverlayBehavior(open, onClose)
  if (!open) return null

  return (
    <div className="fixed inset-0 z-modal flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div
        className="fixed inset-0 bg-bg-overlay animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hct-modal-title"
        className={cn(
          'relative z-modal w-full animate-scale-in rounded-lg border border-line-subtle bg-bg-raised shadow-overlay',
          MODAL_SIZES[size] ?? MODAL_SIZES.md,
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-subtle px-4 py-3">
          <div className="min-w-0">
            <h2 id="hct-modal-title" className="text-md font-semibold text-fg-primary">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-fg-tertiary">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-control-sm w-control-sm shrink-0 items-center justify-center rounded-md text-fg-tertiary hover:bg-bg-hover hover:text-fg-primary"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="px-4 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-line-subtle px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 확인 대화상자. 파괴적 동작에는 tone="danger" 를 쓰세요.
 * 취소가 왼쪽, 실행이 오른쪽입니다. 순서를 바꾸지 마세요.
 */
export function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = '확인', cancelLabel = '취소', tone = 'default', loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-control-md rounded-md border border-line-default bg-bg-surface px-3 text-base font-medium text-fg-primary hover:bg-bg-hover"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            data-autofocus
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'h-control-md rounded-md px-3 text-base font-medium text-fg-inverse disabled:opacity-50',
              tone === 'danger' ? 'bg-danger-solid hover:opacity-90' : 'bg-accent-solid hover:bg-accent-solid-hover',
            )}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      {null}
    </Modal>
  )
}

const DRAWER_SIZES = {
  md: 'sm:w-panel',
  lg: 'sm:w-panel-wide',
  xl: 'sm:w-[640px]',
}

export function Drawer({ open, onClose, title, subtitle, size = 'md', footer, children }) {
  const containerRef = useOverlayBehavior(open, onClose)
  if (!open) return null

  return (
    <div className="fixed inset-0 z-drawer">
      <div className="absolute inset-0 bg-bg-overlay animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hct-drawer-title"
        className={cn(
          'absolute inset-y-0 right-0 flex w-full flex-col border-l border-line-subtle bg-bg-surface shadow-overlay',
          'animate-slide-in-right',
          DRAWER_SIZES[size] ?? DRAWER_SIZES.md,
        )}
      >
        <div className="flex h-topbar shrink-0 items-center gap-2 border-b border-line-subtle px-4">
          <div className="min-w-0 flex-1">
            <h2 id="hct-drawer-title" className="truncate text-sm font-semibold text-fg-primary">{title}</h2>
            {subtitle && <p className="truncate text-micro text-fg-tertiary">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-control-sm w-control-sm shrink-0 items-center justify-center rounded-md text-fg-tertiary hover:bg-bg-hover hover:text-fg-primary"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>

        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line-subtle px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
