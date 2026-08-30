import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import './styles/index.css'
import { DashboardPage } from './pages/DashboardPage'
import { ListPage } from './pages/ListPage'
import { SettingsPage } from './pages/SettingsPage'
import { ScalePage } from './pages/ScalePage'
import { LoginPage } from './pages/LoginPage'
import { AdminPage } from './pages/AdminPage'
import { InviteAcceptPage, PasswordResetRequestPage, PasswordResetPage } from './pages/AuthPages'
import { ErrorPagesDemo } from './pages/ErrorPages'
import { applyTheme, getStoredTheme, applyPalette, getStoredPalette, PALETTES } from './lib/theme'
import { ToastProvider } from './components/feedback/Toast'

/**
 * 미리보기 진입점 — `npm run dev`
 *
 * 대시보드의 지표를 클릭하면 그 질의를 들고 목록 화면으로 넘어갑니다.
 * 이 연결이 두 화면이 **같은 데이터 모델을 공유한다**는 증거입니다.
 * 실제 앱에서는 라우터가 이 역할을 합니다(질의를 URL 에 직렬화).
 *
 * 하단 컨트롤의 팔레트 전환은 미리보기용입니다. 실제 제품은 팔레트를
 * 하나 정해 고정합니다 — theme.js 의 DEFAULT_PALETTE 를 바꾸세요.
 */
/**
 * 미리보기 화면 목록.
 *
 * 화면이 늘면서 칩을 한 줄에 늘어놓을 수 없게 되었습니다. 이 목록은
 * 미리보기 전용이며, 실제 앱의 내비게이션은 pages/_shell.jsx 의 NAV 입니다.
 */
const PAGE_GROUPS = [
  {
    label: '인증',
    pages: [
      { id: 'login', label: '로그인' },
      { id: 'invite', label: '초대 수락' },
      { id: 'reset-request', label: '비밀번호 재설정 요청' },
      { id: 'reset', label: '새 비밀번호 설정' },
    ],
  },
  {
    label: '업무',
    pages: [
      { id: 'dashboard', label: '대시보드' },
      { id: 'list', label: '요청 목록' },
      { id: 'scale', label: '대용량 목록' },
    ],
  },
  {
    label: '관리',
    pages: [
      { id: 'admin', label: '사용자와 권한' },
      { id: 'settings', label: '환경설정' },
    ],
  },
  {
    label: '오류',
    pages: [
      { id: 'errors', label: '오류 화면 4종' },
    ],
  },
]

const PAGE_IDS = PAGE_GROUPS.flatMap((g) => g.pages.map((p) => p.id))

/** _shell.jsx 의 NAV 항목 id → 미리보기 화면 id */
const NAV_TO_PAGE = { users: 'admin' }

function Preview() {
  const initial = new URLSearchParams(location.search).get('page')
  const [page, setPage] = useState(PAGE_IDS.includes(initial) ? initial : 'dashboard')
  const [pagesOpen, setPagesOpen] = useState(false)
  const [handoffQuery, setHandoffQuery] = useState(null)
  const [theme, setTheme] = useState(getStoredTheme)
  const [palette, setPalette] = useState(getStoredPalette)
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState(false)

  useEffect(() => { applyTheme(theme) }, [theme])
  useEffect(() => { applyPalette(palette) }, [palette])

  const drillDown = (query) => { setHandoffQuery(query); setPage('list') }

  /*
   * 사이드바가 실제로 이동하게 만듭니다.
   * NAV 의 항목 id 와 미리보기 화면 id 가 항상 같지는 않고, 아직 만들지
   * 않은 항목도 있습니다. 없는 화면은 그냥 무시합니다 — 미리보기에서
   * 빈 화면으로 떨어지는 것보다 아무 일도 없는 편이 덜 헷갈립니다.
   */
  const goto = (id) => {
    const target = NAV_TO_PAGE[id] ?? id
    if (PAGE_IDS.includes(target)) { setHandoffQuery(null); setPage(target) }
  }
  const current = PALETTES.find((p) => p.id === palette)
  const currentPage = PAGE_GROUPS.flatMap((g) => g.pages).find((p) => p.id === page)

  return (
    <>
      {page === 'login' ? <LoginPage onSignedIn={() => setPage('dashboard')} />
        : page === 'invite' ? <InviteAcceptPage onAccepted={() => setPage('dashboard')} />
        : page === 'reset-request' ? <PasswordResetRequestPage onBack={() => setPage('login')} />
        : page === 'reset' ? <PasswordResetPage onDone={() => setPage('login')} />
        : page === 'errors' ? <ErrorPagesDemo onNavigate={goto} />
        : page === 'list' ? <ListPage key={JSON.stringify(handoffQuery)} initialQuery={handoffQuery} onNavigate={goto} />
        : page === 'admin' ? <AdminPage onNavigate={goto} />
        : page === 'settings' ? <SettingsPage onNavigate={goto} />
        : page === 'scale' ? <ScalePage />
        : <DashboardPage onDrillDown={drillDown} onNavigate={goto} />}

      {/* 미리보기 전용 컨트롤 — 평소엔 작은 버튼 하나로 접혀 있습니다.
          펼친 채로 두면 하단 중앙의 저장 바·벌크 바나 차트 라벨을 가립니다. */}
      <div className="fixed bottom-3 right-3 z-palette flex flex-col items-end gap-1.5">
        {shown && pagesOpen && (
          <div className="scroll-thin max-h-[70vh] w-[248px] overflow-y-auto rounded-lg border border-line-default bg-bg-raised p-1.5 shadow-overlay">
            {PAGE_GROUPS.map((group) => (
              <div key={group.label} className="mb-1.5 last:mb-0">
                <p className="px-1.5 pb-1 pt-0.5 text-micro font-semibold uppercase tracking-[0.06em] text-fg-tertiary">
                  {group.label}
                </p>
                {group.pages.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setHandoffQuery(null); setPage(p.id); setPagesOpen(false) }}
                    aria-pressed={page === p.id}
                    className={
                      'flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left ' +
                      (page === p.id ? 'bg-accent-subtle' : 'hover:bg-bg-hover')
                    }
                  >
                    <span className={
                      'min-w-0 flex-1 truncate text-sm ' +
                      (page === p.id ? 'font-semibold text-accent-text' : 'text-fg-primary')
                    }>
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {shown && open && (
          <div className="w-[248px] rounded-lg border border-line-default bg-bg-raised p-1.5 shadow-overlay">
            <p className="px-1.5 pb-1 pt-0.5 text-micro font-semibold uppercase tracking-[0.06em] text-fg-tertiary">
              색 팔레트
            </p>
            {PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPalette(p.id)}
                aria-pressed={palette === p.id}
                className={
                  'flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left ' +
                  (palette === p.id ? 'bg-accent-subtle' : 'hover:bg-bg-hover')
                }
              >
                <Swatch id={p.id} />
                <span className="min-w-0 flex-1">
                  <span className={
                    'block truncate text-sm ' +
                    (palette === p.id ? 'font-semibold text-accent-text' : 'text-fg-primary')
                  }>
                    {p.label}
                  </span>
                  <span className="block truncate text-micro text-fg-tertiary">{p.tagline}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {shown && (
          <div className="flex items-center gap-1 rounded-lg border border-line-default bg-bg-raised p-1 shadow-lg">
            <button
              type="button"
              onClick={() => { setPagesOpen((v) => !v); setOpen(false) }}
              aria-expanded={pagesOpen}
              className={
                'flex h-control-sm items-center gap-1.5 rounded-md px-2 text-xs font-medium ' +
                (pagesOpen ? 'bg-accent-subtle text-accent-text' : 'text-fg-secondary hover:bg-bg-hover')
              }
            >
              {currentPage?.label ?? '화면'}
              <span className="text-fg-tertiary">▾</span>
            </button>
            <span className="mx-0.5 h-4 w-px bg-line-default" />
            {['light', 'dark', 'system'].map((mode) => (
              <Chip key={mode} active={theme === mode} onClick={() => setTheme(mode)}>
                {mode === 'light' ? '라이트' : mode === 'dark' ? '다크' : '시스템'}
              </Chip>
            ))}
            <span className="mx-0.5 h-4 w-px bg-line-default" />
            <button
              type="button"
              onClick={() => { setOpen((v) => !v); setPagesOpen(false) }}
              aria-expanded={open}
              className={
                'flex h-control-sm items-center gap-1.5 rounded-md px-2 text-xs font-medium ' +
                (open ? 'bg-accent-subtle text-accent-text' : 'text-fg-secondary hover:bg-bg-hover')
              }
            >
              <Swatch id={palette} />
              {current?.label}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => { setShown((v) => !v); if (shown) { setOpen(false); setPagesOpen(false) } }}
          aria-label={shown ? '미리보기 컨트롤 숨기기' : '미리보기 컨트롤 보기'}
          title="미리보기 컨트롤"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line-default bg-bg-raised text-fg-secondary shadow-lg hover:text-fg-primary"
        >
          {shown ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="2.25" stroke="currentColor" strokeWidth="1.4" />
              <path d="M7 1.5v1.5M7 11v1.5M12.5 7H11M3 7H1.5M10.9 3.1l-1 1M4.1 9.9l-1 1M10.9 10.9l-1-1M4.1 4.1l-1-1"
                    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
    </>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'h-control-sm rounded-md px-2 text-xs font-medium ' +
        (active ? 'bg-accent-subtle text-accent-text' : 'text-fg-secondary hover:bg-bg-hover')
      }
    >
      {children}
    </button>
  )
}

createRoot(document.getElementById('root')).render(
  <ToastProvider>
    <Preview />
  </ToastProvider>,
)
