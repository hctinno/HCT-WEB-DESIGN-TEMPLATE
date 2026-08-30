import { useRef, useState } from 'react'
import { cn } from '../../lib/cn'

/**
 * Dropzone — 파일 올리기.
 *
 * 규칙:
 *   - **끌어다 놓기만으로 만들지 마세요.** 클릭으로도 되어야 하고, 키보드로도
 *     열려야 합니다. 드래그는 마우스가 있는 사람만 쓸 수 있습니다.
 *   - 허용 형식과 크기 한도를 **미리** 말해 주세요. 올린 다음에 거절하면
 *     사용자는 왜 안 되는지 모른 채 다시 시도합니다.
 *   - 거절 사유는 구체적으로: "지원하지 않는 형식"이 아니라
 *     "CSV 만 올릴 수 있습니다. 올리신 파일은 XLSX 입니다."
 */
export function Dropzone({
  accept = '.csv',
  maxSizeMB = 20,
  onFile,
  file,
  onClear,
  hint,
  className,
}) {
  const [over, setOver] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const validate = (f) => {
    const ext = '.' + (f.name.split('.').pop() ?? '').toLowerCase()
    const allowed = accept.split(',').map((a) => a.trim().toLowerCase())
    if (!allowed.includes(ext)) {
      return `${allowed.join(', ')} 만 올릴 수 있습니다. 올리신 파일은 ${ext} 입니다.`
    }
    if (f.size > maxSizeMB * 1024 * 1024) {
      return `${maxSizeMB}MB 까지 올릴 수 있습니다. 올리신 파일은 ${(f.size / 1024 / 1024).toFixed(1)}MB 입니다.`
    }
    return null
  }

  const take = (f) => {
    if (!f) return
    const problem = validate(f)
    if (problem) { setError(problem); return }
    setError(null)
    onFile?.(f)
  }

  if (file) {
    return (
      <div className={cn('flex items-center gap-3 rounded-md border border-line-default bg-bg-surface p-3', className)}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-subtle text-accent-text">
          <FileIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium text-fg-primary">{file.name}</p>
          <p className="text-xs tabular text-fg-tertiary">
            {(file.size / 1024).toLocaleString('ko-KR', { maximumFractionDigits: 0 })} KB
            {file.rows != null && ` · ${file.rows.toLocaleString('ko-KR')}행`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 text-sm font-medium text-fg-link hover:underline"
        >
          다른 파일 선택
        </button>
      </div>
    )
  }

  return (
    <div className={className}>
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files?.[0]) }}
        className={cn(
          'rounded-md border-2 border-dashed p-6 text-center transition-colors duration-fast',
          over ? 'border-accent-border bg-accent-subtle' : 'border-line-default bg-bg-sunken',
          error && 'border-danger-border bg-danger-bg',
        )}
      >
        <p className="text-base text-fg-secondary">
          파일을 여기에 끌어다 놓거나
        </p>
        {/* 드래그만으로 만들지 않습니다 — 클릭·키보드로도 되어야 합니다 */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 h-control-md rounded-md border border-line-default bg-bg-surface px-3 text-base font-medium text-fg-primary hover:bg-bg-hover"
        >
          컴퓨터에서 선택
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => take(e.target.files?.[0])}
        />
        <p className="mt-2.5 text-xs text-fg-tertiary">
          {accept} · 최대 {maxSizeMB}MB{hint ? ` · ${hint}` : ''}
        </p>
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-danger-text">{error}</p>
      )}
    </div>
  )
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M9 1.75H4.5A1.25 1.25 0 003.25 3v10A1.25 1.25 0 004.5 14.25h7A1.25 1.25 0 0012.75 13V5.5L9 1.75z"
            stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M9 1.75V5.5h3.75" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}
