import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/cn'

/**
 * Toast — 행동의 결과를 알리고, 되돌릴 기회를 줍니다.
 *
 * 관리도구에서 이게 없으면 위험합니다. 18건 중 4건을 골라 "완료 처리"를
 * 눌렀는데 화면이 조용하면, 사용자는 눌린 건지 몇 건이 바뀐 건지 모릅니다.
 * 실수로 눌렀다면 되돌릴 방법도 없습니다.
 *
 * 그래서 이 시스템의 규칙:
 *   - 목록을 바꾸는 행동은 **반드시** 토스트로 결과를 알립니다
 *   - 되돌릴 수 있는 행동은 **반드시** 실행 취소를 함께 제공합니다
 *   - 확인 대화상자로 막는 것보다 실행 취소가 낫습니다. 확인창은 매번
 *     귀찮고, 결국 사용자는 읽지 않고 확인을 누릅니다
 *
 * 접근성: 토스트 영역은 aria-live 로 스크린리더에 읽힙니다.
 */

const ToastContext = createContext(null)

/** 앱 최상단에 한 번 감싸세요. AppShell 바깥이 좋습니다. */
export function ToastProvider({ children, duration = 6000 }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) { clearTimeout(timer); timers.current.delete(id) }
  }, [])

  /**
   * @param {object} options
   * @param {string} options.message
   * @param {'neutral'|'success'|'warning'|'danger'} [options.tone]
   * @param {{label: string, onClick: () => void}} [options.action] - 보통 실행 취소
   * @param {number} [options.duration] - 0 이면 자동으로 사라지지 않습니다
   */
  const toast = useCallback((options) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const item = { id, tone: 'neutral', ...options }
    setToasts((prev) => [...prev.slice(-2), item]) /* 최대 3개 — 쌓이면 화면을 가립니다 */

    const ms = options.duration ?? duration
    if (ms > 0) {
      timers.current.set(id, setTimeout(() => dismiss(id), ms))
    }
    return id
  }, [duration, dismiss])

  useEffect(() => () => {
    for (const timer of timers.current.values()) clearTimeout(timer)
  }, [])

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastRegion toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

/** @returns {{toast: Function, dismiss: Function}} */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast 는 <ToastProvider> 안에서만 쓸 수 있습니다.')
  }
  return ctx
}

const TONES = {
  neutral: 'border-line-default bg-bg-raised text-fg-primary',
  success: 'border-success-border bg-success-bg text-success-text',
  warning: 'border-warning-border bg-warning-bg text-warning-text',
  danger: 'border-danger-border bg-danger-bg text-danger-text',
}

function ToastRegion({ toasts, onDismiss }) {
  return (
    <div
      role="region"
      aria-label="알림"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-1/2 z-toast flex -translate-x-1/2 flex-col items-center gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-center gap-3 rounded-lg border px-3 py-2 shadow-overlay',
            'animate-scale-in',
            TONES[t.tone] ?? TONES.neutral,
          )}
        >
          <span className="text-base">{t.message}</span>
          {t.action && (
            <>
              <span className="h-4 w-px bg-line-default" />
              <button
                type="button"
                onClick={() => { t.action.onClick(); onDismiss(t.id) }}
                className="shrink-0 text-base font-semibold underline underline-offset-2 hover:opacity-80"
              >
                {t.action.label}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="알림 닫기"
            className="shrink-0 opacity-50 hover:opacity-100"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
