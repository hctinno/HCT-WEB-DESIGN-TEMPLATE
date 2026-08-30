import {
  AppShell, Sidebar, SidebarGroup, SidebarItem, WorkspaceRail, SidebarUser,
  Topbar, Breadcrumb, TopbarIconButton,
} from '../components'
import { NavIcons } from './_icons'
import { SidebarBrand } from './_brand'

/**
 * 앱 프레임 — 사이드바·상단바를 한 곳에서 정의합니다.
 *
 * 페이지마다 사이드바를 직접 조립하면 **화면을 옮길 때마다 내비게이션이
 * 달라집니다.** 어떤 화면에는 "감사 로그"가 있고 어떤 화면에는 없으면
 * 사용자는 자기가 다른 제품에 온 줄 압니다. 실제 앱에서는 라우터가 이
 * 역할을 하지만, 템플릿에서는 이 파일이 그 자리를 대신합니다.
 *
 * 개발 에이전트에게:
 *   화면을 새로 만들 때 사이드바를 다시 쓰지 마세요. NAV 에 항목을 추가하고
 *   `<AppFrame active="새항목ID">` 로 감싸면 됩니다.
 */

/** 워크스페이스(=조직·환경) 목록. 좌측 레일이 담당합니다. */
export const WORKSPACES = [
  { id: 'prod', label: 'HCT 프로덕션', initial: 'P' },
  { id: 'stg', label: 'HCT 스테이징', initial: 'S', badge: 2 },
  { id: 'dev', label: 'HCT 개발', initial: 'D' },
]

/** 지금 로그인한 사람 — 여러 화면이 같은 값을 봐야 합니다. */
export const CURRENT_USER = { name: '김민수', detail: '관리자 · 운영팀', status: 'online' }

/**
 * 단일 내비게이션 정의.
 *
 * `count` 는 화면마다 달라지므로 AppFrame 의 `counts` 로 주입합니다.
 * 여기에 숫자를 하드코딩하면 목록에서 본 개수와 대시보드에서 본 개수가
 * 어긋납니다.
 */
export const NAV = [
  {
    label: '분석',
    items: [
      { id: 'dashboard', label: '대시보드', icon: NavIcons.Dashboard },
      { id: 'reports', label: '리포트', icon: NavIcons.Chart },
    ],
  },
  {
    label: '운영',
    items: [
      { id: 'list', label: '요청', icon: NavIcons.List },
      { id: 'inbox', label: '알림', icon: NavIcons.Alert },
      { id: 'archive', label: '보관함', icon: NavIcons.Inbox },
      { id: 'approvals', label: '승인 대기', icon: NavIcons.Approve },
      { id: 'jobs', label: '예약 작업', icon: NavIcons.Clock },
      { id: 'import', label: '데이터 가져오기', icon: NavIcons.Upload },
    ],
  },
  {
    label: '관리',
    items: [
      { id: 'users', label: '사용자', icon: NavIcons.Users },
      { id: 'audit', label: '감사 로그', icon: NavIcons.Audit },
      { id: 'integrations', label: '연동과 API', icon: NavIcons.Plug },
      { id: 'billing', label: '사용량과 청구', icon: NavIcons.Billing },
      { id: 'settings', label: '환경설정', icon: NavIcons.Settings },
    ],
  },
]

/** NAV 를 훑어 id 로 항목을 찾습니다. 브레드크럼 기본값에 씁니다. */
export function navItem(id) {
  for (const group of NAV) {
    const found = group.items.find((it) => it.id === id)
    if (found) return { ...found, group: group.label }
  }
  return null
}

/**
 * 표준 앱 프레임.
 *
 * @param {object} props
 * @param {string} props.active            - NAV 항목 id
 * @param {Record<string, number|boolean>} [props.counts]
 *        항목 id → 배지 숫자. `true` 는 숫자 없는 읽지 않음 표시
 * @param {Record<string, number>} [props.mentions] - 항목 id → 멘션 수
 * @param {{label: string, href?: string}[]} [props.breadcrumb]
 *        생략하면 NAV 에서 "워크스페이스 / 그룹 / 항목" 을 만들어 씁니다
 * @param {React.ReactNode} [props.extraNav]   - 저장된 뷰처럼 화면 고유의 탐색
 * @param {React.ReactNode} [props.topbarSearch]
 * @param {React.ReactNode} [props.topbarActions]
 * @param {React.ReactNode} [props.rightPanel]
 * @param {(id: string) => void} [props.onNavigate]
 */
export function AppFrame({
  active,
  counts = {},
  mentions = {},
  breadcrumb,
  extraNav,
  topbarSearch,
  topbarActions,
  rightPanel,
  onNavigate,
  children,
}) {
  const here = navItem(active)
  const crumbs = breadcrumb ?? [
    { label: 'HCT 운영', href: '#' },
    ...(here ? [{ label: here.group }, { label: here.label }] : []),
  ]

  return (
    <AppShell
      rightPanel={rightPanel}
      sidebar={
        <Sidebar
          rail={<WorkspaceRail activeId="prod" items={WORKSPACES} />}
          header={<SidebarBrand />}
          footer={<SidebarUser {...CURRENT_USER} />}
        >
          {NAV.map((group) => (
            <SidebarGroup key={group.label} label={group.label}>
              {group.items.map((item) => {
                const count = counts[item.id]
                return (
                  <SidebarItem
                    key={item.id}
                    icon={<item.icon />}
                    label={item.label}
                    active={item.id === active}
                    badge={typeof count === 'number' ? count : undefined}
                    unread={count === true}
                    mentions={mentions[item.id]}
                    onClick={() => onNavigate?.(item.id)}
                  />
                )
              })}
            </SidebarGroup>
          ))}
          {extraNav}
        </Sidebar>
      }
      topbar={
        <Topbar
          breadcrumb={<Breadcrumb items={crumbs} />}
          search={topbarSearch}
          actions={
            topbarActions ?? (
              <TopbarIconButton
                icon={<NavIcons.Alert />}
                label="알림"
                badge={Boolean(counts.inbox)}
                onClick={() => onNavigate?.('inbox')}
              />
            )
          }
        />
      }
    >
      {children}
    </AppShell>
  )
}
