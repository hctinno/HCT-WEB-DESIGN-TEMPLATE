/**
 * 알림 타입 정의 — 인박스와 알림 설정이 **같은 목록**을 봅니다.
 *
 * 두 화면이 각자 타입을 나열하면 설정에는 있는데 인박스에는 안 오는
 * 알림, 반대로 끌 수 없는 알림이 생깁니다. 사용자는 그걸 버그로 봅니다.
 *
 * `weight` 는 정렬이 아니라 **표시 강도**입니다:
 *   direct — 나를 직접 부른 것. 빨간 배지를 받습니다.
 *   subscribed — 내가 구독한 것의 변화. 굵기로만 표시합니다.
 *   digest — 모아서 하루 한 번이면 충분한 것.
 * 전부 direct 로 만들면 배지가 항상 켜져 있어 아무 의미가 없어집니다.
 */
export const NOTIFICATION_TYPES = [
  {
    id: 'mention',
    label: '나를 언급',
    description: '댓글이나 설명에서 @김민수 로 불렸을 때',
    weight: 'direct',
    defaults: { app: true, email: true },
  },
  {
    id: 'assigned',
    label: '담당자 지정',
    description: '요청의 담당자가 나로 바뀌었을 때',
    weight: 'direct',
    defaults: { app: true, email: true },
  },
  {
    id: 'approval',
    label: '승인 요청',
    description: '내 승인을 기다리는 항목이 생겼을 때',
    weight: 'direct',
    defaults: { app: true, email: true },
  },
  {
    id: 'status',
    label: '상태 변경',
    description: '내가 담당하거나 구독한 요청의 상태가 바뀌었을 때',
    weight: 'subscribed',
    defaults: { app: true, email: false },
  },
  {
    id: 'comment',
    label: '새 댓글',
    description: '구독한 요청에 댓글이 달렸을 때 (나를 언급한 경우는 위 항목)',
    weight: 'subscribed',
    defaults: { app: true, email: false },
  },
  {
    id: 'job',
    label: '작업 완료·실패',
    description: '내가 실행한 가져오기·내보내기가 끝났을 때',
    weight: 'subscribed',
    defaults: { app: true, email: false },
  },
  {
    id: 'threshold',
    label: '지표 임계값 초과',
    description: '대시보드 지표가 설정한 임계값을 넘었을 때',
    weight: 'digest',
    defaults: { app: true, email: true },
  },
  {
    id: 'digest',
    label: '주간 요약',
    description: '한 주 동안의 처리량과 미해결 건수 요약',
    weight: 'digest',
    defaults: { app: false, email: true },
  },
]

export const TYPE_MAP = Object.fromEntries(NOTIFICATION_TYPES.map((t) => [t.id, t]))

const M = 60 * 1000
const H = 60 * M
const now = Date.now()
const ago = (ms) => new Date(now - ms).toISOString()

/**
 * 알림은 **이벤트 목록이 아니라 객체별 묶음**입니다.
 *
 * 한 요청에 다섯 번 변화가 있으면 다섯 줄이 아니라 한 줄이어야 합니다.
 * 이벤트를 그대로 늘어놓는 인박스는 활동이 많은 날 쓸모가 없어집니다.
 * 그래서 여기 한 항목 = 하나의 객체이고, `events` 가 그 안에 쌓입니다.
 */
export const NOTIFICATION_GROUPS = [
  {
    id: 'n-1',
    objectId: 'REQ-1039',
    objectTitle: '외부 연동 인증서 만료',
    read: false,
    events: [
      { id: 'e1', type: 'mention', actor: '박지훈', at: ago(12 * M),
        text: '@김민수 인증서 갱신 담당이 누구인지 확인 부탁드립니다' },
      { id: 'e2', type: 'status', actor: '박지훈', at: ago(40 * M),
        text: '상태를 진행중 → 차단됨 으로 변경' },
    ],
  },
  {
    id: 'n-2',
    objectId: 'REQ-1042',
    objectTitle: '결제 승인 지연 조사',
    read: false,
    events: [
      { id: 'e3', type: 'assigned', actor: '한지우', at: ago(35 * M),
        text: '담당자를 김민수 로 지정' },
    ],
  },
  {
    id: 'n-3',
    objectId: 'REQ-1024',
    objectTitle: '결제 실패 알림 누락',
    read: false,
    events: [
      { id: 'e4', type: 'approval', actor: '이서연', at: ago(1.5 * H),
        text: '설정 변경 승인을 요청했습니다' },
    ],
  },
  {
    id: 'n-4',
    objectId: 'JOB-2210',
    objectTitle: '사용자 목록 가져오기',
    read: false,
    events: [
      { id: 'e5', type: 'job', actor: '시스템', at: ago(2 * H),
        text: '1,204건 중 18건 실패로 완료' },
    ],
  },
  {
    id: 'n-5',
    objectId: 'REQ-1041',
    objectTitle: '대시보드 응답 속도 개선',
    read: true,
    events: [
      { id: 'e6', type: 'comment', actor: '이서연', at: ago(4 * H),
        text: '캐시 적중률부터 확인해보겠습니다' },
      { id: 'e7', type: 'comment', actor: '정하늘', at: ago(5 * H),
        text: '쿼리 계획 떠 봤는데 인덱스는 타고 있습니다' },
      { id: 'e8', type: 'status', actor: '이서연', at: ago(6 * H),
        text: '상태를 대기 → 검토중 으로 변경' },
    ],
  },
  {
    id: 'n-6',
    objectId: '오류 총계',
    objectTitle: '지표 임계값 초과',
    read: true,
    events: [
      { id: 'e9', type: 'threshold', actor: '시스템', at: ago(9 * H),
        text: '1,105건 — 임계값 1,200건에는 못 미치지만 13.6% 증가' },
    ],
  },
]
