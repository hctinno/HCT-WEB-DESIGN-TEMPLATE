import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import './styles/index.css'
import { DashboardPage } from './pages/DashboardPage'
import { ListPage } from './pages/ListPage'
import { applyTheme, getStoredTheme } from './lib/theme'

/**
 * 미리보기 진입점 — `npm run dev`
 *
 * 대시보드의 지표를 클릭하면 그 질의를 들고 목록 화면으로 넘어갑니다.
 * 이 연결이 두 화면이 **같은 데이터 모델을 공유한다**는 증거입니다.
 * 실제 앱에서는 라우터가 이 역할을 합니다(질의를 URL 에 직렬화).
 */
function Preview() {
  const initial = new URLSearchParams(location.search).get('page')
  const [page, setPage] = useState(initial === 'list' ? 'list' : 'dashboard')
  const [handoffQuery, setHandoffQuery] = useState(null)
  const [theme, setTheme] = useState(getStoredTheme)

  useEffect(() => { applyTheme(theme) }, [theme])

  const drillDown = (query) => { setHandoffQuery(query); setPage('list') }

  return (
    <>
      {page === 'list'
        ? <ListPage key={JSON.stringify(handoffQuery)} initialQuery={handoffQuery} />
        : <DashboardPage onDrillDown={drillDown} />}

      {/* 미리보기 전용 컨트롤 — 실제 앱에는 없습니다 */}
      <div className="fixed bottom-3 right-3 z-toast flex items-center gap-1 rounded-lg border border-line-default bg-bg-raised p-1 shadow-lg">
        <Chip active={page === 'dashboard'} onClick={() => { setHandoffQuery(null); setPage('dashboard') }}>대시보드</Chip>
        <Chip active={page === 'list'} onClick={() => { setHandoffQuery(null); setPage('list') }}>목록</Chip>
        <span className="mx-1 h-4 w-px bg-line-default" />
        {['light', 'dark', 'system'].map((mode) => (
          <Chip key={mode} active={theme === mode} onClick={() => setTheme(mode)}>
            {mode === 'light' ? '라이트' : mode === 'dark' ? '다크' : '시스템'}
          </Chip>
        ))}
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

createRoot(document.getElementById('root')).render(<Preview />)
