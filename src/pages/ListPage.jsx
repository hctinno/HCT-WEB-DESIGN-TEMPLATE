import { useMemo, useState } from 'react'
import {
  AppShell, PageContainer, PageHeader,
  Sidebar, SidebarGroup, SidebarItem, WorkspaceSwitcher,
  Topbar, Breadcrumb,
  RightPanel, PropertyList, PropertyRow, PanelSection,
  DataTable, TableCard, TableToolbar, TablePagination,
  FilterBar, FilterButton, SearchInput, DensityToggle,
  StatusBadge, Button, ConfirmDialog, Banner,
} from '../components'
import { NavIcons } from './_icons'

/**
 * 페이지 원형 2: 목록 + 상세 패널
 *
 * 관리도구에서 가장 흔한 화면입니다. 지라 이슈 목록과 같은 구조로,
 * 행을 클릭하면 우측 패널이 열려 맥락을 잃지 않습니다.
 *
 * 이 원형이 보여주는 필수 요소:
 *   - 필터 상태가 눈에 보임 + 초기화 수단
 *   - 총 건수 표시
 *   - 행 선택 ↔ 우측 패널 연동
 *   - 파괴적 동작의 확인 대화상자
 *   - 밀도 전환
 */

const ROWS = [
  { id: 'REQ-1042', title: '결제 승인 지연 조사', owner: '김민수', status: 'inProgress', priority: '높음', updated: '10분 전' },
  { id: 'REQ-1041', title: '대시보드 응답 속도 개선', owner: '이서연', status: 'inReview', priority: '보통', updated: '32분 전' },
  { id: 'REQ-1039', title: '외부 연동 인증서 만료', owner: '박지훈', status: 'blocked', priority: '긴급', updated: '1시간 전' },
  { id: 'REQ-1035', title: '월간 리포트 자동화', owner: '최유진', status: 'done', priority: '낮음', updated: '어제' },
  { id: 'REQ-1031', title: '사용자 권한 정책 정리', owner: '정하늘', status: 'todo', priority: '보통', updated: '2일 전' },
]

export function ListPage() {
  const [selected, setSelected] = useState(null)
  const [density, setDensity] = useState('default')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState(null)
  const [page, setPage] = useState(1)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const activeFilters = useMemo(() => {
    const list = []
    if (statusFilter) list.push({ key: 'status', label: '상태', value: statusFilter })
    if (query) list.push({ key: 'query', label: '검색', value: query })
    return list
  }, [statusFilter, query])

  const rows = useMemo(() => {
    return ROWS.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false
      if (query && !r.title.includes(query) && !r.id.includes(query)) return false
      return true
    })
  }, [statusFilter, query])

  const clearFilters = () => { setStatusFilter(null); setQuery('') }

  return (
    <>
      <AppShell
        sidebar={
          <Sidebar header={<WorkspaceSwitcher name="HCT 운영" subtitle="프로덕션" />}>
            <SidebarGroup label="분석">
              <SidebarItem icon={<NavIcons.Dashboard />} label="대시보드" />
            </SidebarGroup>
            <SidebarGroup label="운영">
              <SidebarItem icon={<NavIcons.List />} label="요청" active badge={rows.length} />
              <SidebarItem icon={<NavIcons.Alert />} label="알림" badge={3} />
            </SidebarGroup>
          </Sidebar>
        }
        topbar={
          <Topbar breadcrumb={<Breadcrumb items={[{ label: 'HCT 운영', href: '#' }, { label: '요청' }]} />} />
        }
        rightPanel={
          selected && (
            <RightPanel
              title={selected.title}
              subtitle={selected.id}
              onClose={() => setSelected(null)}
              footer={
                <div className="flex justify-end gap-2">
                  <Button variant="danger-subtle" size="sm" onClick={() => setConfirmOpen(true)}>
                    삭제
                  </Button>
                  <Button variant="primary" size="sm">저장</Button>
                </div>
              }
            >
              <PanelSection title="세부 정보">
                <PropertyList>
                  <PropertyRow label="상태"><StatusBadge status={selected.status} dot /></PropertyRow>
                  <PropertyRow label="담당자">{selected.owner}</PropertyRow>
                  <PropertyRow label="우선순위">{selected.priority}</PropertyRow>
                  <PropertyRow label="최근 수정">{selected.updated}</PropertyRow>
                </PropertyList>
              </PanelSection>

              <PanelSection title="설명">
                <p className="text-sm leading-5 text-fg-secondary">
                  이 영역은 상세 본문입니다. 목록에서 항목을 선택했을 때, 페이지를 떠나지 않고
                  맥락을 유지한 채 내용을 확인·수정할 수 있습니다.
                </p>
              </PanelSection>
            </RightPanel>
          )
        }
      >
        <PageContainer>
          <PageHeader
            title="요청"
            description="처리 대기 중인 운영 요청 목록입니다."
            actions={<Button variant="primary">새 요청</Button>}
          />

          {rows.some((r) => r.status === 'blocked') && (
            <Banner tone="warning" title="차단된 요청이 있습니다" className="mb-4">
              담당자 확인이 필요한 항목이 포함되어 있습니다.
            </Banner>
          )}

          <FilterBar
            className="mb-3"
            activeFilters={activeFilters}
            onRemoveFilter={(key) => (key === 'status' ? setStatusFilter(null) : setQuery(''))}
            onClearAll={clearFilters}
          >
            <SearchInput
              size="md"
              className="w-[240px]"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              placeholder="ID 또는 제목 검색"
            />
            <FilterButton
              label="상태"
              value={statusFilter ? '1개' : undefined}
              active={!!statusFilter}
              onClick={() => setStatusFilter(statusFilter ? null : 'blocked')}
            />
            <FilterButton label="담당자" />
            <FilterButton label="우선순위" />
            <div className="ml-auto"><DensityToggle value={density} onChange={setDensity} /></div>
          </FilterBar>

          <TableCard>
            <TableToolbar
              left={<span className="text-xs text-fg-tertiary tabular">{rows.length}건</span>}
              right={<Button size="sm" variant="ghost" iconLeft={<NavIcons.Download />}>내보내기</Button>}
            />
            <DataTable
              density={density}
              rows={rows}
              searchQuery={query}
              onClearFilters={clearFilters}
              selectedKey={selected?.id}
              onRowClick={setSelected}
              columns={[
                { key: 'id', header: 'ID', width: '104px' },
                { key: 'title', header: '제목', sortable: true },
                { key: 'owner', header: '담당자', width: '92px' },
                {
                  key: 'status', header: '상태', width: '96px',
                  render: (r) => <StatusBadge status={r.status} dot size="sm" />,
                },
                { key: 'priority', header: '우선순위', width: '88px' },
                { key: 'updated', header: '수정', width: '92px', align: 'right', sortable: true },
              ]}
            />
            <TablePagination page={page} pageSize={20} total={rows.length} onPageChange={setPage} />
          </TableCard>
        </PageContainer>
      </AppShell>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => setConfirmOpen(false)}
        tone="danger"
        title="요청을 삭제할까요?"
        description="삭제한 요청은 복구할 수 없습니다."
        confirmLabel="삭제"
      />
    </>
  )
}
