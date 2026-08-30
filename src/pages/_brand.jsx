import { Logo } from '../components'

/**
 * 사이드바 상단의 브랜드 영역.
 *
 * 로고는 **사이드바 면의 밝기**에 맞춥니다. 테마가 아니라 면입니다 —
 * HCT·네이비·플럼 팔레트는 라이트 테마에서도 사이드바가 어둡기 때문에
 * `on="auto"` 로 두면 밝은 면용 원색 로고가 어두운 배경에 얹혀 사라집니다.
 * (로고 원색 #2F4A9C 는 딥네이비 대비 2:1 수준입니다.)
 *
 * 240px 사이드바에 로고와 워크스페이스 전환기를 나란히 두면 이름이 잘립니다.
 * 회사 식별은 로고가, 워크스페이스 전환은 좌측 레일이 맡으므로
 * 여기서는 로고와 **현재 환경 표시**만 둡니다.
 */
export function SidebarBrand({ on = 'dark', env = '프로덕션' }) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
      <Logo on={on} height={22} />
      {env && (
        <span className={
          'shrink-0 rounded-sm border border-sidebar-border px-1.5 py-0.5 text-micro font-medium text-sidebar-muted'
        }>
          {env}
        </span>
      )}
    </div>
  )
}
