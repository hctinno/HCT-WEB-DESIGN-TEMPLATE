import { useMemo, useState } from 'react'
import {
  PageContainer, PageHeader,
  SearchInput, Button, StatusBadge, Tag, EmptyState, SegmentedControl, Avatar,
  formatRelative,
} from '../components'
import { AppFrame } from './_shell'
import { NavIcons } from './_icons'

/**
 * 화면 원형 12: 전역 검색 결과
 *
 * 명령 팔레트(Cmd+K)는 **아는 것을 빨리 여는** 도구입니다. 이 화면은
 * **모르는 것을 찾는** 도구입니다. 둘을 하나로 만들면 둘 다 나빠집니다.
 *
 * 검색 결과 화면이 실패하는 지점 셋:
 *
 *   1. **종류가 섞입니다.** 요청과 사용자와 설정이 한 줄씩 번갈아 나오면
 *      눈이 갈피를 못 잡습니다. 종류별로 묶고, 개수를 먼저 보여줍니다.
 *   2. **왜 걸렸는지 안 보입니다.** 제목에 없는 말로 검색했는데 결과가
 *      나오면 사용자는 의심합니다. 일치한 부분을 표시합니다.
 *   3. **찾지 못했을 때 막다른 길입니다.** "결과 없음" 만 있으면 끝입니다.
 *      오타·범위·권한 중 무엇이 문제인지 짚어줘야 합니다.
 */

const TYPES = [
  { id: 'request', label: '요청', icon: NavIcons.List },
  { id: 'user', label: '사용자', icon: NavIcons.Users },
  { id: 'view', label: '저장된 뷰', icon: NavIcons.Filter },
  { id: 'setting', label: '설정', icon: NavIcons.Settings },
  { id: 'doc', label: '문서', icon: NavIcons.Inbox },
]

const H = 3600 * 1000
const now = Date.now()

const RESULTS = [
  { id: 'r1', type: 'request', title: '결제 승인 지연 조사', code: 'REQ-1042',
    snippet: '결제 게이트웨이 응답이 30초를 넘는 건이 늘고 있어 원인을 찾는 중입니다.',
    match: '결제', meta: { status: 'inProgress', owner: '김민수', at: new Date(now - 0.2 * H).toISOString() } },
  { id: 'r2', type: 'request', title: '결제 웹훅 재시도 큐 적체', code: 'REQ-1036',
    snippet: '재시도 큐에 결제 실패 건이 쌓여 처리가 밀립니다.',
    match: '결제', meta: { status: 'inProgress', owner: '김민수', at: new Date(now - 2 * H).toISOString() } },
  { id: 'r3', type: 'request', title: '결제 실패 알림 누락', code: 'REQ-1024',
    snippet: '실패했는데 알림이 오지 않는 사례가 보고되었습니다.',
    match: '결제', meta: { status: 'blocked', owner: '김민수', at: new Date(now - 5 * H).toISOString() } },
  { id: 'r4', type: 'view', title: '결제 시스템 미해결', code: '내 뷰',
    snippet: '시스템 = 결제 · 상태 ≠ 완료 · 정렬: 수정 최신순',
    match: '결제', meta: { owner: '김민수', shared: true } },
  { id: 'r5', type: 'setting', title: '결제 실패 알림 임계값', code: '환경설정 › 알림',
    snippet: '오류 총계가 이 값을 넘으면 대시보드에 경고를 띄웁니다. 현재 1,200건.',
    match: '결제' },
  { id: 'r6', type: 'doc', title: '결제 장애 대응 절차', code: '문서',
    snippet: '1. 결제 게이트웨이 상태 페이지 확인 2. 재시도 큐 길이 확인 3. …',
    match: '결제', meta: { at: new Date(now - 200 * H).toISOString() } },
  { id: 'r7', type: 'user', title: '김민수', code: 'minsu.kim@hct.co.kr',
    snippet: '운영팀 · 관리자 · 결제 시스템 담당',
    match: '결제', meta: { presence: 'online' } },
]

export function SearchPage({ onNavigate, initialQuery = '결제' }) {
  const [q, setQ] = useState(initialQuery)
  const [type, setType] = useState('all')

  const hits = useMemo(() => {
    const term = q.trim()
    if (!term) return []
    return RESULTS.filter((r) =>
      [r.title, r.code, r.snippet].some((t) => t?.includes(term)),
    )
  }, [q])

  const counts = useMemo(() => {
    const out = {}
    for (const r of hits) out[r.type] = (out[r.type] ?? 0) + 1
    return out
  }, [hits])

  const shown = type === 'all' ? hits : hits.filter((r) => r.type === type)

  /* 종류별로 묶습니다 — 섞어 놓으면 눈이 갈피를 못 잡습니다 */
  const grouped = TYPES
    .map((t) => ({ ...t, items: shown.filter((r) => r.type === t.id) }))
    .filter((g) => g.items.length > 0)

  return (
    <AppFrame
      active="list"
      onNavigate={onNavigate}
      counts={{ list: 18, inbox: true, archive: 12 }}
      mentions={{ inbox: 3 }}
      breadcrumb={[{ label: 'HCT 운영', href: '#' }, { label: '검색' }]}
    >
      <PageContainer>
        <PageHeader
          title="검색"
          description="요청·사용자·저장된 뷰·설정·문서를 한 번에 찾습니다."
        />

        <div className="mb-3 max-w-[520px]">
          <SearchInput
            size="lg"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="찾을 말을 입력하세요"
          />
        </div>

        {q.trim() === '' ? (
          <EmptyState
            title="무엇을 찾으시나요"
            description="요청 번호(REQ-1042), 사람 이름, 설정 이름 모두 됩니다."
          />
        ) : hits.length === 0 ? (
          <NoResults term={q} onClear={() => setQ('')} />
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <SegmentedControl
                value={type}
                onChange={setType}
                options={[
                  { value: 'all', label: '전체', count: hits.length },
                  ...TYPES.filter((t) => counts[t.id]).map((t) => ({
                    value: t.id, label: t.label, count: counts[t.id],
                  })),
                ]}
              />
            </div>

            <div className="space-y-5">
              {grouped.map((group) => (
                <section key={group.id}>
                  <h2 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-fg-tertiary">
                    <group.icon />
                    {group.label}
                    <span className="tabular font-normal">{group.items.length}</span>
                  </h2>
                  <ul className="overflow-hidden rounded-lg border border-line-subtle bg-bg-surface">
                    {group.items.map((r) => (
                      <ResultRow key={r.id} result={r} term={q.trim()} onOpen={() => onNavigate?.('list')} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}
      </PageContainer>
    </AppFrame>
  )
}

/**
 * 결과 한 줄.
 *
 * 일치한 말을 **본문 안에서** 강조합니다. 제목에 없는 말로 걸린 결과는
 * 강조가 없으면 "왜 나왔지" 로 읽히고, 검색 자체를 못 믿게 됩니다.
 */
function ResultRow({ result, term, onOpen }) {
  return (
    <li className="border-b border-line-subtle last:border-b-0">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-bg-hover"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-base font-medium text-fg-primary">
              <Highlight text={result.title} term={term} />
            </span>
            <span className="shrink-0 tabular text-xs text-fg-tertiary">{result.code}</span>
            {result.meta?.status && <StatusBadge status={result.meta.status} size="sm" dot />}
            {result.meta?.shared && <Tag>공유됨</Tag>}
          </div>

          <p className="mt-0.5 line-clamp-2 text-sm text-fg-tertiary">
            <Highlight text={result.snippet} term={term} />
          </p>

          {(result.meta?.owner || result.meta?.at) && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-fg-tertiary">
              {result.meta.owner && (
                <>
                  <Avatar name={result.meta.owner} />
                  <span>{result.meta.owner}</span>
                </>
              )}
              {result.meta.owner && result.meta.at && <span className="text-fg-disabled">·</span>}
              {result.meta.at && <span className="tabular">{formatRelative(result.meta.at)}</span>}
            </p>
          )}
        </div>
      </button>
    </li>
  )
}

/** 일치 부분 강조. 색이 아니라 배경 + 굵기로 — 색만으로는 안 보이는 사람이 있습니다 */
function Highlight({ text, term }) {
  if (!term || !text?.includes(term)) return text
  const parts = text.split(term)
  return parts.map((part, i) => (
    <span key={`${part}-${i}`}>
      {part}
      {i < parts.length - 1 && (
        <mark className="rounded-sm bg-warning-bg font-semibold text-warning-text">{term}</mark>
      )}
    </span>
  ))
}

/**
 * 못 찾았을 때.
 *
 * "결과 없음" 으로 끝내면 사용자는 자기가 뭘 잘못했는지 모릅니다.
 * 짚어줄 수 있는 원인은 대개 셋입니다: 오타, 범위, 권한.
 */
function NoResults({ term, onClear }) {
  return (
    <div className="rounded-lg border border-line-subtle bg-bg-surface p-6">
      <p className="text-base font-semibold text-fg-primary">
        “{term}” 에 대한 결과가 없습니다
      </p>
      <ul className="mt-2 space-y-1 text-sm text-fg-tertiary">
        <li>· 오타가 있는지 확인해 보세요.</li>
        <li>· 다른 워크스페이스의 항목은 검색되지 않습니다. 좌측 레일에서 환경을 바꿔보세요.</li>
        <li>· 볼 권한이 없는 항목은 결과에 나오지 않습니다. 필요하면 관리자에게 요청하세요.</li>
        <li>· 보관함에 들어간 항목은 기본 검색에서 빠집니다.</li>
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onClear}>검색어 지우기</Button>
        <Button variant="ghost">보관함까지 검색</Button>
      </div>
    </div>
  )
}
