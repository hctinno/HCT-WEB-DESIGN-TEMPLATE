/**
 * 화면 원형 배럴.
 *
 * 이 화면들은 **완성품이 아니라 출발점**입니다. import 해서 그대로 쓰기보다,
 * 파일을 복사해 자기 데이터에 맞게 고치는 쪽이 정상입니다. 각 파일 맨 위
 * 주석에 그 화면에서 흔히 저지르는 실수가 적혀 있으니 먼저 읽으세요.
 *
 * 여기서 바로 쓸 만한 것은 AppFrame 과 NAV 입니다 — 내비게이션을 한 곳에서
 * 정의하는 장치라 앱마다 다시 만들 이유가 없습니다.
 */
export { AppFrame, NAV, WORKSPACES, CURRENT_USER, navItem } from './_shell'
export { NavIcons } from './_icons'
export { SidebarBrand } from './_brand'

export { DashboardPage } from './DashboardPage'
export { ListPage } from './ListPage'
export { ScalePage } from './ScalePage'
export { InboxPage } from './InboxPage'
export { ImportPage } from './ImportPage'
export { ApprovalsPage } from './ApprovalsPage'
export { JobsPage } from './JobsPage'
export { SearchPage } from './SearchPage'

export { AdminPage } from './AdminPage'
export { AuditPage } from './AuditPage'
export { IntegrationsPage } from './IntegrationsPage'
export { BillingPage } from './BillingPage'
export { SettingsPage } from './SettingsPage'
export { AccountPage } from './AccountPage'

export { LoginPage } from './LoginPage'
export { InviteAcceptPage, PasswordResetRequestPage, PasswordResetPage } from './AuthPages'
export { OnboardingPage } from './OnboardingPage'
export {
  ErrorPagesDemo, ForbiddenPage, NotFoundPage, ServerErrorPage, MaintenancePage,
} from './ErrorPages'

/* 예시 데이터와 알림 타입 — 자기 데이터로 갈아끼우기 전 참고용 */
export { REQUEST_FIELDS, REQUEST_RECORDS, INITIAL_VIEWS } from './_data'
export { NOTIFICATION_TYPES, TYPE_MAP, NOTIFICATION_GROUPS } from './_notifications'
