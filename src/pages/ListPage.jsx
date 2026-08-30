import { useMemo, useState } from 'react'
import {
  AppShell, PageContainer, PageHeader,
  Sidebar, SidebarGroup, SidebarItem, WorkspaceSwitcher, SavedViewList,
  Topbar, Breadcrumb,
  DataGrid, GridCard, GridToolbar, GridPagination,
  BoardView, ViewTabs, ViewSwitcher, GroupByPicker,
  QueryBar,
  ObjectDetail,
  RightPanel,
  Button, IconButton, DensityToggle, ConfirmDialog, Banner,
  ColumnSettings, ShortcutHelp, useToast,
  fieldMap, applyQuery, toggleSort, useRecords, emptyQuery, useQuerySync,
} from '../components'
import { REQUEST_FIELDS, REQUEST_RECORDS, INITIAL_VIEWS } from './_data'
import { NavIcons } from './_icons'

/**
 * 화면 원형: 목록 + 상세 (지라 이슈 목록에 해당)
 *
 * 이 한 화면이 보여주는 것 — 전부 같은 데이터셋 위에서 동작합니다:
 *
 *   저장된 뷰      뷰 탭과 사이드바가 사용자가 만든 질의에서 나옵니다
 *   뷰 전환        표 ↔ 보드. 같은 레코드의 다른 투영입니다
 *   질의           필터를 쌓고, 텍스트로 읽고, 뷰로 저장합니다
 *   인라인 편집     셀을 클릭하면 그 자리에서 고쳐집니다
 *   보드 드래그     카드를 옮기면 상태가 바뀌고 표에도 반영됩니다
 *   다중 선택      Shift 범위 선택 + 벌크 액션
 *   호버 액션      평소엔 숨어 있다가 행 위에서만 나타납니다
 *   활동 기록      편집이 자동으로 이력에 남습니다
 *
 * **복사해서 시작하되, 구조는 유지하세요.** 이 배치가 통일성의 기준입니다.
 */
export function ListPage({ initialQuery }) {
  const fields = REQUEST_FIELDS
  const fm = useMemo(() => fieldMap(fields), [fields])

  const { records, editRecord, bulkEdit, removeRecords, addComment, activityOf } =
    useRecords(REQUEST_RECORDS, { actor: '김민수' })

  const [views, setViews] = useState(INITIAL_VIEWS)
  const [activeViewId, setActiveViewId] = useState('all')
  const activeView = views.find((v) => v.id === activeViewId) ?? views[0]

  const [query, setQuery] = useState(initialQuery ?? activeView.query)
  const [viewType, setViewType] = useState(activeView.viewType)
  const [density, setDensity] = useState('default')
  const [selected, setSelected] = useState(() => new Set())
  const [detailKey, setDetailKey] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [page, setPage] = useState(1)
  const [helpOpen, setHelpOpen] = useState(false)
  const [columns, setColumns] = useState(
    ['id', 'title', 'status', 'priority', 'owner', 'errors', 'updatedAt'],
  )
  const { toast } = useToast()

  /* 질의를 주소창과 묶습니다 — 필터된 목록을 링크로 공유할 수 있습니다 */
  useQuerySync(query, setQuery, { fields: fm })

  /* 현재 질의가 저장된 뷰와 달라졌는가 — 저장 버튼 노출 판단 */
  const dirty = useMemo(
    () => JSON.stringify(query) !== JSON.stringify(activeView.query) || viewType !== activeView.viewType,
    [query, activeView, viewType],
  )

  const visible = useMemo(() => applyQuery(records, query, fm), [records, query, fm])
  const detailRecord = records.find((r) => r.id === detailKey) ?? null

  const selectView = (view) => {
    setActiveViewId(view.id)
    setQuery(view.query)
    setViewType(view.viewType)
    setPage(1)
  }

  const saveView = () => {
    setViews((prev) => prev.map((v) => (v.id === activeViewId ? { ...v, query, viewType } : v)))
  }

  const createView = () => {
    const id = `view-${Date.now()}`
    const view = { id, name: `새 뷰 ${views.length + 1}`, query, viewType }
    setViews((prev) => [...prev, view])
    setActiveViewId(id)
  }

  /**
   * 벌크 액션은 결과를 알리고 되돌릴 기회를 줍니다.
   * 조용히 20건을 바꾸면 사용자는 무슨 일이 있었는지 모릅니다.
   */
  const runBulk = (field, value, label) => {
    const { count, undo } = bulkEdit(selected, field, value)
    setSelected(new Set())
    toast({
      message: `${count}건을 ${label}했습니다`,
      action: { label: '실행 취소', onClick: undo },
    })
  }

  const runDelete = () => {
    const { count, undo } = removeRecords(selected)
    setSelected(new Set())
    setConfirmDelete(false)
    setDetailKey(null)
    toast({
      message: `${count}건을 삭제했습니다`,
      tone: 'danger',
      action: { label: '실행 취소', onClick: undo },
    })
  }

  /* 상세 패널에서 이전/다음으로 이동 — 목록으로 돌아가는 왕복을 없앱니다 */
  const detailIndex = visible.findIndex((r) => r.id === detailKey)
  const goRelative = (delta) => {
    const next = visible[detailIndex + delta]
    if (next) setDetailKey(next.id)
  }

  const groupField = query.groupBy ? fm[query.groupBy] : null
  const viewsWithCounts = views.map((v) => ({ ...v, count: applyQuery(records, v.query, fm).length }))

  return (
    <>
      <AppShell
        sidebar={
          <Sidebar header={<WorkspaceSwitcher name="HCT 운영" subtitle="프로덕션" />}>
            <SidebarGroup label="분석">
              <SidebarItem icon={<NavIcons.Dashboard />} label="대시보드" />
            </SidebarGroup>

            <SidebarGroup label="운영">
              <SidebarItem icon={<NavIcons.List />} label="요청" active badge={records.length} />
              <SidebarItem icon={<NavIcons.Alert />} label="알림" badge={3} />
            </SidebarGroup>

            {/* 저장된 뷰가 곧 내비게이션 — 개발자가 아니라 사용자가 만든 항목들 */}
            <SidebarGroup label="내 뷰">
              <SavedViewList
                views={viewsWithCounts}
                activeViewId={activeViewId}
                onSelectView={selectView}
              />
            </SidebarGroup>
          </Sidebar>
        }
        topbar={<Topbar breadcrumb={
          <Breadcrumb items={[{ label: 'HCT 운영', href: '#' }, { label: '요청' }, { label: activeView.name }]} />
        } />}
        rightPanel={
          detailRecord && (
            <RightPanel
              title={detailRecord.id}
              subtitle={fm.system.options.find((o) => o.value === detailRecord.system)?.label}
              onClose={() => setDetailKey(null)}
            >
              {/* RightPanel 이 껍데기, ObjectDetail 이 내용 — 드로어에도 같은 걸 넣을 수 있습니다 */}
              <ObjectDetail
                record={detailRecord}
                fields={fields}
                onPrev={detailIndex > 0 ? () => goRelative(-1) : undefined}
                onNext={detailIndex < visible.length - 1 ? () => goRelative(1) : undefined}
                position={detailIndex >= 0 ? { index: detailIndex + 1, total: visible.length } : undefined}
                detailFields={['priority', 'owner', 'system', 'errors', 'tags', 'updatedAt']}
                onEdit={(key, value) => editRecord(detailRecord, key, value)}
                activity={activityOf(detailRecord.id)}
                onAddComment={(body) => addComment(detailRecord.id, body)}
                onToggleWatch={() => {}}
                watchers={['김민수', '이서연']}
              />
            </RightPanel>
          )
        }
      >
        <PageContainer>
          <PageHeader
            title="요청"
            description="처리 대기 중인 운영 요청입니다. 목록에서 바로 수정할 수 있습니다."
            actions={<Button variant="primary">새 요청</Button>}
          />

          {records.some((r) => r.status === 'blocked') && (
            <Banner tone="warning" title="차단된 요청이 있습니다" className="mb-3"
                    action={
                      <Button size="sm" variant="secondary"
                              onClick={() => setQuery({ ...query, conditions: [{ field: 'status', operator: 'in', value: ['blocked'] }] })}>
                        차단된 항목만 보기
                      </Button>
                    }>
              담당자 확인이 필요한 항목이 {records.filter((r) => r.status === 'blocked').length}건 있습니다.
            </Banner>
          )}

          <GridCard>
            {/* 저장된 뷰 탭 */}
            <ViewTabs
              views={viewsWithCounts}
              activeViewId={activeViewId}
              onSelectView={selectView}
              onCreateView={createView}
              onSaveView={saveView}
              onResetView={() => { setQuery(activeView.query); setViewType(activeView.viewType) }}
              dirty={dirty}
            />

            <div className="border-b border-line-subtle px-3 py-2">
              <QueryBar
                fields={fields}
                query={query}
                onChange={(next) => { setQuery(next); setPage(1) }}
                onSaveView={createView}
                resultCount={visible.length}
              />
            </div>

            <GridToolbar
              left={
                <>
                  <ViewSwitcher value={viewType} onChange={setViewType} />
                  <GroupByPicker
                    fields={fields}
                    value={query.groupBy}
                    onChange={(g) => setQuery({ ...query, groupBy: g })}
                    required={viewType === 'board'}
                  />
                </>
              }
              right={
                <>
                  {viewType === 'table' && (
                    <>
                      <ColumnSettings
                        fields={fields}
                        visibleFields={columns}
                        onChange={setColumns}
                        primaryField="title"
                      />
                      <DensityToggle value={density} onChange={setDensity} />
                    </>
                  )}
                  <Button size="sm" variant="ghost" iconLeft={<NavIcons.Download />}>내보내기</Button>
                </>
              }
            />

            {viewType === 'board' ? (
              <BoardView
                fields={fields}
                records={visible}
                groupField={fm[query.groupBy] ?? fm.status}
                cardFields={['owner', 'priority', 'errors']}
                activeKey={detailKey}
                onCardClick={(r) => setDetailKey(r.id)}
                onMoveRecord={(record, next) => editRecord(record, query.groupBy ?? 'status', next)}
                searchQuery={query.search}
                onClearFilters={() => setQuery(emptyQuery())}
              />
            ) : (
              <>
                <DataGrid
                  fields={fields}
                  visibleFields={columns}
                  primaryField="title"
                  records={visible}
                  density={density}
                  groupField={groupField}
                  sort={query.sort}
                  onToggleSort={(key) => setQuery(toggleSort(query, key))}
                  activeKey={detailKey}
                  onRowClick={(r) => setDetailKey(r.id)}
                  onEditRecord={editRecord}
                  selectedKeys={selected}
                  onSelectedKeysChange={setSelected}
                  searchQuery={query.search}
                  onClearFilters={() => setQuery(emptyQuery())}
                  rowActions={(record) => (
                    <>
                      <IconButton size="xs" label="상세 열기" icon={<NavIcons.Inbox />}
                                  onClick={() => setDetailKey(record.id)} />
                      <IconButton size="xs" label="삭제" icon={<TrashIcon />}
                                  onClick={() => { setSelected(new Set([record.id])); setConfirmDelete(true) }} />
                    </>
                  )}
                  bulkActions={
                    <>
                      <Button size="xs" variant="secondary" onClick={() => runBulk('status', 'done', '완료 처리')}>
                        완료 처리
                      </Button>
                      <Button size="xs" variant="secondary" onClick={() => runBulk('owner', '김민수', '나에게 배정')}>
                        나에게 배정
                      </Button>
                      <Button size="xs" variant="danger-subtle"
                              onClick={() => setConfirmDelete(true)}>삭제</Button>
                    </>
                  }
                />
                <GridPagination page={page} pageSize={20} total={visible.length} onPageChange={setPage} />
              </>
            )}
          </GridCard>
        </PageContainer>
      </AppShell>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={runDelete}
        tone="danger"
        title={`요청 ${selected.size}건을 삭제할까요?`}
        description="삭제한 요청은 복구할 수 없습니다."
        confirmLabel="삭제"
      />

      <ShortcutHelp open={helpOpen} onClose={setHelpOpen} />
    </>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"
         stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M2.5 3.5h8M5 3.5V2.5h3v1M3.5 3.5l.5 7h5l.5-7" />
    </svg>
  )
}
