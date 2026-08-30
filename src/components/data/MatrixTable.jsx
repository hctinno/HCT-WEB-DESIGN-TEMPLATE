import { cn } from '../../lib/cn'

/**
 * MatrixTable — 두 축이 교차하는 참조 표.
 *
 * 권한 매트릭스(역할 × 기능), 요금제 비교, 지원 범위표처럼
 * **레코드 목록이 아니라 고정된 대조표**에 씁니다.
 * 선택·정렬·편집이 없으므로 DataGrid 를 쓰면 과합니다.
 *
 * 개발 에이전트 사용 규칙:
 *   - 목록(행이 레코드)이면 DataGrid 입니다. 이건 대조표 전용입니다.
 *   - **표시를 색으로만 하지 마세요.** 이 컴포넌트는 기호(✓/—)와
 *     스크린리더용 텍스트를 함께 냅니다. 색은 보조입니다.
 *
 * @param {object} props
 * @param {{key: string, label: string, hint?: string}[]} props.columns
 * @param {{key: string, label: string, values: Record<string, boolean|string>}[]} props.rows
 * @param {string} [props.rowHeader] - 첫 열 머리글
 * @param {React.ReactNode} [props.footer]
 */
export function MatrixTable({ columns = [], rows = [], rowHeader = '항목', footer, className }) {
  return (
    <div className={cn('overflow-x-auto scroll-thin', className)}>
      <table className="w-full border-collapse text-left">
        <thead className="bg-bg-sunken">
          <tr>
            <th scope="col" className="h-8 whitespace-nowrap border-b border-line-default px-3 text-xs font-semibold text-fg-secondary">
              {rowHeader}
            </th>
            {columns.map((c) => (
              <th key={c.key} scope="col"
                  className="h-8 whitespace-nowrap border-b border-line-default px-3 text-center text-xs font-semibold text-fg-secondary">
                {c.label}
                {c.hint != null && (
                  <span className="ml-1 tabular font-normal text-fg-tertiary">{c.hint}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-line-subtle last:border-b-0">
              <th scope="row" className="px-3 py-2 text-base font-normal text-fg-primary">{r.label}</th>
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2 text-center">
                  <Cell value={r.values[c.key]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {footer && <div className="border-t border-line-subtle bg-bg-sunken px-3 py-2">{footer}</div>}
    </div>
  )
}

/** 셀 표시 — 기호 + 스크린리더 텍스트. 색은 거들 뿐입니다. */
function Cell({ value }) {
  if (value === true) {
    return (
      <span className="text-success-text" title="가능">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="inline-block">
          <path d="M3 7.2l2.6 2.6L11 4.4" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="sr-only">가능</span>
      </span>
    )
  }
  if (value === false || value == null) {
    return (
      <span className="text-fg-disabled" title="불가">
        <span aria-hidden="true">—</span>
        <span className="sr-only">불가</span>
      </span>
    )
  }
  /* 문자열이면 그대로 — "5개까지" 같은 조건부 허용 */
  return <span className="text-sm text-fg-secondary">{value}</span>
}
