import { useState } from 'react'
import {
  AppShell, PageContainer, PageHeader,
  Sidebar, SidebarGroup, SidebarItem, WorkspaceSwitcher,
  Topbar, Breadcrumb, TopbarIconButton,
  StatCard, StatGrid, ChartFrame, LegendItem,
  DataTable, TableCard, TableToolbar,
  StatusBadge, Button, SegmentedControl,
  CommandPalette, CommandPaletteTrigger,
} from '../components'
import { NavIcons } from './_icons'

/**
 * 페이지 원형 1: 대시보드 개요
 *
 * 이 파일은 "복사해서 시작하는" 참조 구현입니다.
 * 구조(셸 → PageHeader → KPI → 차트 → 최근 항목 테이블)를 유지하면
 * 다른 에이전트가 만든 대시보드와 자연스럽게 통일됩니다.
 */
/** 상태별 막대 색 — StatusBadge 의 색조와 일치시킵니다 */
const BAR_TONE = {
  done: 'bg-success-solid',
  inProgress: 'bg-info-solid',
  blocked: 'bg-danger-solid',
  todo: 'bg-muted-solid',
  inReview: 'bg-review-solid',
}

export function DashboardPage() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [range, setRange] = useState('7d')
  const [collapsed, setCollapsed] = useState(false)

  const commands = [
    { id: 'nav-dash', group: '이동', label: '대시보드', icon: <NavIcons.Dashboard />, onSelect: () => {} },
    { id: 'nav-jobs', group: '이동', label: '작업 목록', icon: <NavIcons.List />, onSelect: () => {} },
    { id: 'act-new', group: '작업', label: '새 작업 만들기', hint: 'C', icon: <NavIcons.Plus />, onSelect: () => {} },
    { id: 'act-export', group: '작업', label: '데이터 내보내기', icon: <NavIcons.Download />, onSelect: () => {} },
  ]

  return (
    <>
      <AppShell
        sidebarCollapsed={collapsed}
        onSidebarCollapsedChange={setCollapsed}
        sidebar={
          <Sidebar
            collapsed={collapsed}
            header={<WorkspaceSwitcher name="HCT 운영" subtitle="프로덕션" collapsed={collapsed} />}
          >
            <SidebarGroup label="분석" collapsed={collapsed}>
              <SidebarItem icon={<NavIcons.Dashboard />} label="대시보드" active collapsed={collapsed} />
              <SidebarItem icon={<NavIcons.Chart />} label="리포트" collapsed={collapsed} />
            </SidebarGroup>
            <SidebarGroup label="운영" collapsed={collapsed}>
              <SidebarItem icon={<NavIcons.List />} label="작업" badge={12} collapsed={collapsed} />
              <SidebarItem icon={<NavIcons.Alert />} label="알림" badge={3} collapsed={collapsed} />
              <SidebarItem icon={<NavIcons.Users />} label="사용자" collapsed={collapsed} />
            </SidebarGroup>
            <SidebarGroup label="설정" collapsed={collapsed}>
              <SidebarItem icon={<NavIcons.Settings />} label="환경설정" collapsed={collapsed} />
            </SidebarGroup>
          </Sidebar>
        }
        topbar={
          <Topbar
            breadcrumb={<Breadcrumb items={[{ label: 'HCT 운영', href: '#' }, { label: '대시보드' }]} />}
            search={<CommandPaletteTrigger onClick={() => setPaletteOpen(true)} />}
            actions={
              <>
                <TopbarIconButton icon={<NavIcons.Alert />} label="알림" badge />
                <TopbarIconButton icon={<NavIcons.Settings />} label="설정" />
              </>
            }
          />
        }
      >
        <PageContainer>
          <PageHeader
            title="운영 대시보드"
            description="최근 처리 현황과 이상 징후를 한눈에 봅니다."
            actions={
              <>
                <SegmentedControl
                  size="sm"
                  value={range}
                  onChange={setRange}
                  options={[
                    { value: '24h', label: '24시간' },
                    { value: '7d', label: '7일' },
                    { value: '30d', label: '30일' },
                  ]}
                />
                <Button variant="primary" size="md">리포트 생성</Button>
              </>
            }
          />

          {/* KPI — 한 줄에 4개가 상한입니다 */}
          <StatGrid columns={4} className="mb-4">
            <StatCard label="총 처리 건수" value="128,430" delta={12.4} deltaLabel="지난주 대비" />
            <StatCard label="평균 처리 시간" value="1.8" unit="초" delta={-6.2} deltaLabel="지난주 대비" invertDelta />
            <StatCard label="오류율" value="0.42" unit="%" delta={1.8} deltaLabel="지난주 대비" invertDelta />
            <StatCard label="활성 사용자" value="1,204" delta={0} deltaLabel="변동 없음" />
          </StatGrid>

          {/* 차트 — 실제 차트 라이브러리는 children 으로 넣습니다 */}
          <div className="mb-4 grid gap-3 lg:grid-cols-3">
            <ChartFrame
              className="lg:col-span-2"
              title="시간대별 처리량"
              description="10분 단위 집계"
              height={240}
              legend={
                <>
                  <LegendItem color="var(--color-accent-solid)" label="성공" value="127,891" />
                  <LegendItem color="var(--color-danger-solid)" label="실패" value="539" />
                </>
              }
            >
              {/* 차트 라이브러리 렌더링 위치.
                  색상은 반드시 CSS 변수에서 읽으세요 — 하드코딩 시 다크 모드가 깨집니다. */}
              <div className="flex h-[240px] items-end gap-1">
                {[42, 55, 48, 71, 66, 80, 74, 92, 88, 76, 61, 58].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-accent-solid" style={{ height: `${h}%` }} />
                ))}
              </div>
            </ChartFrame>

            <ChartFrame title="상태 분포" height={240}>
              <div className="space-y-3 pt-2">
                {[
                  { status: 'done', label: '완료', value: 812, pct: 78 },
                  { status: 'inProgress', label: '진행중', value: 143, pct: 14 },
                  { status: 'blocked', label: '차단됨', value: 52, pct: 5 },
                  { status: 'todo', label: '대기', value: 31, pct: 3 },
                ].map((row) => (
                  <div key={row.status}>
                    <div className="mb-1 flex items-center justify-between">
                      <StatusBadge status={row.status} dot size="sm" />
                      <span className="text-xs tabular text-fg-secondary">{row.value}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-bg-sunken">
                      {/* 막대 색은 뱃지와 같은 상태 색을 씁니다.
                          같은 행에서 뱃지는 초록인데 막대는 파랑이면 사용자가 둘을 다른 정보로 읽습니다. */}
                      <div className={`h-full rounded-full ${BAR_TONE[row.status]}`} style={{ width: `${row.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </ChartFrame>
          </div>

          {/* 최근 항목 — 대시보드는 항상 "다음 행동"으로 이어져야 합니다 */}
          <TableCard>
            <TableToolbar
              left={<h2 className="text-base font-semibold text-fg-primary">최근 실패 작업</h2>}
              right={<Button size="sm" variant="ghost">전체 보기</Button>}
            />
            <DataTable
              density="compact"
              columns={[
                { key: 'id', header: 'ID', width: '110px' },
                { key: 'name', header: '작업명' },
                {
                  key: 'status', header: '상태', width: '100px',
                  render: (r) => <StatusBadge status={r.status} dot size="sm" />,
                },
                { key: 'duration', header: '소요', width: '80px', align: 'right' },
                { key: 'at', header: '시각', width: '130px', align: 'right' },
              ]}
              rows={[
                { id: 'JOB-4821', name: '일일 집계 배치', status: 'failed', duration: '12.4s', at: '10:24:11' },
                { id: 'JOB-4818', name: '외부 API 동기화', status: 'blocked', duration: '30.0s', at: '10:18:02' },
                { id: 'JOB-4802', name: '리포트 렌더링', status: 'failed', duration: '3.1s', at: '09:55:47' },
              ]}
            />
          </TableCard>
        </PageContainer>
      </AppShell>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} commands={commands} />
    </>
  )
}
