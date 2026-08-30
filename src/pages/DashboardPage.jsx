import { useMemo, useState } from 'react'
import {
  PageContainer, PageHeader,
  DataGrid, GridCard, GridToolbar,
  Button, SegmentedControl, Banner,
  CommandPalette, CommandPaletteTrigger,
  fieldMap, emptyQuery,
} from '../components'
import { MetricTile, BreakdownList, Widget } from '../components/dashboard/MetricTile'
import { LineChart } from '../components/chart/LineChart'
import { BarChart, ChartTable } from '../components/chart/BarChart'
import { assignSeriesColors, STATUS_CHART_COLOR } from '../components/chart/chartTokens'
import { computeMetric, compareMetric, breakdownMetric, timeSeries } from '../lib/metrics'
import { REQUEST_FIELDS, REQUEST_RECORDS } from './_data'
import { NavIcons } from './_icons'
import { AppFrame } from './_shell'

/**
 * 화면 원형: 운영 대시보드
 *
 * 흔한 대시보드와의 차이는 **모든 숫자가 살아있는 질의**라는 점입니다.
 *
 *   지표 = 질의 + 집계   → 클릭하면 그 숫자를 만든 레코드 목록으로 들어갑니다
 *   분해                → 차원별로 쪼개고, 각 조각이 다시 자기 질의를 들고 있습니다
 *   임계값               → 지표가 자기 건강 범위를 알고 색으로 알립니다
 *   기간 비교            → 증감률만이 아니라 비교 대상 값을 함께 밝힙니다
 *
 * 그래서 이 대시보드는 보기만 하는 화면이 아니라 **작업의 입구**입니다.
 * "차단 3건"을 보고 바로 그 3건의 목록으로 들어가 처리를 시작할 수 있습니다.
 *
 * @param {object} props
 * @param {(query: object) => void} [props.onDrillDown] - 목록 화면으로 질의를 넘깁니다
 */
export function DashboardPage({ onDrillDown, onNavigate }) {
  const fields = REQUEST_FIELDS
  const fm = useMemo(() => fieldMap(fields), [fields])
  const records = REQUEST_RECORDS

  const [range, setRange] = useState('24h')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [breakdownDim, setBreakdownDim] = useState('system')
  const [showTable, setShowTable] = useState(false)

  /* 비교 기준 — 실제 앱에서는 이전 기간 데이터를 서버에서 받습니다.
     여기서는 원형을 보여주기 위해 일부를 이전 기간으로 간주합니다. */
  const previousRecords = useMemo(() => records.slice(2), [records])

  /**
   * 지표 정의 — 숫자가 아니라 질의입니다.
   * 이 정의 하나가 값·건수·드릴다운·분해를 전부 만들어냅니다.
   */
  const metrics = useMemo(() => [
    {
      id: 'open', label: '미해결 요청', unit: '건',
      query: { ...emptyQuery(), conditions: [{ field: 'status', operator: 'notIn', value: ['done'] }] },
      aggregate: 'count', lowerIsBetter: true,
      threshold: { warn: 18, danger: 24 },
    },
    {
      id: 'blocked', label: '차단됨', unit: '건',
      query: { ...emptyQuery(), conditions: [{ field: 'status', operator: 'in', value: ['blocked'] }] },
      aggregate: 'count', lowerIsBetter: true,
      threshold: { warn: 3, danger: 5 },
    },
    {
      id: 'errors', label: '오류 총계', unit: '건',
      query: { ...emptyQuery(), conditions: [{ field: 'errors', operator: 'gt', value: 0 }] },
      aggregate: 'sum', field: 'errors', lowerIsBetter: true,
      threshold: { warn: 800, danger: 1200 },
    },
    {
      id: 'urgent', label: '긴급 우선순위', unit: '건',
      query: { ...emptyQuery(), conditions: [{ field: 'priority', operator: 'in', value: ['urgent'] }] },
      aggregate: 'count', lowerIsBetter: true,
      threshold: { warn: 3, danger: 5 },
    },
  ], [])

  const computed = useMemo(
    () => metrics.map((m) => {
      const c = computeMetric(m, records, fm)
      const cmp = compareMetric(c.value, previousRecords, m, fm)
      return { ...c, ...cmp, series: timeSeries(c.matched, 'updatedAt', 10, 48 * 3600 * 1000) }
    }),
    [metrics, records, previousRecords, fm],
  )

  const attention = computed.filter((m) => m.state !== 'ok')

  /* 분해 대상 지표 — 오류를 차원별로 쪼갭니다 */
  const errorMetric = metrics.find((m) => m.id === 'errors')
  const breakdown = useMemo(
    () => breakdownMetric(errorMetric, records, fm, breakdownDim),
    [errorMetric, records, fm, breakdownDim],
  )

  const statusBreakdown = useMemo(
    () => breakdownMetric({ ...emptyQuery(), query: emptyQuery() }, records, fm, 'status'),
    [records, fm],
  )

  /**
   * 시스템별 오류 추이 — 시간당 발생 건수.
   *
   * 레코드의 누적 오류수를 '마지막 수정 시각' 버킷에 합산하면 안 됩니다.
   * 그 값은 어느 한 시점에 생긴 게 아니라 누적치라, 마지막 버킷에만 몰려
   * 차트가 아무것도 말해주지 않게 됩니다. 시계열은 **사건 단위**여야 합니다.
   * (실제 앱에서는 서버가 시간별 집계를 내려줍니다.)
   */
  const trend = useMemo(() => {
    const buckets = 24
    const now = Date.now()
    const systems = fm.system.options
    /* 시스템별 총 오류를 시간축에 분포시킵니다 — 최근일수록 많은 형태 */
    const totals = Object.fromEntries(systems.map((o) => [
      o.value, records.filter((r) => r.system === o.value).reduce((n, r) => n + r.errors, 0),
    ]))
    const series = systems.map((o, si) => {
      const total = totals[o.value]
      const raw = Array.from({ length: buckets }, (_, i) => {
        const t = i / (buckets - 1)
        /* 시스템마다 다른 모양: 완만한 증가 + 주기적 변동 */
        const base = 0.4 + 0.6 * t
        const wave = 1 + 0.45 * Math.sin(t * Math.PI * (2 + si) + si * 1.7)
        return Math.max(0, base * wave)
      })
      const sum = raw.reduce((a, b) => a + b, 0) || 1
      return { key: o.value, label: o.label, points: raw.map((v) => Math.round((v / sum) * total)) }
    })
    const labels = Array.from({ length: buckets }, (_, i) => {
      const d = new Date(now - (buckets - 1 - i) * 3600 * 1000)
      return `${String(d.getHours()).padStart(2, '0')}시`
    })
    return { series, labels }
  }, [records, fm])

  /* 시스템 × 상태 누적 막대 — 상태를 그리므로 계열 색이 아니라 상태 색을 씁니다 */
  const stackData = useMemo(() => {
    const statuses = fm.status.options
    return fm.system.options.map((sys) => ({
      label: sys.label,
      values: Object.fromEntries(statuses.map((st) => [
        st.value,
        records.filter((r) => r.system === sys.value && r.status === st.value).length,
      ])),
    }))
  }, [records, fm])

  const statusSeries = fm.status.options.map((o) => ({ key: o.value, label: o.label }))
  const statusColors = Object.fromEntries(
    fm.status.options.map((o) => [o.value, STATUS_CHART_COLOR[o.status] ?? 'var(--color-neutral-solid)']),
  )

  /* 최근 조치가 필요한 항목 — 대시보드는 항상 다음 행동으로 이어져야 합니다 */
  const needsAction = useMemo(
    () => records
      .filter((r) => r.status === 'blocked' || r.priority === 'urgent')
      .sort((a, b) => b.errors - a.errors)
      .slice(0, 5),
    [records],
  )

  const commands = [
    { id: 'nav-list', group: '이동', label: '요청 목록', icon: <NavIcons.List />, onSelect: () => onDrillDown?.(emptyQuery()) },
    { id: 'act-blocked', group: '작업', label: '차단된 요청만 보기', icon: <NavIcons.Filter />,
      onSelect: () => onDrillDown?.({ ...emptyQuery(), conditions: [{ field: 'status', operator: 'in', value: ['blocked'] }] }) },
  ]

  return (
    <>
      <AppFrame
        active="dashboard"
        onNavigate={onNavigate}
        counts={{ list: records.length, inbox: attention.length || undefined }}
        topbarSearch={<CommandPaletteTrigger onClick={() => setPaletteOpen(true)} />}
      >
        <PageContainer>
          <PageHeader
            title="운영 대시보드"
            description="모든 숫자를 클릭하면 해당 조건의 요청 목록으로 이동합니다."
            actions={
              <>
                <SegmentedControl
                  size="sm" value={range} onChange={setRange}
                  options={[
                    { value: '24h', label: '24시간' },
                    { value: '7d', label: '7일' },
                    { value: '30d', label: '30일' },
                  ]}
                />
                <Button variant="secondary" size="md">리포트 생성</Button>
              </>
            }
          />

          {/* 임계값을 넘긴 지표가 있으면 맨 위에서 알리고, 바로 그리로 데려갑니다 */}
          {attention.length > 0 && (
            <Banner
              tone={attention.some((m) => m.state === 'danger') ? 'danger' : 'warning'}
              title={`지표 ${attention.length}개가 임계값을 넘었습니다`}
              className="mb-3"
              action={
                <Button size="sm" variant="secondary" onClick={() => onDrillDown?.(attention[0].query)}>
                  {attention[0].label} 확인
                </Button>
              }
            >
              {attention.map((m) => `${m.label} ${m.value.toLocaleString('ko-KR')}${m.unit ?? ''}`).join(' · ')}
            </Banner>
          )}

          {/* 지표 타일 — 각각이 질의입니다 */}
          <div className="mb-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {computed.map((m) => (
              <MetricTile
                key={m.id}
                label={m.label}
                value={m.value}
                unit={m.unit}
                count={m.count}
                delta={m.delta}
                previous={m.previous}
                compareLabel="이전 기간"
                lowerIsBetter={m.lowerIsBetter}
                state={m.state}
                threshold={m.threshold}
                series={m.series}
                onDrillDown={() => onDrillDown?.(m.query)}
              />
            ))}
          </div>

          {/* 시계열 — 단위가 같은 계열만 한 축에 겹칩니다. 이중 축은 쓰지 않습니다. */}
          <Widget
            className="mb-2.5"
            title="시스템별 오류 추이"
            description="최근 24시간. 선에 마우스를 올리면 그 시점의 모든 시스템 값을 함께 봅니다."
          >
            <LineChart series={trend.series} labels={trend.labels} height={200} area />
          </Widget>

          <div className="mb-2.5 grid gap-2.5 lg:grid-cols-2">
            <Widget
              title="시스템 × 상태"
              description="누적 막대. 상태를 그리므로 계열 색이 아니라 상태 색을 씁니다."
              actions={
                <button
                  type="button"
                  onClick={() => setShowTable((v) => !v)}
                  className="h-control-sm rounded-md border border-line-default bg-bg-surface px-2 text-xs font-medium text-fg-secondary hover:bg-bg-hover"
                >
                  {showTable ? '차트 보기' : '표 보기'}
                </button>
              }
            >
              {showTable ? (
                <ChartTable series={statusSeries} data={stackData} />
              ) : (
                <BarChart series={statusSeries} data={stackData} stacked
                          colorByKey={statusColors} height={200} />
              )}
            </Widget>

            <Widget title="시스템별 요청 수" description="값이 하나뿐이라 범례 대신 막대 위에 직접 표시합니다.">
              <BarChart
                series={[{ key: 'n', label: '요청 수' }]}
                data={fm.system.options.map((o) => ({
                  label: o.label,
                  values: { n: records.filter((r) => r.system === o.value).length },
                }))}
                showValues
                height={200}
              />
            </Widget>
          </div>

          <div className="mb-3 grid gap-2.5 lg:grid-cols-3">
            {/* 분해 — 차원을 바꿔가며 원인을 좁힙니다 */}
            <Widget
              className="lg:col-span-2"
              title="오류 분해"
              description="차원을 바꿔 원인을 좁히세요. 항목을 클릭하면 해당 조건의 목록으로 이동합니다."
              actions={
                <SegmentedControl
                  size="sm"
                  value={breakdownDim}
                  onChange={setBreakdownDim}
                  options={[
                    { value: 'system', label: '시스템' },
                    { value: 'owner', label: '담당자' },
                    { value: 'priority', label: '우선순위' },
                  ]}
                />
              }
            >
              <BreakdownList
                items={breakdown}
                onDrillDown={(item) => onDrillDown?.(item.query)}
                emptyMessage="오류가 있는 요청이 없습니다"
              />
            </Widget>

            <Widget title="상태 분포" description="클릭해서 해당 상태만 보기">
              <BreakdownList
                items={statusBreakdown}
                onDrillDown={(item) => onDrillDown?.(item.query)}
              />
            </Widget>
          </div>

          {/* 조치 필요 — 대시보드의 끝은 항상 행동입니다 */}
          <GridCard>
            <GridToolbar
              left={
                <>
                  <h2 className="text-base font-semibold text-fg-primary">조치가 필요한 요청</h2>
                  <span className="tabular text-xs text-fg-tertiary">{needsAction.length}건</span>
                </>
              }
              right={
                <Button size="sm" variant="ghost" onClick={() => onDrillDown?.({
                  ...emptyQuery(), match: 'any',
                  conditions: [
                    { field: 'status', operator: 'in', value: ['blocked'] },
                    { field: 'priority', operator: 'in', value: ['urgent'] },
                  ],
                })}>
                  목록에서 열기
                </Button>
              }
            />
            <DataGrid
              fields={fields}
              visibleFields={['id', 'title', 'status', 'priority', 'owner', 'errors', 'updatedAt']}
              primaryField="title"
              records={needsAction}
              density="compact"
              selectable={false}
              onRowClick={(r) => onDrillDown?.({
                ...emptyQuery(), search: r.id,
              })}
            />
          </GridCard>
        </PageContainer>
      </AppFrame>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} commands={commands} />
    </>
  )
}
