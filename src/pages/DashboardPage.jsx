import { useMemo, useState } from 'react'
import {
  AppShell, PageContainer, PageHeader,
  Sidebar, SidebarGroup, SidebarItem, WorkspaceSwitcher,
  Topbar, Breadcrumb, TopbarIconButton,
  DataGrid, GridCard, GridToolbar,
  Button, SegmentedControl, Banner,
  CommandPalette, CommandPaletteTrigger,
  fieldMap, emptyQuery,
} from '../components'
import { MetricTile, BreakdownList, Widget, Sparkline } from '../components/dashboard/MetricTile'
import { computeMetric, compareMetric, breakdownMetric, timeSeries } from '../lib/metrics'
import { REQUEST_FIELDS, REQUEST_RECORDS } from './_data'
import { NavIcons } from './_icons'

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
export function DashboardPage({ onDrillDown }) {
  const fields = REQUEST_FIELDS
  const fm = useMemo(() => fieldMap(fields), [fields])
  const records = REQUEST_RECORDS

  const [range, setRange] = useState('24h')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [breakdownDim, setBreakdownDim] = useState('system')

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
      <AppShell
        sidebar={
          <Sidebar header={<WorkspaceSwitcher name="HCT 운영" subtitle="프로덕션" />}>
            <SidebarGroup label="분석">
              <SidebarItem icon={<NavIcons.Dashboard />} label="대시보드" active />
              <SidebarItem icon={<NavIcons.Chart />} label="리포트" />
            </SidebarGroup>
            <SidebarGroup label="운영">
              <SidebarItem icon={<NavIcons.List />} label="요청" badge={records.length} />
              <SidebarItem icon={<NavIcons.Alert />} label="알림" badge={attention.length || undefined} />
            </SidebarGroup>
          </Sidebar>
        }
        topbar={
          <Topbar
            breadcrumb={<Breadcrumb items={[{ label: 'HCT 운영', href: '#' }, { label: '대시보드' }]} />}
            search={<CommandPaletteTrigger onClick={() => setPaletteOpen(true)} />}
            actions={<TopbarIconButton icon={<NavIcons.Alert />} label="알림" badge={attention.length > 0} />}
          />
        }
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
      </AppShell>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} commands={commands} />
    </>
  )
}
