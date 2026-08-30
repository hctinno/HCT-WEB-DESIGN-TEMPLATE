import { cn } from '../../lib/cn'
import { CHART_SEQ, seqStep } from '../chart/chartTokens'

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
 *   - 값이 숫자인 교차표(시험실 × 상태, 담당자 × 우선순위)라면 `heat` 를 켜세요.
 *     숫자만 나열하면 어느 칸이 뜨거운지 **열두 칸을 다 읽어야** 알 수 있습니다.
 *
 * heat 를 켜도 **숫자는 그대로 찍힙니다.** 색은 읽는 속도를 높이는 보조일 뿐,
 * 값을 전달하는 유일한 수단이 아닙니다. 그래서 검사 기준도 '칸 대 배경'이
 * 아니라 '칸 위의 글자'입니다.
 *
 * @param {object} props
 * @param {{key: string, label: string, hint?: string}[]} props.columns
 * @param {{key: string, label: string, values: Record<string, boolean|string|number>}[]} props.rows
 * @param {string} [props.rowHeader] - 첫 열 머리글
 * @param {boolean} [props.heat]     - 숫자 칸을 순차형 색으로 칠합니다
 * @param {(n: number) => string} [props.formatValue] - 숫자 표기 (기본: 천 단위 구분)
 * @param {React.ReactNode} [props.footer]
 */
export function MatrixTable({ columns = [], rows = [], rowHeader = '항목', heat = false,
                              formatValue, footer, className }) {
  /* 격자 전체에서 가장 큰 값이 기준입니다. 행마다 다시 계산하면 행끼리
     비교가 안 됩니다 — 어떤 행의 '진한 칸'이 다른 행의 '옅은 칸'보다
     작을 수 있으니까요. */
  const peak = heat
    ? Math.max(0, ...rows.flatMap((r) => columns.map((c) => (typeof r.values[c.key] === 'number' ? r.values[c.key] : 0))))
    : 0

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
              {columns.map((c) => {
                const step = heat ? seqStep(r.values[c.key], peak) : null
                return (
                  <td key={c.key} className="px-3 py-2 text-center"
                      style={step ? { backgroundColor: step.bg, color: step.fg } : undefined}>
                    <Cell value={r.values[c.key]} painted={Boolean(step)} format={formatValue} />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {/* 색에는 눈금이 필요합니다. 진하기가 무엇을 뜻하는지 없으면
          "이 칸이 진한 편인가?" 를 판단할 기준이 없습니다. */}
      {heat && peak > 0 && (
        <div className="flex items-center gap-2 border-t border-line-subtle px-3 py-1.5 text-micro text-fg-tertiary">
          <span>적음</span>
          <span className="flex" aria-hidden="true">
            {CHART_SEQ.map((s, i) => (
              <span key={i} className="h-2.5 w-5 first:rounded-l-sm last:rounded-r-sm"
                    style={{ backgroundColor: s.bg }} />
            ))}
          </span>
          <span>많음 · 최대 <span className="tabular">{peak.toLocaleString('ko-KR')}</span></span>
        </div>
      )}
      {footer && <div className="border-t border-line-subtle bg-bg-sunken px-3 py-2">{footer}</div>}
    </div>
  )
}

/** 셀 표시 — 기호 + 스크린리더 텍스트. 색은 거들 뿐입니다. */
function Cell({ value, painted = false, format }) {
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
  /* 숫자·문자열이면 그대로 — "5개까지" 같은 조건부 허용도 여기로 옵니다.
     칸이 칠해져 있으면 글자색은 td 가 정한 것을 물려받아야 합니다.
     여기서 text-fg-secondary 를 고집하면 진한 칸 위에서 안 보입니다. */
  return (
    <span className={cn('text-sm tabular', painted ? 'font-medium' : 'text-fg-secondary')}>
      {typeof value === 'number' ? (format ?? ((n) => n.toLocaleString('ko-KR')))(value) : value}
    </span>
  )
}
