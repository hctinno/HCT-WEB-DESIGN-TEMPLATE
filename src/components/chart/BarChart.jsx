import { useMemo, useState } from 'react'
import { cn } from '../../lib/cn'
import { assignSeriesColors, axisPadLeft } from './chartTokens'
import { ChartLegend } from './LineChart'
import { useMeasuredWidth } from '../../lib/useMeasuredWidth'

/**
 * BarChart — 항목 간 크기 비교. 누적(stacked)도 지원합니다.
 *
 * 규칙:
 *   - **막대는 0에서 시작합니다.** 축을 잘라 차이를 부풀리지 마세요.
 *     선 차트는 0에서 시작하지 않아도 되지만 막대는 길이가 곧 값입니다.
 *   - 누적 조각 사이에 2px 표면색 간격을 둡니다. 붙여 놓으면 경계가
 *     색 차이로만 구분되어 색각 이상 사용자에게 하나로 보입니다.
 *   - 막대 끝(값이 끝나는 쪽)만 둥글게 합니다. 양끝을 둥글게 하면
 *     0 근처 값이 실제보다 커 보입니다.
 *   - 값 라벨은 선택적으로만. 모든 막대에 숫자를 찍으면 차트가 표가 됩니다.
 *
 * @param {object} props
 * @param {{key: string, label: string}[]} props.series
 * @param {{label: string, values: Record<string, number>}[]} props.data
 * @param {boolean} [props.stacked]
 */
export function BarChart({
  series = [],
  data = [],
  stacked = false,
  height = 220,
  formatValue = (n) => n.toLocaleString('ko-KR'),
  showValues = false,
  colorByKey,
  className,
}) {
  const [hover, setHover] = useState(null)
  const [wrapRef, W] = useMeasuredWidth()
  const colors = useMemo(
    () => colorByKey ?? assignSeriesColors(series.map((s) => s.key)),
    [series, colorByKey],
  )

  const max = useMemo(() => {
    const totals = data.map((d) => (stacked
      ? series.reduce((sum, s) => sum + (d.values[s.key] ?? 0), 0)
      : Math.max(...series.map((s) => d.values[s.key] ?? 0), 0)))
    const m = Math.max(...totals, 0) || 1
    const step = Math.pow(10, Math.floor(Math.log10(m)))
    return Math.ceil(m / step) * step
  }, [data, series, stacked])

  /* showValues 면 막대 위에 숫자가 올라가므로 위쪽 여백이 더 필요합니다.
     8px 로 두면 가장 큰 막대의 값만 잘려 나가고, 하필 그게 가장 중요한 값입니다. */
  const PAD = { top: showValues ? 20 : 8, right: 8, bottom: 24, left: 44 }
  const H = height
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const slot = plotW / Math.max(1, data.length)
  const barW = stacked ? Math.min(28, slot * 0.55) : Math.min(20, (slot * 0.7) / series.length)
  const GAP = 2 /* 누적 조각 사이 표면색 간격 */

  const ticks = Array.from({ length: 5 }, (_, i) => (max / 4) * i)
  PAD.left = axisPadLeft(ticks.map((t) => formatValue(Math.round(t))))

  return (
    <div className={cn('w-full', className)}>
      <div className="relative" ref={wrapRef}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} role="img"
             aria-label={`${series.map((s) => s.label).join(', ')} 비교`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right}
                    y1={PAD.top + plotH - (t / max) * plotH}
                    y2={PAD.top + plotH - (t / max) * plotH}
                    stroke="var(--chart-grid)" strokeWidth="1" />
              <text x={PAD.left - 8} y={PAD.top + plotH - (t / max) * plotH}
                    textAnchor="end" dominantBaseline="middle"
                    className="fill-fg-tertiary text-micro tabular">
                {formatValue(Math.round(t))}
              </text>
            </g>
          ))}

          {data.map((d, di) => {
            const groupX = PAD.left + di * slot
            let stackY = PAD.top + plotH

            return (
              <g key={d.label}
                 onMouseEnter={() => setHover(di)}
                 onMouseLeave={() => setHover(null)}>
                {/* 히트 영역을 막대보다 넓게 — 얇은 막대를 정확히 맞히기 어렵습니다 */}
                <rect x={groupX} y={PAD.top} width={slot} height={plotH}
                      fill="transparent" />

                {series.map((s, si) => {
                  const v = d.values[s.key] ?? 0
                  const h = (v / max) * plotH
                  if (h <= 0) return null

                  if (stacked) {
                    const y = stackY - h
                    stackY = y - GAP
                    const isTop = si === series.length - 1
                    return (
                      <rect key={s.key}
                            x={groupX + (slot - barW) / 2} y={y}
                            width={barW} height={Math.max(1, h - (isTop ? 0 : 0))}
                            rx={isTop ? 4 : 0}
                            fill={colors[s.key]}
                            opacity={hover == null || hover === di ? 1 : 0.45} />
                    )
                  }

                  const x = groupX + (slot - barW * series.length) / 2 + si * barW
                  return (
                    <rect key={s.key}
                          x={x + 1} y={PAD.top + plotH - h}
                          width={Math.max(1, barW - 2)} height={h} rx="4"
                          fill={colors[s.key]}
                          opacity={hover == null || hover === di ? 1 : 0.45} />
                  )
                })}

                {showValues && !stacked && series.length === 1 && (
                  <text x={groupX + slot / 2}
                        y={PAD.top + plotH - (d.values[series[0].key] ?? 0) / max * plotH - 4}
                        textAnchor="middle" className="fill-fg-secondary text-micro tabular">
                    {formatValue(d.values[series[0].key] ?? 0)}
                  </text>
                )}

                <text x={groupX + slot / 2} y={H - 6} textAnchor="middle"
                      className={cn('text-micro', hover === di ? 'fill-fg-primary' : 'fill-fg-tertiary')}>
                  {d.label}
                </text>
              </g>
            )
          })}
        </svg>

        {hover != null && data[hover] && (
          <div role="tooltip"
               className="pointer-events-none absolute top-2 z-popover min-w-[140px] rounded-md border border-line-default bg-bg-raised px-2 py-1.5 shadow-lg"
               style={{
                 left: `${((PAD.left + hover * slot + slot / 2) / W) * 100}%`,
                 transform: hover > data.length / 2 ? 'translateX(calc(-100% - 8px))' : 'translateX(8px)',
               }}>
            <p className="mb-1 text-micro text-fg-tertiary">{data[hover].label}</p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center justify-between gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-fg-secondary">
                  <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: colors[s.key] }} />
                  {s.label}
                </span>
                <span className="tabular font-medium text-fg-primary">
                  {formatValue(data[hover].values[s.key] ?? 0)}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>

      {series.length >= 2 && <ChartLegend series={series} colors={colors} />}
    </div>
  )
}

/**
 * ChartTable — 차트의 표 대체본.
 *
 * 차트는 색과 모양으로 말합니다. 스크린리더 사용자, 인쇄, 정확한 값이
 * 필요한 사람에게는 표가 필요합니다. 차트 옆에 토글로 두세요.
 */
export function ChartTable({ series = [], data = [], formatValue = (n) => n.toLocaleString('ko-KR'), className }) {
  return (
    <div className={cn('overflow-x-auto scroll-thin', className)}>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            <th scope="col" className="border-b border-line-default px-2 py-1 text-xs font-semibold text-fg-secondary">구분</th>
            {series.map((s) => (
              <th key={s.key} scope="col" className="border-b border-line-default px-2 py-1 text-right text-xs font-semibold text-fg-secondary">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row" className="border-b border-line-subtle px-2 py-1 text-sm font-normal text-fg-primary">{d.label}</th>
              {series.map((s) => (
                <td key={s.key} className="border-b border-line-subtle px-2 py-1 text-right text-sm tabular text-fg-primary">
                  {formatValue(d.values[s.key] ?? 0)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
