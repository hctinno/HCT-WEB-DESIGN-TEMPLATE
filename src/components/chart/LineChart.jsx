import { useMemo, useState } from 'react'
import { cn } from '../../lib/cn'
import { assignSeriesColors, axisPadLeft } from './chartTokens'
import { useMeasuredWidth } from '../../lib/useMeasuredWidth'

/**
 * LineChart — 시간에 따른 변화.
 *
 * 규칙 (이 시스템 전체에 적용):
 *   - **축은 하나뿐입니다.** 단위가 다른 두 지표를 한 차트에 겹치지 마세요.
 *     차트를 둘로 나누거나 공통 기준으로 지수화하세요. 이중 축은 아무 관계나
 *     있어 보이게 만드는 가장 흔한 거짓말입니다.
 *   - 격자와 축은 물러나 있어야 합니다. 데이터가 가장 진해야 합니다.
 *   - 계열이 2개 이상이면 범례가 항상 있고, 4개 이하면 선 끝에 직접 라벨을 답니다.
 *     색만으로 정체를 전달하지 않습니다.
 *   - 값 글자는 계열 색이 아니라 텍스트 토큰을 씁니다.
 *   - 마우스를 올리면 세로 기준선과 함께 그 시점의 모든 계열 값을 보여줍니다.
 *     점마다 숫자를 찍어두면 읽을 수 없습니다.
 *
 * @param {object} props
 * @param {{key: string, label: string, points: number[]}[]} props.series
 * @param {string[]} props.labels - x축 눈금 라벨 (points 와 길이가 같아야 합니다)
 * @param {(n: number) => string} [props.formatValue]
 */
export function LineChart({
  series = [],
  labels = [],
  height = 220,
  area = false,
  formatValue = (n) => n.toLocaleString('ko-KR'),
  yTicks = 4,
  className,
}) {
  const [hover, setHover] = useState(null)
  /* viewBox 를 실제 폭에 맞춥니다 — 고정 폭이면 넓은 화면에서 가운데만 차지합니다 */
  const [wrapRef, W] = useMeasuredWidth()

  const colors = useMemo(() => assignSeriesColors(series.map((s) => s.key)), [series])
  const pointCount = Math.max(...series.map((s) => s.points.length), 0)

  const max = useMemo(() => {
    const m = Math.max(...series.flatMap((s) => s.points), 0)
    /* 눈금이 예쁜 수로 떨어지게 올림 — 축 라벨이 3417 같으면 읽기 어렵습니다 */
    const step = Math.pow(10, Math.floor(Math.log10(m || 1)))
    return Math.ceil((m || 1) / step) * step
  }, [series])

  const PAD = { top: 8, right: 12, bottom: 20, left: 44 } /* left 는 아래에서 라벨 폭에 맞춰 덮어씁니다 */
  const H = height
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const xAt = (i) => PAD.left + (pointCount <= 1 ? plotW / 2 : (i / (pointCount - 1)) * plotW)
  const yAt = (v) => PAD.top + plotH - (v / max) * plotH

  const onMove = (e) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect || pointCount === 0) return
    const ratio = (e.clientX - rect.left) / rect.width
    const svgX = ratio * W
    const i = Math.round(((svgX - PAD.left) / plotW) * (pointCount - 1))
    setHover(Math.max(0, Math.min(pointCount - 1, i)))
  }

  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => (max / yTicks) * i)
  PAD.left = axisPadLeft(ticks.map((t) => formatValue(Math.round(t))))
  const directLabels = series.length <= 4

  return (
    <div className={cn('w-full', className)}>
      <div
        ref={wrapRef}
        className="relative"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} role="img"
             aria-label={`${series.map((s) => s.label).join(', ')} 추이`}>
          {/* 가로 격자만 — 세로선까지 그리면 모눈종이가 되어 데이터가 묻힙니다 */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={yAt(t)} y2={yAt(t)}
                    stroke="var(--chart-grid)" strokeWidth="1" />
              <text x={PAD.left - 8} y={yAt(t)} textAnchor="end" dominantBaseline="middle"
                    className="fill-fg-tertiary text-micro tabular">
                {formatValue(Math.round(t))}
              </text>
            </g>
          ))}

          {/* 기준선 — 호버 지점 */}
          {hover != null && (
            <line x1={xAt(hover)} x2={xAt(hover)} y1={PAD.top} y2={PAD.top + plotH}
                  stroke="var(--chart-axis)" strokeWidth="1" strokeDasharray="3 3" />
          )}

          {series.map((s) => {
            const path = s.points.map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i)},${yAt(v)}`).join(' ')
            return (
              <g key={s.key}>
                {area && (
                  <path
                    d={`${path} L${xAt(s.points.length - 1)},${PAD.top + plotH} L${xAt(0)},${PAD.top + plotH} Z`}
                    fill={colors[s.key]} opacity="0.12"
                  />
                )}
                <path d={path} fill="none" stroke={colors[s.key]} strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" />
                {/* 호버 지점 표식 — 표면색 링을 둘러 겹쳐도 구분됩니다 */}
                {hover != null && s.points[hover] != null && (
                  <circle cx={xAt(hover)} cy={yAt(s.points[hover])} r="4"
                          fill={colors[s.key]} stroke="var(--color-bg-surface)" strokeWidth="2" />
                )}
              </g>
            )
          })}

          {/* x축 라벨 — 처음·중간·끝만. 전부 찍으면 겹칩니다 */}
          {[0, Math.floor(pointCount / 2), pointCount - 1].filter((i) => labels[i]).map((i) => (
            <text key={i} x={xAt(i)} y={H - 4}
                  textAnchor={i === 0 ? 'start' : i === pointCount - 1 ? 'end' : 'middle'}
                  className="fill-fg-tertiary text-micro">
              {labels[i]}
            </text>
          ))}
        </svg>

        {/* 툴팁 — 그 시점의 모든 계열을 한 번에 */}
        {hover != null && (
          <div
            role="tooltip"
            className="pointer-events-none absolute top-2 z-popover min-w-[140px] rounded-md border border-line-default bg-bg-raised px-2 py-1.5 shadow-lg"
            style={{
              left: `${(xAt(hover) / W) * 100}%`,
              transform: xAt(hover) > W / 2 ? 'translateX(calc(-100% - 8px))' : 'translateX(8px)',
            }}
          >
            <p className="mb-1 text-micro text-fg-tertiary">{labels[hover]}</p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center justify-between gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-fg-secondary">
                  <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: colors[s.key] }} />
                  {s.label}
                </span>
                <span className="tabular font-medium text-fg-primary">
                  {formatValue(s.points[hover] ?? 0)}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>

      {series.length >= 2 && (
        <ChartLegend series={series} colors={colors} direct={directLabels} />
      )}
    </div>
  )
}

/**
 * 범례. 계열이 2개 이상이면 항상 있습니다.
 * 색만으로 정체를 전달하지 않기 위한 최소 장치입니다.
 */
export function ChartLegend({ series = [], colors = {}, values, className }) {
  return (
    <ul className={cn('mt-2 flex flex-wrap items-center gap-x-4 gap-y-1', className)}>
      {series.map((s) => (
        <li key={s.key} className="inline-flex items-center gap-1.5 text-xs text-fg-secondary">
          <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: colors[s.key] }} />
          {s.label}
          {values?.[s.key] != null && (
            <span className="tabular font-medium text-fg-primary">{values[s.key]}</span>
          )}
        </li>
      ))}
    </ul>
  )
}
