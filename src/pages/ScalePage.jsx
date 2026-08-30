import { useMemo, useState } from 'react'
import {
  AppShell, PageContainer, PageHeader,
  Sidebar, SidebarGroup, SidebarItem, WorkspaceSwitcher,
  Topbar, Breadcrumb,
  DataGrid, GridCard, GridToolbar,
  QueryBar, Button, JobStatus, Banner, DensityToggle,
  normalizeFields, fieldMap, applyQuery, toggleSort, emptyQuery, useToast,
} from '../components'
import { NavIcons } from './_icons'
import { SidebarBrand } from './_brand'

/**
 * 화면 원형 4: 대용량 목록
 *
 * 관리도구는 언젠가 수천 건을 다룹니다. 그때 무너지지 않는 패턴을 보여줍니다:
 *
 *   가상화        보이는 행만 그립니다. 5,000행을 DOM 에 올리면 스크롤이 끊깁니다
 *   조건 전체 선택  화면에 보이는 50건만 선택된 상태를 드러냅니다
 *   진행률·부분 실패 오래 걸리는 작업의 상태와, 100건 중 실패한 3건이 무엇인지
 */

const SYSTEMS = ['payment', 'auth', 'reporting', 'ingest']
const LEVELS = [
  { value: 'error', label: '오류', status: 'failed' },
  { value: 'warn', label: '경고', status: 'warning' },
  { value: 'info', label: '정보', status: 'inProgress' },
]

const LOG_FIELDS = normalizeFields([
  { key: 'id', label: 'ID', type: 'text', editable: false, width: '96px' },
  { key: 'message', label: '메시지', type: 'text', editable: false },
  { key: 'level', label: '등급', type: 'select', width: '92px', editable: false, options: LEVELS },
  { key: 'system', label: '시스템', type: 'select', width: '100px', editable: false, options: [
      { value: 'payment', label: '결제' }, { value: 'auth', label: '인증' },
      { value: 'reporting', label: '리포트' }, { value: 'ingest', label: '수집' },
    ] },
  { key: 'count', label: '발생', type: 'number', width: '76px', editable: false },
  { key: 'at', label: '시각', type: 'date', width: '96px', editable: false },
])

/** 5,000건을 만듭니다. 실제 앱에서는 서버가 페이지 단위로 줍니다. */
function makeLogs(n = 5000) {
  const messages = [
    '결제 승인 응답 지연', '토큰 갱신 실패', '리포트 렌더링 타임아웃',
    '수집 배치 재시도', '외부 API 5xx', '캐시 무효화 실패',
    '권한 동기화 지연', '큐 적체 감지', '스키마 검증 경고',
  ]
  const now = Date.now()
  return Array.from({ length: n }, (_, i) => ({
    id: `LOG-${(100000 + i).toString()}`,
    message: `${messages[i % messages.length]} (#${i % 97})`,
    level: LEVELS[i % 7 === 0 ? 0 : i % 3 === 0 ? 1 : 2].value,
    system: SYSTEMS[i % SYSTEMS.length],
    count: ((i * 37) % 400) + 1,
    at: new Date(now - i * 61_000).toISOString(),
  }))
}

export function ScalePage() {
  const { toast } = useToast()
  const fields = LOG_FIELDS
  const fm = useMemo(() => fieldMap(fields), [fields])
  const [records] = useState(() => makeLogs(5000))

  const [query, setQuery] = useState(() => ({
    ...emptyQuery(), sort: [{ field: 'at', direction: 'desc' }],
  }))
  const [density, setDensity] = useState('compact')
  const [selected, setSelected] = useState(() => new Set())
  const [allMatching, setAllMatching] = useState(false)
  const [job, setJob] = useState(null)
  const [loaded, setLoaded] = useState(500)

  /* 조건에 맞는 전체 */
  const matching = useMemo(() => applyQuery(records, query, fm), [records, query, fm])
  /* 실제로 불러온 만큼만 그립니다 — 서버 페이지네이션·무한 스크롤과 같은 구조입니다.
     이래야 '화면에 있는 것'과 '조건에 맞는 것'이 갈라지고,
     전체 선택 안내가 의미를 갖습니다. */
  const visible = useMemo(() => matching.slice(0, loaded), [matching, loaded])

  /**
   * 오래 걸리는 벌크 작업을 흉내 냅니다.
   * 일부러 일부를 실패시켜 **부분 실패를 숨기지 않는** 패턴을 보여줍니다.
   */
  const runReprocess = () => {
    const targets = allMatching ? matching : visible.filter((r) => selected.has(r.id))
    const total = targets.length
    if (total === 0) return

    setJob({ title: '재처리', state: 'running', total, completed: 0, failures: [] })
    let completed = 0
    const failures = []

    const tick = () => {
      const batch = Math.max(1, Math.ceil(total / 20))
      for (let i = 0; i < batch && completed < total; i += 1) {
        const record = targets[completed]
        /* 결제 시스템 로그 중 일부가 실패하는 상황 */
        if (record.system === 'payment' && record.count % 11 === 0) {
          failures.push({ key: record.id, reason: '외부 결제 게이트웨이 응답 없음 (504)' })
        }
        completed += 1
      }
      setJob((prev) => prev && { ...prev, completed, failures: [...failures] })

      if (completed < total) {
        setTimeout(tick, 90)
      } else {
        const state = failures.length === 0 ? 'done' : 'partial'
        setJob((prev) => prev && { ...prev, state, completed, failures: [...failures] })
        setSelected(new Set())
        setAllMatching(false)
        toast({
          message: failures.length === 0
            ? `${total.toLocaleString('ko-KR')}건 재처리를 마쳤습니다`
            : `${(total - failures.length).toLocaleString('ko-KR')}건 성공 · ${failures.length}건 실패`,
          tone: failures.length === 0 ? 'success' : 'warning',
        })
      }
    }
    setTimeout(tick, 200)
  }

  return (
    <AppShell
      sidebar={
        <Sidebar header={<SidebarBrand />}>
          <SidebarGroup label="분석">
            <SidebarItem icon={<NavIcons.Dashboard />} label="대시보드" />
          </SidebarGroup>
          <SidebarGroup label="운영">
            <SidebarItem icon={<NavIcons.List />} label="요청" />
            <SidebarItem icon={<NavIcons.Chart />} label="이벤트 로그" active badge="5K" />
          </SidebarGroup>
        </Sidebar>
      }
      topbar={<Topbar breadcrumb={
        <Breadcrumb items={[{ label: 'HCT 운영', href: '#' }, { label: '이벤트 로그' }]} />
      } />}
    >
      <PageContainer>
        <PageHeader
          title="이벤트 로그"
          description="5,000건을 가상화로 렌더링합니다. 스크롤해도 보이는 행만 그려집니다."
        />

        <Banner tone="info" className="mb-3">
          가상화된 목록은 화면 밖 행이 DOM 에 없어 브라우저 검색(⌘F)에 잡히지 않습니다.
          그래서 목록 자체의 검색이 반드시 있어야 합니다.
        </Banner>

        {job && (
          <JobStatus
            className="mb-3"
            title={job.title}
            state={job.state}
            total={job.total}
            completed={job.completed}
            failures={job.failures}
            onDismiss={() => setJob(null)}
            onRetryFailed={() => toast({ message: '실패한 항목을 다시 큐에 넣었습니다' })}
          />
        )}

        <GridCard>
          <div className="border-b border-line-subtle px-3 py-2">
            <QueryBar
              fields={fields}
              query={query}
              onChange={(next) => { setQuery(next); setSelected(new Set()); setAllMatching(false); setLoaded(500) }}
              resultCount={matching.length}
            />
          </div>

          <GridToolbar
            left={<span className="tabular text-xs text-fg-tertiary">
              조건에 맞는 {matching.length.toLocaleString('ko-KR')}건 중 {visible.length.toLocaleString('ko-KR')}건 불러옴
            </span>}
            right={<DensityToggle value={density} onChange={setDensity} />}
          />

          <DataGrid
            fields={fields}
            visibleFields={['id', 'message', 'level', 'system', 'count', 'at']}
            primaryField="message"
            records={visible}
            density={density}
            virtualize
            maxHeight={520}
            sort={query.sort}
            onToggleSort={(k) => setQuery(toggleSort(query, k))}
            selectedKeys={selected}
            onSelectedKeysChange={(next) => { setSelected(next); setAllMatching(false) }}
            matchingCount={matching.length}
            allMatchingSelected={allMatching}
            onSelectAllMatching={() => {
              setAllMatching(true)
              setSelected(new Set(matching.map((r) => r.id)))
            }}
            searchQuery={query.search}
            onClearFilters={() => setQuery(emptyQuery())}
            bulkActions={
              <Button size="xs" variant="secondary" onClick={runReprocess}>재처리</Button>
            }
          />

          {/* 점진 로딩 — 남은 건수를 밝히는 게 핵심입니다.
              '더 보기'만 있으면 얼마나 더 남았는지 알 수 없습니다. */}
          {visible.length < matching.length && (
            <div className="flex items-center justify-center gap-3 border-t border-line-subtle px-3 py-2.5">
              <span className="tabular text-xs text-fg-tertiary">
                {(matching.length - visible.length).toLocaleString('ko-KR')}건 더 있습니다
              </span>
              <Button size="sm" variant="secondary"
                      onClick={() => setLoaded((n) => Math.min(matching.length, n + 500))}>
                500건 더 불러오기
              </Button>
            </div>
          )}
        </GridCard>
      </PageContainer>
    </AppShell>
  )
}
