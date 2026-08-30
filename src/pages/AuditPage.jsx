import { useMemo, useState } from 'react'
import {
  PageContainer, PageHeader,
  DataGrid, GridCard, GridPagination, QueryBar,
  Button, Banner, StatusBadge, Drawer, PropertyList, PropertyRow, EmptyState,
  normalizeFields, fieldMap, applyQuery, toggleSort, emptyQuery,
  formatRelative, useToast,
} from '../components'
import { AppFrame } from './_shell'

/**
 * 화면 원형 10: 감사 로그
 *
 * 다른 목록과 결정적으로 다른 점: **여기서는 아무것도 고칠 수 없습니다.**
 * 그게 감사 로그의 유일한 가치입니다. 편집 가능한 감사 로그는 감사
 * 로그가 아닙니다. 그래서 인라인 편집도, 선택 후 일괄 작업도 없습니다.
 *
 * 실제로 쓸모 있으려면 세 가지가 있어야 합니다:
 *
 *   1. **무엇이 어떻게 바뀌었는지** — "설정을 변경함" 은 쓸모없습니다.
 *      이전 값과 이후 값이 나란히 보여야 합니다.
 *   2. **누가, 어디서** — 사람 이름만으로는 부족합니다. API 키로 한
 *      일인지 사람이 한 일인지, 어느 IP 에서인지가 사고 조사의 시작입니다.
 *   3. **보존 기간** — 언제까지 남는지 말하지 않으면 사람들은 영원할
 *      거라고 믿습니다. 사고가 난 뒤에 없다는 걸 알게 되는 게 최악입니다.
 */

const ACTORS = [
  { value: '김민수', label: '김민수' },
  { value: '한지우', label: '한지우' },
  { value: '이서연', label: '이서연' },
  { value: '배치 작업', label: '배치 작업' },
  { value: 'API 키: 정산연동', label: 'API 키: 정산연동' },
]

const AUDIT_FIELDS = normalizeFields([
  { key: 'at', label: '시각', type: 'date', editable: false, width: '112px' },
  { key: 'actor', label: '수행자', type: 'user', editable: false, width: '150px', options: ACTORS },
  { key: 'action', label: '행위', type: 'select', editable: false, width: '128px', options: [
      { value: 'create', label: '생성', status: 'done' },
      { value: 'update', label: '변경', status: 'inProgress' },
      { value: 'delete', label: '삭제', status: 'blocked' },
      { value: 'permission', label: '권한 변경', status: 'inReview' },
      { value: 'login', label: '로그인', status: 'todo' },
      { value: 'export', label: '내보내기', status: 'todo' },
    ] },
  { key: 'target', label: '대상', type: 'text', editable: false, width: '160px' },
  { key: 'summary', label: '내용', type: 'text', editable: false },
  { key: 'ip', label: 'IP', type: 'text', editable: false, width: '124px' },
])

const M = 60 * 1000
const H = 60 * M
const now = Date.now()
const at = (ms) => new Date(now - ms).toISOString()

const EVENTS = [
  { id: 'a1', at: at(8 * M), actor: '한지우', action: 'permission', target: '강도현',
    summary: '역할을 조회자 → 멤버 로 변경', ip: '203.0.113.42',
    changes: [{ field: '역할', from: '조회자', to: '멤버' }],
    reason: '운영 인수인계에 따라 요청 처리 권한 부여' },
  { id: 'a2', at: at(42 * M), actor: '김민수', action: 'update', target: 'REQ-1039',
    summary: '상태를 진행중 → 차단됨, 우선순위를 높음 → 긴급 으로 변경', ip: '203.0.113.42',
    changes: [
      { field: '상태', from: '진행중', to: '차단됨' },
      { field: '우선순위', from: '높음', to: '긴급' },
    ] },
  { id: 'a3', at: at(1.4 * H), actor: 'API 키: 정산연동', action: 'create', target: 'REQ-1043',
    summary: '요청 1건 생성', ip: '198.51.100.20',
    changes: [{ field: '제목', from: null, to: '정산 배치 실패 재처리' }] },
  { id: 'a4', at: at(3 * H), actor: '이서연', action: 'export', target: '요청 목록',
    summary: '1,204건을 CSV 로 내보냄', ip: '203.0.113.77',
    changes: [], note: '내보내기는 데이터가 시스템 밖으로 나가는 지점이라 항상 기록합니다.' },
  { id: 'a5', at: at(5 * H), actor: '배치 작업', action: 'update', target: 'REQ-1027 외 34건',
    summary: '야간 재분류로 35건의 상태를 일괄 변경', ip: '내부',
    changes: [{ field: '상태', from: '대기', to: '진행중' }] },
  { id: 'a6', at: at(9 * H), actor: '김민수', action: 'delete', target: 'REQ-0994',
    summary: '요청 1건 삭제', ip: '203.0.113.42',
    changes: [{ field: '항목', from: 'REQ-0994 중복 등록된 결제 오류', to: null }],
    reason: 'REQ-0991 과 중복' },
  { id: 'a7', at: at(26 * H), actor: '한지우', action: 'permission', target: '오세림',
    summary: '계정을 비활성화', ip: '203.0.113.9',
    changes: [{ field: '상태', from: '활성', to: '비활성' }],
    reason: '퇴사 처리' },
  { id: 'a8', at: at(30 * H), actor: '김민수', action: 'login', target: '김민수',
    summary: '새 기기(Chrome · Windows)에서 로그인', ip: '198.51.100.9' },
]

const RETENTION_DAYS = 90

export function AuditPage({ onNavigate }) {
  const { toast } = useToast()
  const fields = AUDIT_FIELDS
  const fm = useMemo(() => fieldMap(fields), [fields])
  const [query, setQuery] = useState(() => emptyQuery())
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState(null)

  const visible = useMemo(() => applyQuery(EVENTS, query, fm), [query, fm])
  const paged = visible.slice((page - 1) * 20, page * 20)

  return (
    <AppFrame
      active="audit"
      onNavigate={onNavigate}
      counts={{ list: 18, inbox: true, archive: 12 }}
      mentions={{ inbox: 3 }}
    >
      <PageContainer>
        <PageHeader
          title="감사 로그"
          description="누가 무엇을 바꿨는지 남는 기록입니다. 이 기록은 수정하거나 지울 수 없습니다."
          actions={
            <Button
              variant="secondary"
              onClick={() => toast({ tone: 'success', message: `${visible.length}건을 내보냈습니다. 이 내보내기도 기록에 남습니다` })}
            >
              CSV 로 내보내기
            </Button>
          }
        />

        {/* 보존 기간을 조용히 두면 사람들은 영원히 남는다고 믿습니다 */}
        <Banner tone="info" title={`기록은 ${RETENTION_DAYS}일간 보관됩니다`} className="mb-3">
          더 오래 남겨야 한다면 정기적으로 내보내 두세요. 보존 기간은 환경설정에서 바꿉니다.
        </Banner>

        <GridCard>
          <div className="border-b border-line-subtle px-3 py-2">
            <QueryBar
              fields={fields}
              query={query}
              onChange={(next) => { setQuery(next); setPage(1) }}
              resultCount={visible.length}
            />
          </div>

          <DataGrid
            fields={fields}
            records={paged}
            /* 감사 로그에는 선택도 편집도 없습니다 — 할 수 있는 일이 없으니까요 */
            selectable={false}
            sort={query.sort}
            onToggleSort={(key) => setQuery((q) => ({ ...q, sort: toggleSort(q, key).sort }))}
            onRowClick={setDetail}
            activeKey={detail?.id}
            searchQuery={query.search}
            onClearFilters={() => setQuery(emptyQuery())}
            emptyState={
              <EmptyState
                title="해당하는 기록이 없습니다"
                description="조건을 넓히거나 기간을 늘려보세요. 보존 기간을 지난 기록은 남아 있지 않습니다."
              />
            }
          />

          <GridPagination page={page} pageSize={20} total={visible.length} onPageChange={setPage} />
        </GridCard>
      </PageContainer>

      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? `${fm.action.options.find((o) => o.value === detail.action)?.label} · ${detail.target}` : ''}
      >
        {detail && <AuditDetail event={detail} fm={fm} />}
      </Drawer>
    </AppFrame>
  )
}

/**
 * 기록 하나의 상세.
 *
 * 목록의 "내용" 은 요약이고, 조사에 필요한 것은 **이전 값과 이후 값**입니다.
 * 이게 없으면 감사 로그는 "무슨 일이 있었다"까지만 말하고 끝납니다.
 */
function AuditDetail({ event, fm }) {
  const actionLabel = fm.action.options.find((o) => o.value === event.action)?.label

  return (
    <div className="space-y-4">
      <PropertyList>
        <PropertyRow label="시각">
          <span className="tabular">{new Date(event.at).toLocaleString('ko-KR')}</span>
          <span className="ml-1.5 text-fg-tertiary">({formatRelative(event.at)})</span>
        </PropertyRow>
        <PropertyRow label="수행자">
          {event.actor}
          {/* 사람인지 기계인지 구분하는 것이 조사의 첫 단계입니다 */}
          {event.actor.startsWith('API 키') && (
            <StatusBadge tone="info" size="sm" className="ml-1.5">기계</StatusBadge>
          )}
          {event.actor === '배치 작업' && (
            <StatusBadge tone="info" size="sm" className="ml-1.5">기계</StatusBadge>
          )}
        </PropertyRow>
        <PropertyRow label="행위">{actionLabel}</PropertyRow>
        <PropertyRow label="대상">{event.target}</PropertyRow>
        <PropertyRow label="출처 IP"><span className="tabular break-token">{event.ip}</span></PropertyRow>
      </PropertyList>

      {event.changes?.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-fg-tertiary">
            바뀐 값
          </p>
          <ul className="overflow-hidden rounded-md border border-line-subtle">
            {event.changes.map((c) => (
              <li key={c.field} className="border-b border-line-subtle px-2.5 py-2 last:border-b-0">
                <p className="text-xs font-medium text-fg-secondary">{c.field}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm">
                  <ValueChip value={c.from} tone="removed" />
                  <span aria-hidden="true" className="text-fg-disabled">→</span>
                  <ValueChip value={c.to} tone="added" />
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {event.reason && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.06em] text-fg-tertiary">사유</p>
          <p className="text-sm text-fg-secondary">{event.reason}</p>
        </div>
      )}

      {event.note && <p className="text-sm text-fg-tertiary">{event.note}</p>}
    </div>
  )
}

/** 없던 값·지워진 값을 빈 칸으로 두면 "기록이 빠졌나" 로 읽힙니다 */
function ValueChip({ value, tone }) {
  if (value == null) {
    return <span className="text-fg-tertiary">(없음)</span>
  }
  return (
    <span className={
      'rounded-sm px-1.5 py-0.5 text-sm ' +
      (tone === 'removed' ? 'bg-danger-bg text-danger-text' : 'bg-success-bg text-success-text')
    }>
      {value}
    </span>
  )
}
