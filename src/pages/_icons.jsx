/**
 * 내비게이션 아이콘 세트 (16px 그리드).
 *
 * 개발 에이전트 주의:
 *   - 아이콘은 항상 16px 뷰박스, 1.5 스트로크, currentColor 를 씁니다.
 *   - 아이콘 라이브러리(lucide 등)를 쓴다면 size={16} strokeWidth={1.5} 로 고정하세요.
 *     굵기가 섞이면 화면이 즉시 지저분해집니다.
 */
const base = {
  width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.5,
  strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const NavIcons = {
  Dashboard: () => (
    <svg {...base}>
      <rect x="2" y="2" width="5.5" height="5.5" rx="1.25" />
      <rect x="8.5" y="2" width="5.5" height="5.5" rx="1.25" />
      <rect x="2" y="8.5" width="5.5" height="5.5" rx="1.25" />
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.25" />
    </svg>
  ),
  Chart: () => (
    <svg {...base}>
      <path d="M2 13.5V2.5" /><path d="M2 13.5h12" />
      <path d="M5 11V7.5M8 11V4.5M11 11V9" />
    </svg>
  ),
  List: () => (
    <svg {...base}>
      <path d="M5.5 4h8.5M5.5 8h8.5M5.5 12h8.5" />
      <circle cx="2.5" cy="4" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="2.5" cy="8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="2.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ),
  Alert: () => (
    <svg {...base}>
      <path d="M8 2.5a4 4 0 00-4 4v3l-1.25 2h10.5L12 9.5v-3a4 4 0 00-4-4z" />
      <path d="M6.5 13.5a1.6 1.6 0 003 0" />
    </svg>
  ),
  Users: () => (
    <svg {...base}>
      <circle cx="6" cy="5.5" r="2.5" />
      <path d="M1.75 13.5a4.25 4.25 0 018.5 0" />
      <path d="M10.5 3.4a2.5 2.5 0 010 4.2M11.75 13.5a4.3 4.3 0 00-1.2-3" />
    </svg>
  ),
  Settings: () => (
    <svg {...base}>
      <circle cx="8" cy="8" r="2.25" />
      <path d="M8 1.75v1.5M8 12.75v1.5M14.25 8h-1.5M3.25 8h-1.5M12.42 3.58l-1.06 1.06M4.64 11.36l-1.06 1.06M12.42 12.42l-1.06-1.06M4.64 4.64L3.58 3.58" />
    </svg>
  ),
  Plus: () => (<svg {...base}><path d="M8 3.5v9M3.5 8h9" /></svg>),
  Download: () => (
    <svg {...base}><path d="M8 2.5v7.5M5 7.5L8 10.5l3-3" /><path d="M2.5 12.5h11" /></svg>
  ),
  Filter: () => (
    <svg {...base}><path d="M2 3.5h12L9.5 8.5v4l-3 1.5v-5.5L2 3.5z" /></svg>
  ),
  Inbox: () => (
    <svg {...base}>
      <rect x="2" y="3" width="12" height="10" rx="2" />
      <path d="M2 9h3l1 1.5h4L11 9h3" />
    </svg>
  ),
}
