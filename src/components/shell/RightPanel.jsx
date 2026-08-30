import { cn } from '../../lib/cn'

/**
 * RightPanel — 우측 상세 패널.
 *
 * 지라의 이슈 상세, 슬랙의 스레드, 노션의 댓글에 해당합니다.
 * 목록에서 항목을 선택했을 때 "맥락을 잃지 않고" 상세를 보여주는 것이 목적입니다.
 *
 * 개발 에이전트 사용 규칙:
 *   - 목록 → 상세 이동에 페이지 전환 대신 이 패널을 우선 검토하세요.
 *   - 편집처럼 집중이 필요한 작업은 Modal, 보조 정보는 RightPanel 입니다.
 *   - 닫기 버튼은 필수입니다. Esc 로도 닫혀야 합니다.
 */
export function RightPanel({ title, subtitle, onClose, actions, children, footer }) {
  return (
    <div className="flex h-full flex-col bg-bg-surface">
      <div className="flex h-topbar shrink-0 items-center gap-2 border-b border-line-subtle px-4">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-fg-primary">{title}</div>
          {subtitle && <div className="truncate text-micro text-fg-tertiary">{subtitle}</div>}
        </div>
        {actions}
        <button
          type="button"
          onClick={onClose}
          aria-label="패널 닫기"
          className="flex h-control-sm w-control-sm shrink-0 items-center justify-center rounded-md text-fg-tertiary hover:bg-bg-hover hover:text-fg-primary"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>

      {footer && (
        <div className="shrink-0 border-t border-line-subtle px-4 py-3">{footer}</div>
      )}
    </div>
  )
}

/**
 * 패널 안의 속성 목록. 지라 이슈 우측의 "세부 정보"와 같은 역할입니다.
 * 라벨 폭을 고정해 여러 에이전트가 만들어도 정렬이 어긋나지 않습니다.
 */
export function PropertyList({ children, className }) {
  return <dl className={cn('space-y-2.5', className)}>{children}</dl>
}

export function PropertyRow({ label, children }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="w-[92px] shrink-0 pt-0.5 text-xs text-fg-tertiary">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm text-fg-primary">{children}</dd>
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
