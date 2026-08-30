import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import './styles/index.css'
import { DashboardPage } from './pages/DashboardPage'
import { ListPage } from './pages/ListPage'
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
function Preview() {
  const initial = new URLSearchParams(location.search).get('page')
  const [page, setPage] = useState(initial === 'list' ? 'list' : 'dashboard')
  const [handoffQuery, setHandoffQuery] = useState(null)
  const [theme, setTheme] = useState(getStoredTheme)
  const [palette, setPalette] = useState(getStoredPalette)
  const [open, setOpen] = useState(false)

  useEffect(() => { applyTheme(theme) }, [theme])
  useEffect(() => { applyPalette(palette) }, [palette])

  const drillDown = (query) => { setHandoffQuery(query); setPage('list') }
  const current = PALETTES.find((p) => p.id === palette)

  return (
    <>
      {page === 'list'
        ? <ListPage key={JSON.stringify(handoffQuery)} initialQuery={handoffQuery} />
        : <DashboardPage onDrillDown={drillDown} />}

      {/* 미리보기 전용 컨트롤 — 실제 앱에는 없습니다 */}
      <div className="fixed bottom-3 right-3 z-toast flex flex-col items-end gap-1.5">
        {open && (
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

        <div className="flex items-center gap-1 rounded-lg border border-line-default bg-bg-raised p-1 shadow-lg">
          <Chip active={page === 'dashboard'} onClick={() => { setHandoffQuery(null); setPage('dashboard') }}>대시보드</Chip>
          <Chip active={page === 'list'} onClick={() => { setHandoffQuery(null); setPage('list') }}>목록</Chip>
          <span className="mx-0.5 h-4 w-px bg-line-default" />
          {['light', 'dark', 'system'].map((mode) => (
            <Chip key={mode} active={theme === mode} onClick={() => setTheme(mode)}>
              {mode === 'light' ? '라이트' : mode === 'dark' ? '다크' : '시스템'}
            </Chip>
          ))}
          <span className="mx-0.5 h-4 w-px bg-line-default" />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
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
      </div>
    </>
  )
}

/** 팔레트 미리보기 점 — 강조색을 실제 토큰에서 읽어옵니다 */
function Swatch({ id }) {
  return (
    <span
      aria-hidden="true"
      data-palette={id}
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-line-default"
      style={{ backgroundColor: 'var(--hct-accent-600)' }}
    />
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
