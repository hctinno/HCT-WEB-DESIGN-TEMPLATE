import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import './styles/index.css'
import { DashboardPage } from './pages/DashboardPage'
import { ListPage } from './pages/ListPage'
import { applyTheme, getStoredTheme } from './lib/theme'

/**
 * 미리보기 진입점 — `npm run dev` 로 실행합니다.
 *
 * 이 파일은 디자인 시스템을 눈으로 확인하기 위한 것입니다.
 * 실제 앱에서는 이 파일 대신 각자의 진입점을 만드세요.
 * 우상단 컨트롤로 페이지와 테마를 전환할 수 있습니다.
 */
const PAGES = {
  dashboard: { label: '대시보드', Component: DashboardPage },
  list: { label: '목록 + 상세', Component: ListPage },
}

function Preview() {
  const initial = new URLSearchParams(location.search).get('page')
  const [page, setPage] = useState(PAGES[initial] ? initial : 'dashboard')
  const [theme, setTheme] = useState(getStoredTheme)

  useEffect(() => { applyTheme(theme) }, [theme])

  const { Component } = PAGES[page]

  return (
    <>
      <Component />

      {/* 미리보기 전용 컨트롤 — 실제 앱에는 없습니다 */}
      <div className="fixed bottom-3 right-3 z-toast flex items-center gap-1 rounded-lg border border-line-default bg-bg-raised p-1 shadow-lg">
        {Object.entries(PAGES).map(([key, { label }]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPage(key)}
            className={
              'h-control-sm rounded-md px-2 text-xs font-medium ' +
              (page === key
                ? 'bg-accent-subtle text-accent-text'
                : 'text-fg-secondary hover:bg-bg-hover')
            }
          >
            {label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-line-default" />
        {['light', 'dark', 'system'].map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setTheme(mode)}
            className={
              'h-control-sm rounded-md px-2 text-xs font-medium ' +
              (theme === mode
                ? 'bg-accent-subtle text-accent-text'
                : 'text-fg-secondary hover:bg-bg-hover')
            }
          >
            {mode === 'light' ? '라이트' : mode === 'dark' ? '다크' : '시스템'}
          </button>
        ))}
      </div>
    </>
  )
}

createRoot(document.getElementById('root')).render(<Preview />)
