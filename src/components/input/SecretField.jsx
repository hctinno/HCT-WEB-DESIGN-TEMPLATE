import { useState } from 'react'
import { cn } from '../../lib/cn'

/**
 * SecretField — API 키·토큰처럼 화면에 두면 안 되는 값.
 *
 * 규칙:
 *   - **기본은 가려진 상태입니다.** 화면 공유나 어깨 너머로 새어 나갑니다.
 *   - 복사는 눈으로 보지 않고도 되어야 합니다. 보여주기와 복사는 별개 동작입니다.
 *   - **발급 직후 한 번만 전체를 보여주고, 이후에는 앞 몇 자만** 남기는 것이
 *     안전합니다. 서버가 원문을 보관하지 않는다는 뜻이기도 합니다.
 *   - 복사했다는 피드백이 없으면 사용자는 두세 번 더 누릅니다.
 */
export function SecretField({
  label,
  value,
  revealedOnce = false,
  masked,
  onCopy,
  hint,
  className,
}) {
  const [shown, setShown] = useState(false)
  const [copied, setCopied] = useState(false)
  const display = shown ? value : (masked ?? maskValue(value))

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* 클립보드 접근 불가 — 값을 보여줘 직접 복사하게 합니다 */
      setShown(true)
    }
  }

  return (
    <div className={cn('w-full', className)}>
      {label && <p className="mb-1 text-xs font-medium text-fg-secondary">{label}</p>}
      <div className="flex items-center gap-1.5">
        <code className={cn(
          'min-w-0 flex-1 truncate rounded-md border border-line-default bg-bg-sunken px-2 py-1.5',
          'font-mono text-sm text-fg-primary',
        )}>
          {display}
        </code>
        {revealedOnce && (
          <button
            type="button"
            onClick={() => setShown((v) => !v)}
            aria-pressed={shown}
            className="h-control-md shrink-0 rounded-md border border-line-default bg-bg-surface px-2 text-xs font-medium text-fg-secondary hover:bg-bg-hover"
          >
            {shown ? '가리기' : '보기'}
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          className={cn(
            'h-control-md shrink-0 rounded-md border px-2 text-xs font-medium',
            copied
              ? 'border-success-border bg-success-bg text-success-text'
              : 'border-line-default bg-bg-surface text-fg-secondary hover:bg-bg-hover',
          )}
        >
          {copied ? '복사됨' : '복사'}
        </button>
      </div>
      {hint && <p className="mt-1 text-xs text-fg-tertiary">{hint}</p>}
    </div>
  )
}

function maskValue(value = '') {
  if (value.length <= 12) return '•'.repeat(value.length)
  return `${value.slice(0, 8)}${'•'.repeat(16)}${value.slice(-4)}`
}
