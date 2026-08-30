import { normalizeFields } from '../lib/fields'

/**
 * 예시 데이터 — 화면 원형이 쓰는 스키마와 레코드.
 *
 * 개발 에이전트가 볼 것: **스키마가 먼저이고 화면이 나중입니다.**
 * 컬럼 정의를 화면마다 새로 쓰지 않고, 이 스키마 하나에서
 * 표·보드·상세·필터·질의가 전부 파생됩니다.
 */

export const REQUEST_FIELDS = normalizeFields([
  { key: 'id',       label: 'ID',      type: 'text',   editable: false, width: '104px' },
  { key: 'title',    label: '제목',     type: 'text' },
  { key: 'status',   label: '상태',     type: 'select', width: '116px', options: [
      /* status 키가 StatusBadge 의 고정 색에 연결됩니다.
         화면마다 색을 고르지 않게 하는 지점입니다. */
      { value: 'todo',     label: '대기',   status: 'todo' },
      { value: 'doing',    label: '진행중', status: 'inProgress' },
      { value: 'review',   label: '검토중', status: 'inReview' },
      { value: 'blocked',  label: '차단됨', status: 'blocked' },
      { value: 'done',     label: '완료',   status: 'done' },
    ] },
  { key: 'priority', label: '우선순위', type: 'select', width: '96px', options: [
      { value: 'urgent', label: '긴급' },
      { value: 'high',   label: '높음' },
      { value: 'normal', label: '보통' },
      { value: 'low',    label: '낮음' },
    ] },
  { key: 'owner',    label: '담당자',   type: 'user',   width: '116px', options: [
      { value: '김민수', label: '김민수' },
      { value: '이서연', label: '이서연' },
      { value: '박지훈', label: '박지훈' },
      { value: '최유진', label: '최유진' },
      { value: '정하늘', label: '정하늘' },
    ] },
  { key: 'system',   label: '시스템',   type: 'select', width: '110px', options: [
      { value: 'payment',   label: '결제' },
      { value: 'auth',      label: '인증' },
      { value: 'reporting', label: '리포트' },
      { value: 'ingest',    label: '수집' },
    ] },
  { key: 'errors',   label: '오류수',   type: 'number', width: '84px' },
  { key: 'tags',     label: '태그',     type: 'tags' },
  { key: 'updatedAt', label: '수정',    type: 'date',   width: '96px', editable: false },
])

const H = 3600 * 1000
const now = Date.now()

export const REQUEST_RECORDS = [
  { id: 'REQ-1042', title: '결제 승인 지연 조사',       status: 'doing',   priority: 'high',   owner: '김민수', system: 'payment',   errors: 128, tags: ['결제', '지연'],     updatedAt: new Date(now - 0.2 * H).toISOString() },
  { id: 'REQ-1041', title: '대시보드 응답 속도 개선',    status: 'review',  priority: 'normal', owner: '이서연', system: 'reporting', errors: 4,   tags: ['성능'],             updatedAt: new Date(now - 0.6 * H).toISOString() },
  { id: 'REQ-1039', title: '외부 연동 인증서 만료',      status: 'blocked', priority: 'urgent', owner: '박지훈', system: 'auth',      errors: 412, tags: ['보안', '긴급'],     updatedAt: new Date(now - 1.3 * H).toISOString() },
  { id: 'REQ-1038', title: '인증 토큰 갱신 지연',        status: 'doing',   priority: 'high',   owner: '박지훈', system: 'auth',      errors: 96,  tags: ['보안'],             updatedAt: new Date(now - 2.1 * H).toISOString() },
  { id: 'REQ-1036', title: '결제 웹훅 재시도 큐 적체',    status: 'doing',   priority: 'high',   owner: '김민수', system: 'payment',   errors: 71,  tags: ['결제', '큐'],       updatedAt: new Date(now - 2.6 * H).toISOString() },
  { id: 'REQ-1035', title: '월간 리포트 자동화',         status: 'done',    priority: 'low',    owner: '최유진', system: 'reporting', errors: 0,   tags: ['자동화'],           updatedAt: new Date(now - 26 * H).toISOString() },
  { id: 'REQ-1033', title: '감사 로그 보존 정책',        status: 'done',    priority: 'low',    owner: '최유진', system: 'auth',      errors: 0,   tags: ['보안'],             updatedAt: new Date(now - 30 * H).toISOString() },
  { id: 'REQ-1031', title: '사용자 권한 정책 정리',      status: 'todo',    priority: 'normal', owner: null,     system: 'auth',      errors: 0,   tags: [],                   updatedAt: new Date(now - 50 * H).toISOString() },
  { id: 'REQ-1029', title: '수집 파이프라인 재처리',     status: 'doing',   priority: 'high',   owner: '정하늘', system: 'ingest',    errors: 57,  tags: ['배치'],             updatedAt: new Date(now - 3 * H).toISOString() },
  { id: 'REQ-1027', title: '수집 지연 알림 임계 조정',   status: 'todo',    priority: 'normal', owner: '정하늘', system: 'ingest',    errors: 8,   tags: ['알림'],             updatedAt: new Date(now - 40 * H).toISOString() },
  { id: 'REQ-1024', title: '결제 실패 알림 누락',        status: 'doing',   priority: 'urgent', owner: '김민수', system: 'payment',   errors: 233, tags: ['결제', '알림'],     updatedAt: new Date(now - 5 * H).toISOString() },
  { id: 'REQ-1021', title: '결제 정산 배치 중복 실행',   status: 'review',  priority: 'high',   owner: '김민수', system: 'payment',   errors: 39,  tags: ['결제', '배치'],     updatedAt: new Date(now - 6.5 * H).toISOString() },
  { id: 'REQ-1018', title: '리포트 렌더링 타임아웃',     status: 'review',  priority: 'high',   owner: '이서연', system: 'reporting', errors: 19,  tags: ['성능', '타임아웃'], updatedAt: new Date(now - 8 * H).toISOString() },
  { id: 'REQ-1016', title: '리포트 캐시 무효화 오류',    status: 'doing',   priority: 'normal', owner: '이서연', system: 'reporting', errors: 12,  tags: ['성능'],             updatedAt: new Date(now - 10 * H).toISOString() },
  { id: 'REQ-1014', title: '수집 스키마 검증 강화',      status: 'todo',    priority: 'low',    owner: '정하늘', system: 'ingest',    errors: 0,   tags: [],                   updatedAt: new Date(now - 64 * H).toISOString() },
  { id: 'REQ-1012', title: '수집 스키마 변경 대응',      status: 'todo',    priority: 'normal', owner: '정하늘', system: 'ingest',    errors: 3,   tags: [],                   updatedAt: new Date(now - 72 * H).toISOString() },
  { id: 'REQ-1009', title: '권한 캐시 동기화 실패',      status: 'todo',    priority: 'normal', owner: null,     system: 'auth',      errors: 21,  tags: ['보안'],             updatedAt: new Date(now - 78 * H).toISOString() },
  { id: 'REQ-1007', title: '인증 토큰 갱신 실패',        status: 'done',    priority: 'high',   owner: '박지훈', system: 'auth',      errors: 2,   tags: ['보안'],             updatedAt: new Date(now - 96 * H).toISOString() },
]

/** 초기 저장된 뷰 — 사용자가 만든 것이 내비게이션이 되는 구조의 예시 */
export const INITIAL_VIEWS = [
  {
    id: 'all', name: '전체', viewType: 'table',
    query: { search: '', match: 'all', conditions: [], sort: [{ field: 'updatedAt', direction: 'desc' }], groupBy: null },
  },
  {
    id: 'mine', name: '내 담당', viewType: 'table',
    query: {
      search: '', match: 'all',
      conditions: [{ field: 'owner', operator: 'in', value: ['김민수'] }],
      sort: [{ field: 'priority', direction: 'asc' }], groupBy: null,
    },
  },
  {
    id: 'attention', name: '조치 필요', viewType: 'table',
    query: {
      search: '', match: 'all',
      conditions: [{ field: 'status', operator: 'in', value: ['blocked', 'doing'] }],
      sort: [{ field: 'errors', direction: 'desc' }], groupBy: 'system',
    },
  },
  {
    id: 'board', name: '보드', viewType: 'board',
    query: { search: '', match: 'all', conditions: [], sort: [], groupBy: 'status' },
  },
]
