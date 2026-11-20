/**
 * 부품 카드 — DESIGN.md §7 의 "라이브러리형" 명세 원본.
 *
 * 왜 데이터로 두는가:
 *
 *   §7 을 문장으로만 두면 컴포넌트 코드가 바뀔 때 조용히 어긋납니다.
 *   카드를 데이터로 두고 생성기(build-design-md.mjs)와 검사기가 같은 데이터를
 *   읽게 하면, 어긋나는 순간 빌드 · 테스트 · CI 가 멈춥니다.
 *
 * 카드 한 장의 고정 형식:
 *
 *   구조 · 종류(prop) · 상태 7가지 · 토큰 · 접근성 · 할 것 / 하지 말 것
 *   · React 예 · 순수 HTML+CSS 예
 *
 * 무엇이 검사되는가 (checkCards):
 *
 *   - 소스 파일과 export 가 실제로 있는가
 *   - 종류 · 크기 목록이 소스의 객체 키와 **정확히** 같은가 (빠진 것 · 남는 것 모두 실패)
 *   - 기본값이 소스 함수 서명의 기본값과 같은가
 *   - 카드 · CSS 가 가리키는 토큰이 tokens.css 에 있는가, CSS 에 #RRGGBB 가 없는가
 *   - React 예의 import 가 패키지 진입점에 있는가
 *   - 상태 7가지가 모두 채워졌는가 ("해당 없음" 도 적어야 함)
 *
 *   그리고 a11y 잡의 `npm run audit:cards` 가 probes 를 크로미엄으로 그려
 *   **실제 React 컴포넌트**와 **이 카드의 HTML+CSS** 의 계산된 스타일을 비교합니다.
 *
 * 설명을 고치려면 이 파일을, 부품 밖 문장은 scripts/design-md.template.md 를 고칩니다.
 */

export const STATE_KEYS = ['default', 'hover', 'focus', 'active', 'disabled', 'loading', 'error']
export const STATE_LABELS = {
  default: '기본',
  hover: 'hover (마우스를 올림)',
  focus: 'focus (키보드 포커스)',
  active: 'active (누르는 중 · 선택됨)',
  disabled: 'disabled',
  loading: 'loading',
  error: 'error',
}
const NA = '해당 없음'
const FOCUS_RING = '③ 기본 레이어의 `:focus-visible` 링 — `2px solid var(--color-border-focus)` · 간격 1px'

/* 카드 HTML 예가 함께 쓰는 공통 CSS — 프리플라이트(초기화 CSS)가 없는 환경에서도 같은 모양이 되게 */
export const SHARED_CSS = `/* 부품 카드 공통 — 프레임워크 초기화 CSS 가 없어도 같은 모양이 되게 */
.hct-btn, .hct-input, .hct-filter-btn, .hct-segmented__tab, .hct-nav-item,
.hct-badge, .hct-tag, .hct-banner, .hct-metric, .hct-widget, .hct-modal, .hct-drawer,
.hct-toast, .hct-listbox, .hct-skeleton, .hct-empty__icon, .hct-segmented {
  box-sizing: border-box;
}
.hct-btn, .hct-input, .hct-filter-btn, .hct-segmented__tab, .hct-nav-item, button.hct-metric {
  margin: 0;
  font-family: inherit;
  letter-spacing: inherit;
  text-transform: none;
}
.hct-btn, .hct-filter-btn, .hct-segmented__tab, .hct-nav-item, button.hct-metric { cursor: pointer; }
@keyframes hct-spin { to { transform: rotate(360deg); } }
@keyframes hct-shimmer { 100% { transform: translateX(100%); } }`

export const CARDS = [
  /* ───────────────────────────── 버튼 ───────────────────────────── */
  {
    id: 'button',
    heading: '버튼',
    source: 'src/components/input/Button.jsx',
    exports: ['Button', 'IconButton'],
    props: [
      {
        name: 'variant', from: 'VARIANTS', default: 'secondary',
        notes: {
          primary: '화면의 주 행동 — 화면당 1개',
          secondary: '대부분의 버튼',
          ghost: '툴바 · 아이콘',
          danger: '삭제 · 해지',
          'danger-subtle': '파괴적이지만 부차적인 행동',
        },
      },
      {
        name: 'size', from: 'SIZES', default: 'md',
        notes: { xs: '24px', sm: '28px', md: '32px', lg: '36px' },
      },
    ],
    anatomy: '`[아이콘?] 글자 [아이콘?]` 한 줄 · 아이콘 전용은 `IconButton`(정사각형, 이름 필수)',
    states: {
      default: '종류 표의 바탕 · 글자 · 테두리',
      hover: '종류 표의 "마우스를 올리면"',
      focus: FOCUS_RING,
      active: NA + ' — 누르는 중의 별도 모양은 없습니다',
      disabled: '불투명도 50% · `cursor: not-allowed` · 눌리지 않음',
      loading: '왼쪽 아이콘 자리에 14px 회전 표시 · `aria-busy="true"` · 눌리지 않음',
      error: NA,
    },
    tokens: ['--color-accent-solid', '--color-accent-solid-hover', '--color-text-inverse', '--color-bg-surface',
      '--color-text-primary', '--color-text-secondary', '--color-border-default', '--color-bg-hover',
      '--color-danger-solid', '--color-danger-text', '--color-danger-border', '--color-danger-bg',
      '--control-height-xs', '--control-height-sm', '--control-height-md', '--control-height-lg',
      '--duration-instant', '--easing-standard'],
    a11y: [
      '`<button type="button">` 을 씁니다. `<div onclick>` 금지',
      '아이콘 전용 버튼은 `aria-label` 필수 (`IconButton` 의 `label`)',
      '손가락 입력 기기에서는 높이가 44px 로 올라갑니다 (§2-1 ②)',
    ],
    do: ['화면당 primary 1개', '되돌릴 수 없는 행동에만 danger'],
    dont: ['버튼 색을 직접 칠하기', '같은 줄에 primary 두 개', '포커스 링 지우기'],
    react: `import { Button, IconButton } from 'hct-web-design-template'

<Button variant="primary" onClick={save}>저장</Button>
<Button loading>저장 중</Button>
<IconButton icon={<SearchIcon />} label="검색" />`,
    html: `<button type="button" class="hct-btn hct-btn--primary">저장</button>
<button type="button" class="hct-btn" disabled>취소</button>
<button type="button" class="hct-btn hct-btn--ghost hct-btn--icon" aria-label="검색"><svg …/></button>`,
    css: `.hct-btn {
  display: inline-flex; flex-shrink: 0; align-items: center; justify-content: center;
  white-space: nowrap; font-weight: 500;
  height: var(--control-height-md); padding: 0 12px; gap: 6px; border-radius: 6px;
  font-size: 0.875rem; line-height: 1.25rem;
  border: 1px solid var(--color-border-default);
  background-color: var(--color-bg-surface); color: var(--color-text-primary);
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-duration: var(--duration-instant); transition-timing-function: var(--easing-standard);
}
.hct-btn:hover { background-color: var(--color-bg-hover); }
.hct-btn:disabled, .hct-btn[aria-busy="true"] { cursor: not-allowed; opacity: 0.5; }
.hct-btn--primary { background-color: var(--color-accent-solid); color: var(--color-text-inverse); border-color: transparent; }
.hct-btn--primary:hover { background-color: var(--color-accent-solid-hover); }
.hct-btn--ghost { background-color: transparent; color: var(--color-text-secondary); border-color: transparent; }
.hct-btn--ghost:hover { background-color: var(--color-bg-hover); color: var(--color-text-primary); }
.hct-btn--danger { background-color: var(--color-danger-solid); color: var(--color-text-inverse); border-color: transparent; }
.hct-btn--danger:hover { background-color: var(--color-danger-solid); opacity: 0.9; }
.hct-btn--danger-subtle { background-color: transparent; color: var(--color-danger-text); border-color: var(--color-danger-border); }
.hct-btn--danger-subtle:hover { background-color: var(--color-danger-bg); }
.hct-btn--xs { height: var(--control-height-xs); padding: 0 6px; gap: 4px; border-radius: 3px; font-size: 0.75rem; line-height: 1rem; }
.hct-btn--sm { height: var(--control-height-sm); padding: 0 8px; gap: 4px; font-size: 0.75rem; line-height: 1rem; }
.hct-btn--lg { height: var(--control-height-lg); padding: 0 16px; gap: 8px; }
.hct-btn--icon { padding: 0; width: var(--control-height-md); }
.hct-btn__spinner { width: 14px; height: 14px; animation: hct-spin 1s linear infinite; }`,
    probes: [
      ...['primary', 'secondary', 'ghost', 'danger', 'danger-subtle'].map((v) => ({
        label: `variant=${v}`,
        react: ['Button', { variant: v, children: '저장' }],
        html: `<button type="button" class="hct-btn${v === 'secondary' ? '' : ` hct-btn--${v}`}">저장</button>`,
        hover: true,
      })),
      ...['xs', 'sm', 'lg'].map((s) => ({
        label: `size=${s}`,
        react: ['Button', { size: s, children: '저장' }],
        html: `<button type="button" class="hct-btn hct-btn--${s}">저장</button>`,
      })),
      { label: 'disabled', react: ['Button', { disabled: true, children: '저장' }], html: '<button type="button" class="hct-btn" disabled>저장</button>' },
    ],
  },

  /* ───────────────────────────── 입력 ───────────────────────────── */
  {
    id: 'input',
    heading: '입력',
    source: 'src/components/input/Input.jsx',
    exports: ['TextField'],
    props: [
      { name: 'size', from: 'heights', within: 'TextField', default: 'md', notes: { sm: '28px · 13px 글자', md: '32px', lg: '36px' } },
    ],
    anatomy: '라벨(위) → 입력 칸(왼쪽 아이콘 선택) → 도움말 또는 오류 문장(아래)',
    states: {
      default: '바탕 `bg-surface` · 테두리 `border-default` · 안내문 `text-tertiary`',
      hover: NA + ' — 마우스를 올려도 바뀌지 않습니다',
      focus: '테두리 `border-focus` + 같은 색 1px 링 (기본 포커스 링 대신)',
      active: NA,
      disabled: '바탕 `bg-sunken` · 글자 `text-disabled` · `cursor: not-allowed`',
      loading: NA,
      error: '테두리 `danger-border` · `aria-invalid="true"` · 4px 아래 12px `danger-text` 문장(색만으로 알리지 않음)',
    },
    tokens: ['--color-bg-surface', '--color-border-default', '--color-text-primary', '--color-text-tertiary',
      '--color-text-secondary', '--color-border-focus', '--color-bg-sunken', '--color-text-disabled',
      '--color-danger-border', '--color-danger-text', '--control-height-sm', '--control-height-md', '--control-height-lg'],
    a11y: [
      '모든 입력에 `<label for>` — 숨길 때도 지우지 말고 화면에서만 숨김(`hideLabel`)',
      '오류 문장은 `aria-describedby` 로 입력과 잇습니다',
    ],
    do: ['오류는 무엇이 틀렸는지 문장으로'],
    dont: ['빨간 테두리만으로 오류 표시', '안내문(placeholder)을 라벨 대신 쓰기'],
    react: `import { TextField } from 'hct-web-design-template'

<TextField label="이름" value={name} onChange={(e) => setName(e.target.value)} />
<TextField label="이메일" error="이메일 형식이 아닙니다" />`,
    html: `<div class="hct-field">
  <label class="hct-field__label" for="name">이름</label>
  <input class="hct-input" id="name" aria-invalid="true" aria-describedby="name-error" />
  <p class="hct-field__error" id="name-error">이름을 입력하세요</p>
</div>`,
    css: `.hct-field__label { display: block; margin: 0 0 4px; font-size: 0.75rem; line-height: 1rem; font-weight: 500; color: var(--color-text-secondary); }
.hct-input {
  width: 100%; height: var(--control-height-md); padding: 0 8px;
  border: 1px solid var(--color-border-default); border-radius: 6px;
  background-color: var(--color-bg-surface); color: var(--color-text-primary);
  font-size: 0.875rem; line-height: 1.25rem;
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-duration: var(--duration-instant);
}
.hct-input::placeholder { color: var(--color-text-tertiary); opacity: 1; }
.hct-input:focus { outline: none; border-color: var(--color-border-focus); box-shadow: 0 0 0 1px var(--color-border-focus); }
.hct-input:disabled { cursor: not-allowed; background-color: var(--color-bg-sunken); color: var(--color-text-disabled); }
.hct-input[aria-invalid="true"] { border-color: var(--color-danger-border); }
.hct-input--sm { height: var(--control-height-sm); font-size: 0.8125rem; line-height: 1.125rem; }
.hct-input--lg { height: var(--control-height-lg); }
.hct-field__hint, .hct-field__error { margin: 4px 0 0; font-size: 0.75rem; line-height: 1rem; }
.hct-field__hint { color: var(--color-text-tertiary); }
.hct-field__error { color: var(--color-danger-text); }`,
    probes: [
      { label: '입력 칸', react: ['TextField', { label: '이름' }], html: '<label class="hct-field__label">이름</label><input class="hct-input" />', select: 'input' },
      { label: '라벨', react: ['TextField', { label: '이름' }], html: '<label class="hct-field__label">이름</label><input class="hct-input" />', select: 'label' },
      { label: 'error 입력', react: ['TextField', { label: '이름', error: '필수입니다' }], html: '<label class="hct-field__label">이름</label><input class="hct-input" aria-invalid="true" /><p class="hct-field__error">필수입니다</p>', select: 'input' },
      { label: 'error 문장', react: ['TextField', { label: '이름', error: '필수입니다' }], html: '<label class="hct-field__label">이름</label><input class="hct-input" aria-invalid="true" /><p class="hct-field__error">필수입니다</p>', select: 'p' },
      { label: 'disabled', react: ['TextField', { label: '이름', disabled: true }], html: '<label class="hct-field__label">이름</label><input class="hct-input" disabled />', select: 'input' },
      { label: 'size=sm', react: ['TextField', { label: '이름', size: 'sm' }], html: '<label class="hct-field__label">이름</label><input class="hct-input hct-input--sm" />', select: 'input' },
    ],
  },

  /* ───────────────────────────── 상태 배지 ───────────────────────────── */
  {
    id: 'badge',
    heading: '상태 배지',
    source: 'src/components/feedback/StatusBadge.jsx',
    exports: ['StatusBadge', 'Tag'],
    props: [
      { name: 'tone', from: 'TONES', default: null, notes: { neutral: '대기 · 보관', info: '진행', review: '검토', success: '완료', warning: '보류 · 주의', danger: '실패 · 차단' } },
      { name: 'size', keys: ['sm', 'md'], default: 'md', notes: { sm: '16px · 촘촘한 표', md: '20px' } },
    ],
    anatomy: '`[점?] 라벨` — 색조의 바탕 · 글자 · 테두리. 상태 이름(`status`)을 주면 색조와 라벨이 §2-3 표대로 정해집니다',
    states: {
      default: '§2-3 색조의 `bg` · `text` · `border`', hover: NA + ' — 누를 수 없는 표시입니다', focus: NA,
      active: NA, disabled: NA, loading: NA, error: '`danger` 색조 (상태의 하나일 뿐 별도 모양 없음)',
    },
    tokens: ['--color-neutral-bg', '--color-neutral-text', '--color-neutral-border', '--color-neutral-solid',
      '--color-info-bg', '--color-info-text', '--color-info-border', '--color-success-bg', '--color-success-text',
      '--color-warning-bg', '--color-warning-text', '--color-danger-bg', '--color-danger-text',
      '--color-review-bg', '--color-review-text', '--color-bg-sunken', '--color-border-subtle'],
    a11y: ['상태는 글자로 읽힙니다 — 점만 단독으로 쓰지 않습니다', '배지는 문장 안 정보라 `role` 을 달지 않습니다'],
    do: ['상태 이름 → 색조는 §2-3 표로만', '분류(라벨 · 카테고리)는 중립 태그 `Tag`'],
    dont: ['화면마다 상태 색을 새로 고르기', '분류에 상태 색 쓰기'],
    react: `import { StatusBadge, Tag } from 'hct-web-design-template'

<StatusBadge status="in_progress" />
<StatusBadge tone="danger" size="sm" dot>차단</StatusBadge>
<Tag>백엔드</Tag>`,
    html: `<span class="hct-badge hct-badge--info">진행중</span>
<span class="hct-badge hct-badge--danger hct-badge--sm"><span class="hct-badge__dot"></span>차단</span>
<span class="hct-tag">백엔드</span>`,
    css: `.hct-badge {
  display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;
  height: 20px; padding: 0 6px; border: 1px solid; border-radius: 3px;
  font-size: 0.75rem; line-height: 1rem; font-weight: 500;
  background-color: var(--color-neutral-bg); color: var(--color-neutral-text); border-color: var(--color-neutral-border);
}
.hct-badge--sm { height: 16px; padding: 0 4px; font-size: 0.6875rem; line-height: 0.875rem; }
.hct-badge__dot { width: 6px; height: 6px; flex-shrink: 0; border-radius: 9999px; background-color: var(--color-neutral-solid); }
.hct-badge--info { background-color: var(--color-info-bg); color: var(--color-info-text); border-color: var(--color-info-border); }
.hct-badge--info .hct-badge__dot { background-color: var(--color-info-solid); }
.hct-badge--success { background-color: var(--color-success-bg); color: var(--color-success-text); border-color: var(--color-success-border); }
.hct-badge--success .hct-badge__dot { background-color: var(--color-success-solid); }
.hct-badge--warning { background-color: var(--color-warning-bg); color: var(--color-warning-text); border-color: var(--color-warning-border); }
.hct-badge--warning .hct-badge__dot { background-color: var(--color-warning-solid); }
.hct-badge--danger { background-color: var(--color-danger-bg); color: var(--color-danger-text); border-color: var(--color-danger-border); }
.hct-badge--danger .hct-badge__dot { background-color: var(--color-danger-solid); }
.hct-badge--review { background-color: var(--color-review-bg); color: var(--color-review-text); border-color: var(--color-review-border); }
.hct-badge--review .hct-badge__dot { background-color: var(--color-review-solid); }
.hct-tag {
  display: inline-flex; align-items: center; gap: 4px; height: 20px; padding: 0 6px;
  border: 1px solid var(--color-border-subtle); border-radius: 3px; background-color: var(--color-bg-sunken);
  font-size: 0.75rem; line-height: 1rem; color: var(--color-text-secondary);
}`,
    probes: [
      ...['neutral', 'info', 'success', 'warning', 'danger', 'review'].map((t) => ({
        label: `tone=${t}`,
        react: ['StatusBadge', { tone: t, children: '상태' }],
        html: `<span class="hct-badge${t === 'neutral' ? '' : ` hct-badge--${t}`}">상태</span>`,
      })),
      { label: 'size=sm', react: ['StatusBadge', { tone: 'info', size: 'sm', children: '상태' }], html: '<span class="hct-badge hct-badge--info hct-badge--sm">상태</span>' },
      { label: '점', react: ['StatusBadge', { tone: 'danger', dot: true, children: '상태' }], html: '<span class="hct-badge hct-badge--danger"><span class="hct-badge__dot"></span>상태</span>', select: 'span > span' },
      { label: 'Tag', react: ['Tag', { children: '백엔드' }], html: '<span class="hct-tag">백엔드</span>' },
    ],
  },

  /* ───────────────────────────── 사이드바 ───────────────────────────── */
  {
    id: 'sidebar',
    heading: '사이드바',
    source: 'src/components/shell/Sidebar.jsx',
    exports: ['Sidebar', 'SidebarGroup', 'SidebarItem', 'SidebarUser', 'WorkspaceRail'],
    props: [],
    anatomy: '머리(로고 · 환경) → 그룹 라벨 → 항목 `[아이콘 16px] 이름 [멘션 배지 | 건수]` → 바닥(현재 사용자)',
    states: {
      default: '글자 `sidebar-fg-muted` · 굵기 400', hover: '바탕 `sidebar-hover` · 글자 `sidebar-fg`',
      focus: '포커스 링 색을 `sidebar-fg` 로 (기본 링은 어두운 사이드바에서 안 보임)',
      active: '현재 화면 — 바탕 `sidebar-active-bg` · 글자 `sidebar-active-fg` · 600 · `aria-current="page"`',
      disabled: NA, loading: NA, error: NA,
    },
    tokens: ['--color-sidebar-bg', '--color-sidebar-fg', '--color-sidebar-fg-muted', '--color-sidebar-fg-subtle',
      '--color-sidebar-hover', '--color-sidebar-active-bg', '--color-sidebar-active-fg', '--color-sidebar-border',
      '--color-sidebar-badge-bg', '--color-sidebar-badge-fg', '--control-height-lg'],
    a11y: ['`<nav>` 안의 `<ul>` · 현재 화면은 `aria-current="page"`', '접힌 상태 · 레일 타일은 이름(`title` · `aria-label`) 필수'],
    do: ['숫자는 멘션 · 건수 · 안 읽음(굵게) 세 가지로 구분'],
    dont: ['모든 숫자를 빨간 배지로', '항목 높이를 줄이기'],
    react: `import { Sidebar, SidebarGroup, SidebarItem } from 'hct-web-design-template'

<Sidebar>
  <SidebarGroup label="업무">
    <SidebarItem icon={<InboxIcon />} label="받은 일" active mentions={3} href="/inbox" />
    <SidebarItem icon={<ListIcon />} label="전체" badge={128} href="/all" />
  </SidebarGroup>
</Sidebar>`,
    html: `<nav class="hct-sidebar"><ul>
  <li><a class="hct-nav-item" href="/inbox" aria-current="page">받은 일</a></li>
  <li><a class="hct-nav-item" href="/all">전체</a></li>
</ul></nav>`,
    css: `.hct-nav-item {
  display: flex; width: 100%; align-items: center; gap: 8px; height: var(--control-height-lg);
  padding: 0 8px; border: 0; border-radius: 6px; background-color: transparent;
  font-size: 0.8125rem; line-height: 1.125rem; font-weight: 400; color: var(--color-sidebar-fg-muted);
  text-decoration: none;
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-duration: var(--duration-instant);
}
.hct-nav-item:hover { background-color: var(--color-sidebar-hover); color: var(--color-sidebar-fg); }
.hct-nav-item[aria-current="page"] { background-color: var(--color-sidebar-active-bg); color: var(--color-sidebar-active-fg); font-weight: 600; }
.hct-sidebar :focus-visible { outline-color: var(--color-sidebar-fg); }`,
    probes: [
      { label: '항목', react: ['SidebarItem', { label: '전체' }], html: '<li><button type="button" class="hct-nav-item">전체</button></li>', select: 'button', hover: true },
      { label: '현재 화면', react: ['SidebarItem', { label: '받은 일', active: true }], html: '<li><button type="button" class="hct-nav-item" aria-current="page">받은 일</button></li>', select: 'button' },
    ],
  },

  /* ───────────────────────────── 표 ───────────────────────────── */
  {
    id: 'table',
    heading: '표',
    source: 'src/components/grid/DataGrid.jsx',
    exports: ['DataGrid'],
    props: [{ name: 'density', keys: ['compact', 'default', 'relaxed'], default: 'default', notes: { compact: '행 32px', default: '행 40px', relaxed: '행 48px' } }],
    anatomy: '머리행(고정) → 행 `[체크박스] 셀… [행 동작]` → 바닥(쪽 넘김)',
    states: {
      default: '행 바탕 `bg-surface` · 행 사이 `border-subtle`', hover: '행 바탕 `bg-hover`', focus: FOCUS_RING + ' (셀 단위 키보드 이동)',
      active: '상세가 열린 행 `bg-active` · 선택한 행 `accent-subtle`', disabled: NA,
      loading: '같은 행 높이의 스켈레톤 6행 (`SkeletonTable`)', error: '표 자리에 오류 블록 (§7 빈 상태)',
    },
    tokens: ['--color-bg-sunken', '--color-text-secondary', '--color-border-default', '--color-border-subtle',
      '--color-bg-surface', '--color-bg-hover', '--color-bg-active', '--color-accent-subtle',
      '--row-height-compact', '--row-height-default', '--row-height-relaxed'],
    a11y: ['실제 `<table>` · `<th scope="col">` 을 씁니다 — `<div>` 로 흉내 내지 않음', '체크박스마다 이름(`aria-label`)'],
    do: ['숫자 · 날짜 열은 머리행까지 오른쪽 정렬 + 고정폭 숫자'],
    dont: ['상태 열에 색 글자만 — 상태 배지를 씁니다'],
    react: `import { DataGrid } from 'hct-web-design-template'

<DataGrid fields={fields} records={rows} density="default" onRowClick={open} />`,
    html: `<table class="hct-table">
  <thead><tr><th scope="col">이름</th><th scope="col" class="hct-num">금액</th></tr></thead>
  <tbody><tr><td>계약 A</td><td class="hct-num">1,200</td></tr></tbody>
</table>`,
    css: `.hct-table { width: 100%; border-collapse: collapse; text-align: left; }
.hct-table th {
  position: sticky; top: 0; height: 32px; padding: 0 8px; background-color: var(--color-bg-sunken);
  border-bottom: 1px solid var(--color-border-default);
  font-size: 0.75rem; line-height: 1rem; font-weight: 600; color: var(--color-text-secondary);
}
.hct-table td {
  height: var(--row-height-default); padding: 0 12px; background-color: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border-subtle); font-size: 0.875rem; line-height: 1.25rem;
}
.hct-table tbody tr:hover td { background-color: var(--color-bg-hover); }
.hct-table tr[aria-selected="true"] td { background-color: var(--color-accent-subtle); }
.hct-table .hct-num { text-align: right; font-variant-numeric: tabular-nums; }`,
    probes: [],
  },

  /* ───────────────────────────── 지표 타일 ───────────────────────────── */
  {
    id: 'metric',
    heading: '지표 타일 (대시보드 KPI)',
    source: 'src/components/dashboard/MetricTile.jsx',
    exports: ['MetricTile'],
    props: [{ name: 'state', from: 'STATE_BORDER', default: 'ok', notes: { ok: '정상', warn: '주의', danger: '위험 — 값 글자도 `danger-text`' } }],
    anatomy: '라벨 [상태 배지] → 값 + 단위 → 증감(비교 대상 함께) → 추이선 → [임계값]',
    states: {
      default: '테두리 `border-subtle`', hover: '누를 수 있는 타일만 — 테두리 `border-strong` · 바탕 `bg-hover` · "N건 보기"',
      focus: FOCUS_RING, active: NA, disabled: NA,
      loading: '같은 크기의 스켈레톤 (`SkeletonStatCard`)', error: '`state="danger"` 는 임계 초과 표시일 뿐 — 불러오기 실패는 오류 블록',
    },
    tokens: ['--color-bg-surface', '--color-border-subtle', '--color-border-strong', '--color-bg-hover',
      '--color-warning-border', '--color-danger-border', '--color-danger-text', '--color-text-tertiary', '--color-text-link'],
    a11y: ['누를 수 있으면 `<button>` — 숫자를 누르면 그 조건의 목록으로', '증감은 화살표 모양 + 글자(색만으로 좋고 나쁨을 알리지 않음)'],
    do: ['증감에는 비교 대상 값을 함께'],
    dont: ['보기만 하는 숫자판 — 목록으로 이어지게'],
    react: `import { MetricTile } from 'hct-web-design-template'

<MetricTile label="미처리 건" value={42} unit="건" delta={12} previous={37} state="warn" onDrillDown={go} />`,
    html: `<button type="button" class="hct-metric hct-metric--warn">
  <div class="hct-metric__head"><span class="hct-metric__label">미처리 건</span></div>
  <div class="hct-metric__main"><span class="hct-metric__value">42</span><span class="hct-metric__unit">건</span></div>
</button>`,
    css: `.hct-metric {
  position: relative; width: 100%; overflow: hidden; padding: 12px; text-align: left;
  border: 1px solid var(--color-border-subtle); border-radius: 8px; background-color: var(--color-bg-surface);
  font-size: 0.875rem; line-height: 1.25rem; color: inherit;
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-duration: var(--duration-instant);
}
button.hct-metric:hover { border-color: var(--color-border-strong); background-color: var(--color-bg-hover); }
.hct-metric--warn { border-color: var(--color-warning-border); }
.hct-metric--danger { border-color: var(--color-danger-border); }
.hct-metric__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.hct-metric__main { display: flex; align-items: baseline; gap: 6px; margin-top: 6px; }
.hct-metric__label { font-size: 0.75rem; line-height: 1rem; font-weight: 500; color: var(--color-text-tertiary); }
.hct-metric__value { font-size: 1.75rem; line-height: 2.125rem; letter-spacing: -0.01em; font-weight: 600; font-variant-numeric: tabular-nums; }
.hct-metric--danger .hct-metric__value { color: var(--color-danger-text); }
.hct-metric__unit { font-size: 0.8125rem; line-height: 1.125rem; color: var(--color-text-tertiary); }`,
    probes: [
      ...['ok', 'warn', 'danger'].map((s) => ({
        label: `state=${s}`,
        react: ['MetricTile', { label: '미처리', value: 42, state: s }],
        html: `<div class="hct-metric${s === 'ok' ? '' : ` hct-metric--${s}`}"></div>`,
        props: 'box',
      })),
      { label: '누를 수 있음', react: ['MetricTile', { label: '미처리', value: 42, onDrillDown: '__fn' }], html: '<button type="button" class="hct-metric"></button>', select: 'button', props: 'box', hover: true },
    ],
  },

  /* ───────────────────────────── 위젯 ───────────────────────────── */
  {
    id: 'widget',
    heading: '위젯 (카드)',
    source: 'src/components/dashboard/MetricTile.jsx',
    exports: ['Widget', 'WidgetGrid'],
    props: [],
    anatomy: '머리 `제목 [설명] … [행동]` → 본문 → [바닥]',
    states: {
      default: '테두리 `border-subtle` · 바탕 `bg-surface` · 그림자 없음', hover: NA, focus: NA, active: NA, disabled: NA,
      loading: '본문 자리에 글 줄 스켈레톤 5줄 · `role="status"`', error: '본문 자리에 오류 블록',
    },
    tokens: ['--color-bg-surface', '--color-border-subtle', '--color-text-primary', '--color-text-tertiary'],
    a11y: ['`<section>` + 제목 `<h3>`'],
    do: ['넓은 위젯은 `WidgetGrid columns={3}` + `lg:col-span-2`'],
    dont: ['카드마다 그림자 · 다른 모서리'],
    react: `import { Widget } from 'hct-web-design-template'

<Widget title="처리량" description="최근 7일" actions={<Button size="sm">내보내기</Button>} loading={isLoading}>
  <LineChart … />
</Widget>`,
    html: `<section class="hct-widget">
  <div class="hct-widget__head"><div><h3 class="hct-widget__title">처리량</h3><p class="hct-widget__desc">최근 7일</p></div></div>
  <div class="hct-widget__body">…</div>
</section>`,
    css: `.hct-widget { display: flex; flex-direction: column; border: 1px solid var(--color-border-subtle); border-radius: 8px; background-color: var(--color-bg-surface); }
.hct-widget__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; padding: 10px 12px 8px; }
.hct-widget__title { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.875rem; line-height: 1.25rem; font-weight: 600; color: var(--color-text-primary); }
.hct-widget__desc { margin: 2px 0 0; font-size: 0.75rem; line-height: 1rem; color: var(--color-text-tertiary); }
.hct-widget__body { flex: 1; min-height: 0; padding: 0 12px 12px; }
.hct-widget__foot { border-top: 1px solid var(--color-border-subtle); padding: 8px 12px; }`,
    probes: [
      { label: '바깥', react: ['Widget', { title: '처리량', description: '최근 7일' }], html: '<section class="hct-widget"><div class="hct-widget__head"><div><h3 class="hct-widget__title">처리량</h3><p class="hct-widget__desc">최근 7일</p></div></div><div class="hct-widget__body"></div></section>', select: 'section', props: 'box' },
      { label: '제목', react: ['Widget', { title: '처리량', description: '최근 7일' }], html: '<section class="hct-widget"><div class="hct-widget__head"><div><h3 class="hct-widget__title">처리량</h3><p class="hct-widget__desc">최근 7일</p></div></div><div class="hct-widget__body"></div></section>', select: 'h3' },
      { label: '설명', react: ['Widget', { title: '처리량', description: '최근 7일' }], html: '<section class="hct-widget"><div class="hct-widget__head"><div><h3 class="hct-widget__title">처리량</h3><p class="hct-widget__desc">최근 7일</p></div></div><div class="hct-widget__body"></div></section>', select: 'p' },
    ],
  },

  /* ───────────────────────────── 페이지 머리 ───────────────────────────── */
  {
    id: 'page-header',
    heading: '페이지 머리',
    source: 'src/components/shell/AppShell.jsx',
    exports: ['PageHeader'],
    props: [],
    anatomy: '[경로] → 제목 + 설명 · 오른쪽 행동 버튼 (640px 미만이면 제목 아래로)',
    states: { default: '제목 20/28px 600 · 설명 13px `text-tertiary`', hover: NA, focus: NA, active: NA, disabled: NA, loading: NA, error: NA },
    tokens: ['--color-text-primary', '--color-text-tertiary'],
    a11y: ['화면 제목은 `<h1>` 하나'],
    do: ['행동 버튼은 오른쪽, primary 는 1개'],
    dont: ['좁은 화면에서 제목을 한 줄로 자르기'],
    react: `import { PageHeader, Button } from 'hct-web-design-template'

<PageHeader title="계약 목록" description="이번 분기 계약" actions={<Button variant="primary">새 계약</Button>} />`,
    html: `<header class="hct-page-head">
  <div><h1 class="hct-page-head__title">계약 목록</h1><p class="hct-page-head__desc">이번 분기 계약</p></div>
  <div class="hct-page-head__actions">…</div>
</header>`,
    css: `.hct-page-head { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
@media (min-width: 640px) { .hct-page-head { flex-direction: row; align-items: flex-start; justify-content: space-between; gap: 16px; } }
.hct-page-head__title { margin: 0; font-size: 1.25rem; line-height: 1.75rem; font-weight: 600; color: var(--color-text-primary); }
@media (min-width: 640px) { .hct-page-head__title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } }
.hct-page-head__desc { margin: 4px 0 0; font-size: 0.8125rem; line-height: 1.125rem; color: var(--color-text-tertiary); }
.hct-page-head__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }`,
    probes: [
      { label: '제목', react: ['PageHeader', { title: '계약 목록', description: '이번 분기 계약' }], html: '<header class="hct-page-head"><div><h1 class="hct-page-head__title">계약 목록</h1><p class="hct-page-head__desc">이번 분기 계약</p></div></header>', select: 'h1' },
      { label: '설명', react: ['PageHeader', { title: '계약 목록', description: '이번 분기 계약' }], html: '<header class="hct-page-head"><div><h1 class="hct-page-head__title">계약 목록</h1><p class="hct-page-head__desc">이번 분기 계약</p></div></header>', select: 'p' },
    ],
  },

  /* ───────────────────────────── 빈 상태 ───────────────────────────── */
  {
    id: 'empty',
    heading: '빈 상태',
    source: 'src/components/state/EmptyState.jsx',
    exports: ['EmptyState', 'NoResults', 'ErrorState'],
    props: [{ name: 'size', keys: ['sm', 'md'], default: 'md', notes: { sm: '위아래 32px', md: '위아래 64px' } }],
    anatomy: '[아이콘 상자 40px] → 제목 → 설명(최대 380px) → [행동 버튼]',
    states: {
      default: '빈 목록 — 무엇을 하면 채워지는지 행동 버튼', hover: NA, focus: NA, active: NA, disabled: NA, loading: NA,
      error: '`ErrorState` — 아이콘 상자 `danger-bg` · `danger-text`, "다시 시도"',
    },
    tokens: ['--color-bg-sunken', '--color-text-tertiary', '--color-text-primary', '--color-danger-bg', '--color-danger-text'],
    a11y: ['제목은 실제 제목 요소', '검색 결과 0건(`NoResults`)은 "필터 초기화" 버튼을 함께'],
    do: ['빈 상태 · 결과 없음 · 오류를 다른 문장으로'],
    dont: ['빈 표 머리행만 남기기'],
    react: `import { EmptyState, ErrorState, Button } from 'hct-web-design-template'

<EmptyState icon={<InboxIcon />} title="받은 일이 없습니다" description="새 요청이 오면 여기에 표시됩니다" action={<Button>요청 만들기</Button>} />
<ErrorState onRetry={reload} />`,
    html: `<div class="hct-empty">
  <div class="hct-empty__icon">…</div>
  <h3 class="hct-empty__title">받은 일이 없습니다</h3>
  <p class="hct-empty__desc">새 요청이 오면 여기에 표시됩니다</p>
</div>`,
    css: `.hct-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 64px 24px; }
.hct-empty--sm { padding: 32px 16px; }
.hct-empty__icon { display: flex; width: 40px; height: 40px; align-items: center; justify-content: center; margin-bottom: 12px; border-radius: 8px; background-color: var(--color-bg-sunken); color: var(--color-text-tertiary); }
.hct-empty--error .hct-empty__icon { background-color: var(--color-danger-bg); color: var(--color-danger-text); }
.hct-empty__title { margin: 0; font-size: 0.875rem; line-height: 1.25rem; font-weight: 600; color: var(--color-text-primary); }
.hct-empty__desc { margin: 4px 0 0; max-width: 380px; font-size: 0.8125rem; line-height: 1.125rem; color: var(--color-text-tertiary); }
.hct-empty__action { margin-top: 16px; }`,
    probes: [
      { label: '바깥', react: ['EmptyState', { title: '없음', description: '설명' }], html: '<div class="hct-empty"><h3 class="hct-empty__title">없음</h3><p class="hct-empty__desc">설명</p></div>', select: 'div', props: 'box' },
      { label: 'size=sm', react: ['EmptyState', { title: '없음', size: 'sm' }], html: '<div class="hct-empty hct-empty--sm"><h3 class="hct-empty__title">없음</h3></div>', select: 'div', props: 'box' },
      { label: '제목', react: ['EmptyState', { title: '없음', description: '설명' }], html: '<div class="hct-empty"><h3 class="hct-empty__title">없음</h3><p class="hct-empty__desc">설명</p></div>', select: 'h3' },
      { label: '설명', react: ['EmptyState', { title: '없음', description: '설명' }], html: '<div class="hct-empty"><h3 class="hct-empty__title">없음</h3><p class="hct-empty__desc">설명</p></div>', select: 'p' },
    ],
  },

  /* ───────────────────────────── 필터 줄 · 세그먼트 ───────────────────────────── */
  {
    id: 'filter',
    heading: '필터 줄 · 세그먼트 전환',
    source: 'src/components/input/FilterBar.jsx',
    exports: ['FilterBar', 'FilterButton', 'SegmentedControl'],
    props: [{ name: 'size', from: 'heights', within: 'SegmentedControl', default: 'md', fn: 'SegmentedControl', notes: { sm: '세그먼트 28px · 12px', md: '세그먼트 32px' } }],
    anatomy: '필터 단추 `라벨 [값] ▾` 줄 → 적용된 필터 태그 줄 · 세그먼트 `[칸 [건수]]…`',
    states: {
      default: '필터 단추 `bg-surface` · `border-default` · `text-secondary` / 세그먼트 칸 `text-tertiary`',
      hover: '필터 단추 `bg-hover` / 세그먼트 칸 글자 `text-primary`', focus: FOCUS_RING,
      active: '값이 걸린 필터 — `accent-subtle` · `accent-border` · `accent-text` 500 / 고른 칸 — `bg-surface` · `text-primary` · `--shadow-sm` · `aria-selected="true"`',
      disabled: NA, loading: NA, error: NA,
    },
    tokens: ['--color-bg-surface', '--color-border-default', '--color-text-secondary', '--color-bg-hover',
      '--color-accent-subtle', '--color-accent-border', '--color-accent-text', '--color-bg-sunken',
      '--color-text-primary', '--color-text-tertiary', '--shadow-sm', '--control-height-sm', '--control-height-md'],
    a11y: ['세그먼트는 `role="tablist"` · 칸마다 `role="tab"` + `aria-selected`', '적용된 필터의 지움 단추에 이름'],
    do: ['적용된 필터를 줄로 보여주고 "전체 초기화"'],
    dont: ['둘 이상 중 하나 고르기에 체크박스'],
    react: `import { FilterBar, FilterButton, SegmentedControl } from 'hct-web-design-template'

<SegmentedControl value={view} onChange={setView} options={[{ value: 'all', label: '전체', count: 42 }, { value: 'mine', label: '내 것' }]} />
<FilterBar><FilterButton label="상태" value="진행중" active onClick={openStatus} /></FilterBar>`,
    html: `<div class="hct-segmented" role="tablist">
  <button type="button" role="tab" aria-selected="true" class="hct-segmented__tab">전체</button>
  <button type="button" role="tab" aria-selected="false" class="hct-segmented__tab">내 것</button>
</div>
<button type="button" class="hct-filter-btn hct-filter-btn--active"><span>상태</span><span class="hct-filter-btn__value">진행중</span><svg class="hct-filter-btn__caret" width="10" height="10" …/></button>`,
    css: `.hct-filter-btn {
  display: inline-flex; height: var(--control-height-md); align-items: center; gap: 6px; padding: 0 8px;
  border: 1px solid var(--color-border-default); border-radius: 6px; background-color: var(--color-bg-surface);
  font-size: 0.875rem; line-height: 1.25rem; font-weight: 400; color: var(--color-text-secondary);
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-duration: var(--duration-instant);
}
.hct-filter-btn:hover { background-color: var(--color-bg-hover); }
.hct-filter-btn__caret { flex-shrink: 0; opacity: 0.6; }
.hct-filter-btn__value { font-weight: 500; }
.hct-filter-btn--active, .hct-filter-btn--active:hover {
  border-color: var(--color-accent-border); background-color: var(--color-accent-subtle); color: var(--color-accent-text); font-weight: 500;
}
.hct-segmented { display: inline-flex; align-items: center; gap: 2px; padding: 2px; border-radius: 6px; background-color: var(--color-bg-sunken); }
.hct-segmented__tab {
  height: var(--control-height-md); padding: 0 10px; border: 0; border-radius: 3px; background-color: transparent;
  font-size: 0.875rem; line-height: 1.25rem; font-weight: 500; color: var(--color-text-tertiary);
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-duration: var(--duration-instant);
}
.hct-segmented__tab:hover { color: var(--color-text-primary); }
.hct-segmented__tab[aria-selected="true"] { background-color: var(--color-bg-surface); color: var(--color-text-primary); box-shadow: var(--shadow-sm); }
.hct-segmented--sm .hct-segmented__tab { height: var(--control-height-sm); font-size: 0.75rem; line-height: 1rem; }`,
    probes: [
      { label: '필터 단추', react: ['FilterButton', { label: '상태' }], html: '<button type="button" class="hct-filter-btn"><span>상태</span><svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" class="hct-filter-btn__caret"><path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>', select: 'button', hover: true },
      { label: '필터 단추 · 값 걸림', react: ['FilterButton', { label: '상태', active: true }], html: '<button type="button" class="hct-filter-btn hct-filter-btn--active"><span>상태</span><svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" class="hct-filter-btn__caret"><path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>', select: 'button' },
      { label: '세그먼트', react: ['SegmentedControl', { value: 'a', options: [{ value: 'a', label: '전체' }, { value: 'b', label: '내 것' }] }], html: '<div class="hct-segmented" role="tablist"><button type="button" role="tab" aria-selected="true" class="hct-segmented__tab">전체</button><button type="button" role="tab" aria-selected="false" class="hct-segmented__tab">내 것</button></div>', select: '[role=tablist]', props: 'box' },
      { label: '고른 칸', react: ['SegmentedControl', { value: 'a', options: [{ value: 'a', label: '전체' }, { value: 'b', label: '내 것' }] }], html: '<div class="hct-segmented" role="tablist"><button type="button" role="tab" aria-selected="true" class="hct-segmented__tab">전체</button><button type="button" role="tab" aria-selected="false" class="hct-segmented__tab">내 것</button></div>', select: '[aria-selected=true]' },
      { label: '나머지 칸', react: ['SegmentedControl', { value: 'a', options: [{ value: 'a', label: '전체' }, { value: 'b', label: '내 것' }] }], html: '<div class="hct-segmented" role="tablist"><button type="button" role="tab" aria-selected="true" class="hct-segmented__tab">전체</button><button type="button" role="tab" aria-selected="false" class="hct-segmented__tab">내 것</button></div>', select: '[aria-selected=false]', hover: true },
      { label: '세그먼트 size=sm', react: ['SegmentedControl', { size: 'sm', value: 'a', options: [{ value: 'a', label: '전체' }] }], html: '<div class="hct-segmented hct-segmented--sm" role="tablist"><button type="button" role="tab" aria-selected="true" class="hct-segmented__tab">전체</button></div>', select: '[role=tab]' },
    ],
  },

  /* ───────────────────────────── 드롭다운 ───────────────────────────── */
  {
    id: 'dropdown',
    heading: '드롭다운 · 선택 목록',
    source: 'src/components/input/Combobox.jsx',
    exports: ['Combobox'],
    props: [],
    anatomy: '입력 칸(트리거) → 4px 아래 목록 상자 `항목 [보조 글자]…` · 결과 없음 안내',
    states: {
      default: '목록 `bg-raised` · `border-default` · `--shadow-lg`', hover: '가리킨 항목 `accent-subtle` · `accent-text`',
      focus: '키보드로 가리킨 항목도 hover 와 같은 모양 · 입력에 `aria-activedescendant`', active: '고른 값은 입력 칸 · 태그로 표시',
      disabled: '입력 칸과 같음', loading: NA, error: '입력 칸과 같음 (`error`)',
    },
    tokens: ['--color-bg-raised', '--color-border-default', '--shadow-lg', '--color-text-primary',
      '--color-text-tertiary', '--color-accent-subtle', '--color-accent-text'],
    a11y: ['`role="combobox"` + `role="listbox"` · 항목마다 `role="option"`', '↑↓ 이동 · Enter 선택 · Esc 닫기'],
    do: ['항목이 많으면 검색 입력을 겸하는 콤보박스'],
    dont: ['목록 높이 제한 없이 화면 밖으로'],
    react: `import { Combobox } from 'hct-web-design-template'

<Combobox label="담당자" options={people} value={owner} onChange={setOwner} />`,
    html: `<ul class="hct-listbox" role="listbox">
  <li role="option" aria-selected="true" class="hct-option">김하늘</li>
  <li role="option" aria-selected="false" class="hct-option">이바다</li>
</ul>`,
    css: `.hct-listbox {
  margin: 4px 0 0; padding: 4px 0; list-style: none; max-height: 220px; overflow-y: auto;
  border: 1px solid var(--color-border-default); border-radius: 6px; background-color: var(--color-bg-raised); box-shadow: var(--shadow-lg);
}
.hct-option { display: flex; align-items: center; gap: 8px; padding: 4px 8px; font-size: 0.875rem; line-height: 1.25rem; color: var(--color-text-primary); cursor: pointer; }
.hct-option[aria-selected="true"], .hct-option:hover { background-color: var(--color-accent-subtle); color: var(--color-accent-text); }`,
    probes: [],
  },

  /* ───────────────────────────── 알림 띠 ───────────────────────────── */
  {
    id: 'banner',
    heading: '알림 띠 (페이지 위쪽 경고 · 안내)',
    source: 'src/components/feedback/StatusBadge.jsx',
    exports: ['Banner'],
    props: [{ name: 'tone', from: 'TONES', default: 'info', fn: 'Banner', notes: { neutral: '일반', info: '안내', review: '검토', success: '완료', warning: '주의', danger: '위험 — `role="alert"`' } }],
    anatomy: '[아이콘] 제목 / 본문 / [행동] … [닫기]',
    states: {
      default: '§2-3 색조의 `bg` · `text` · `border`', hover: '닫기 단추 불투명도 70% → 100%', focus: FOCUS_RING,
      active: NA, disabled: NA, loading: NA, error: '`danger` 색조 + `role="alert"`',
    },
    tokens: ['--color-info-bg', '--color-info-text', '--color-info-border', '--color-danger-bg', '--color-danger-text', '--color-danger-border'],
    a11y: ['위험은 `role="alert"`, 나머지는 `role="status"`', '닫기 단추 이름 "닫기"'],
    do: ['무엇을 하면 되는지 행동 단추를 함께'],
    dont: ['같은 화면에 띠 여러 개'],
    react: `import { Banner, Button } from 'hct-web-design-template'

<Banner tone="warning" title="동기화 지연" action={<Button size="sm">다시 시도</Button>}>최근 10분 데이터가 늦습니다</Banner>`,
    html: `<div class="hct-banner hct-banner--warning" role="status">
  <span class="hct-banner__icon" aria-hidden="true">!</span>
  <div><div class="hct-banner__title">동기화 지연</div><div class="hct-banner__body">최근 10분 데이터가 늦습니다</div></div>
</div>`,
    css: `.hct-banner { display: flex; gap: 10px; padding: 10px 12px; border: 1px solid; border-radius: 6px; }
.hct-banner__icon { flex-shrink: 0; margin-top: 1px; font-size: 0.8125rem; line-height: 1.125rem; font-weight: 700; }
.hct-banner__title { font-size: 0.875rem; line-height: 1.25rem; font-weight: 600; }
.hct-banner__body { font-size: 0.8125rem; line-height: 1.125rem; }
.hct-banner__title + .hct-banner__body { margin-top: 2px; }
.hct-banner--neutral { background-color: var(--color-neutral-bg); color: var(--color-neutral-text); border-color: var(--color-neutral-border); }
.hct-banner--info { background-color: var(--color-info-bg); color: var(--color-info-text); border-color: var(--color-info-border); }
.hct-banner--success { background-color: var(--color-success-bg); color: var(--color-success-text); border-color: var(--color-success-border); }
.hct-banner--warning { background-color: var(--color-warning-bg); color: var(--color-warning-text); border-color: var(--color-warning-border); }
.hct-banner--danger { background-color: var(--color-danger-bg); color: var(--color-danger-text); border-color: var(--color-danger-border); }
.hct-banner--review { background-color: var(--color-review-bg); color: var(--color-review-text); border-color: var(--color-review-border); }`,
    probes: ['neutral', 'info', 'success', 'warning', 'danger', 'review'].map((t) => ({
      label: `tone=${t}`,
      react: ['Banner', { tone: t, title: '제목', children: '본문' }],
      html: `<div class="hct-banner hct-banner--${t}" role="${t === 'danger' ? 'alert' : 'status'}"><span class="hct-banner__icon" aria-hidden="true">!</span><div><div class="hct-banner__title">제목</div><div class="hct-banner__body">본문</div></div></div>`,
      select: '[role]',
      props: 'box',
    })),
  },

  /* ───────────────────────────── 모달 ───────────────────────────── */
  {
    id: 'modal',
    heading: '모달 · 확인 창',
    source: 'src/components/overlay/Modal.jsx',
    exports: ['Modal', 'ConfirmDialog'],
    props: [{ name: 'size', from: 'MODAL_SIZES', default: 'md', fn: 'Modal', notes: { sm: '400px · 확인 창', md: '560px', lg: '760px', xl: '1000px' } }],
    anatomy: '덮는 막 → 창 `머리(제목 · 설명 · 닫기) → 본문 → 바닥(취소 · 실행)`',
    states: {
      default: '창 `bg-raised` · `border-subtle` · `--shadow-overlay` · 뒤 `bg-overlay`', hover: NA, focus: '열리면 창 안으로 · 닫히면 연 단추로 되돌림',
      active: NA, disabled: NA, loading: '실행 단추 `loading`', error: '창 안 오류 문장 · 위험 실행은 `danger` 단추',
    },
    tokens: ['--color-bg-raised', '--color-border-subtle', '--shadow-overlay', '--color-bg-overlay', '--color-text-primary', '--color-text-tertiary'],
    a11y: ['`role="dialog"` · `aria-modal="true"` · `aria-labelledby` 제목', 'Esc 로 닫힘 · 열린 동안 뒤 스크롤 잠금'],
    do: ['확인 창은 취소 왼쪽 · 실행 오른쪽'],
    dont: ['모달 안에 모달'],
    react: `import { Modal, ConfirmDialog, Button } from 'hct-web-design-template'

<Modal open={open} onClose={close} title="계약 수정" footer={<><Button onClick={close}>취소</Button><Button variant="primary">저장</Button></>}>…</Modal>
<ConfirmDialog open={ask} tone="danger" title="삭제할까요?" confirmLabel="삭제" onConfirm={remove} onCancel={cancel} />`,
    html: `<div class="hct-scrim"></div>
<div class="hct-modal" role="dialog" aria-modal="true" aria-labelledby="m-title">
  <div class="hct-modal__head"><h2 id="m-title" class="hct-modal__title">계약 수정</h2></div>
  <div class="hct-modal__body">…</div>
  <div class="hct-modal__foot">…</div>
</div>`,
    css: `.hct-scrim { position: fixed; inset: 0; background-color: var(--color-bg-overlay); }
.hct-modal {
  position: relative; width: 100%; max-width: 560px; border: 1px solid var(--color-border-subtle); border-radius: 8px;
  background-color: var(--color-bg-raised); box-shadow: var(--shadow-overlay);
}
.hct-modal--sm { max-width: 400px; } .hct-modal--lg { max-width: 760px; } .hct-modal--xl { max-width: 1000px; }
.hct-modal__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--color-border-subtle); }
.hct-modal__title { margin: 0; font-size: 1rem; line-height: 1.5rem; font-weight: 600; color: var(--color-text-primary); }
.hct-modal__body { padding: 16px; }
.hct-modal__foot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--color-border-subtle); }`,
    probes: ['sm', 'md', 'lg'].map((s) => ({
      label: `size=${s}`,
      react: ['Modal', { open: true, onClose: '__fn', title: '제목', size: s }],
      html: `<div class="hct-modal${s === 'md' ? '' : ` hct-modal--${s}`}" role="dialog"><div class="hct-modal__head"><div><h2 class="hct-modal__title">제목</h2></div></div><div class="hct-modal__body"></div></div>`,
      select: '[role=dialog]',
      props: 'box-nolayout',
    })),
  },

  /* ───────────────────────────── 서랍 ───────────────────────────── */
  {
    id: 'drawer',
    heading: '서랍 (옆에서 열리는 상세 · 편집)',
    source: 'src/components/overlay/Modal.jsx',
    exports: ['Drawer'],
    props: [{ name: 'size', from: 'DRAWER_SIZES', default: 'md', fn: 'Drawer', notes: { md: '360px', lg: '480px', xl: '640px' } }],
    anatomy: '덮는 막 → 오른쪽 판 `머리 48px(제목 · 보조 · 닫기) → 본문(스크롤) → 바닥`',
    states: {
      default: '판 `bg-surface` · 왼쪽 `border-subtle` · `--shadow-overlay`', hover: NA, focus: '모달과 같음',
      active: NA, disabled: NA, loading: '본문 스켈레톤', error: '본문 오류 블록',
    },
    tokens: ['--color-bg-surface', '--color-border-subtle', '--shadow-overlay', '--color-bg-overlay',
      '--layout-right-panel-width', '--layout-right-panel-wide-width', '--layout-topbar-height'],
    a11y: ['모달과 같음 (`role="dialog"` · Esc · 포커스 이동 · 스크롤 잠금)'],
    do: ['목록을 떠나지 않고 한 건을 보거나 고칠 때'],
    dont: ['640px 미만에서 고정 폭 — 전체 폭으로'],
    react: `import { Drawer } from 'hct-web-design-template'

<Drawer open={!!selected} onClose={close} title={selected?.name} subtitle="계약" size="lg">…</Drawer>`,
    html: `<div class="hct-scrim"></div>
<aside class="hct-drawer" role="dialog" aria-modal="true" aria-labelledby="d-title">
  <div class="hct-drawer__head"><h2 id="d-title" class="hct-drawer__title">계약 A</h2></div>
  <div class="hct-drawer__body">…</div>
</aside>`,
    css: `.hct-drawer {
  position: fixed; top: 0; bottom: 0; right: 0; display: flex; flex-direction: column; width: 100%;
  border-left: 1px solid var(--color-border-subtle); background-color: var(--color-bg-surface); box-shadow: var(--shadow-overlay);
}
@media (min-width: 640px) {
  .hct-drawer { width: var(--layout-right-panel-width); }
  .hct-drawer--lg { width: var(--layout-right-panel-wide-width); }
  .hct-drawer--xl { width: 640px; }
}
.hct-drawer__head { display: flex; flex-shrink: 0; align-items: center; gap: 8px; height: var(--layout-topbar-height); padding: 0 16px; border-bottom: 1px solid var(--color-border-subtle); }
.hct-drawer__title { margin: 0; font-size: 0.8125rem; line-height: 1.125rem; font-weight: 600; color: var(--color-text-primary); }
.hct-drawer__body { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; }`,
    probes: ['md', 'lg', 'xl'].map((s) => ({
      label: `size=${s}`,
      react: ['Drawer', { open: true, onClose: '__fn', title: '제목', size: s }],
      html: `<aside class="hct-drawer${s === 'md' ? '' : ` hct-drawer--${s}`}" role="dialog"><div class="hct-drawer__head"><h2 class="hct-drawer__title">제목</h2></div><div class="hct-drawer__body"></div></aside>`,
      select: '[role=dialog]',
      props: 'box-nolayout',
    })),
  },

  /* ───────────────────────────── 토스트 ───────────────────────────── */
  {
    id: 'toast',
    heading: '토스트',
    source: 'src/components/feedback/Toast.jsx',
    exports: ['ToastProvider', 'useToast'],
    props: [{ name: 'tone', from: 'TONES', default: null, notes: { neutral: '기본', success: '성공', warning: '주의', danger: '위험' } }],
    anatomy: '글자 [│ 행동] [닫기] — 화면 아래 가운데에 쌓임',
    states: {
      default: '`bg-raised` · `border-default` · `text-primary` · `--shadow-overlay`', hover: '행동 · 닫기 단추 불투명도 변화',
      focus: FOCUS_RING, active: NA, disabled: NA, loading: NA, error: '`danger` 색조',
    },
    tokens: ['--color-bg-raised', '--color-border-default', '--color-text-primary', '--shadow-overlay',
      '--color-success-bg', '--color-success-text', '--color-danger-bg', '--color-danger-text'],
    a11y: ['`aria-live="polite"` 영역 안', '6초 뒤 사라짐 — 꼭 알아야 할 내용은 토스트가 아니라 알림 띠'],
    do: ['되돌리기 행동은 토스트의 행동 단추로'],
    dont: ['뒤를 덮기', '오류를 토스트로만 알리기'],
    react: `import { ToastProvider, useToast } from 'hct-web-design-template'

const toast = useToast()
toast({ message: '저장했습니다', tone: 'success', action: { label: '되돌리기', onClick: undo } })`,
    html: `<div class="hct-toast-region" role="region" aria-label="알림" aria-live="polite">
  <div class="hct-toast hct-toast--success"><span>저장했습니다</span></div>
</div>`,
    css: `.hct-toast-region { position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; pointer-events: none; }
.hct-toast {
  pointer-events: auto; display: flex; align-items: center; gap: 12px; padding: 8px 12px; border: 1px solid var(--color-border-default);
  border-radius: 8px; background-color: var(--color-bg-raised); color: var(--color-text-primary); box-shadow: var(--shadow-overlay);
  font-size: 0.875rem; line-height: 1.25rem;
}
.hct-toast--success { background-color: var(--color-success-bg); color: var(--color-success-text); border-color: var(--color-success-border); }
.hct-toast--warning { background-color: var(--color-warning-bg); color: var(--color-warning-text); border-color: var(--color-warning-border); }
.hct-toast--danger { background-color: var(--color-danger-bg); color: var(--color-danger-text); border-color: var(--color-danger-border); }`,
    probes: [],
  },

  /* ───────────────────────────── 스켈레톤 ───────────────────────────── */
  {
    id: 'skeleton',
    heading: '스켈레톤 (로딩)',
    source: 'src/components/state/Skeleton.jsx',
    exports: ['Skeleton', 'SkeletonText', 'SkeletonTable', 'SkeletonStatCard'],
    props: [{ name: 'density', from: 'rowHeight', within: 'SkeletonTable', default: 'default', fn: 'SkeletonTable', notes: { compact: '32px', default: '40px', relaxed: '48px' } }],
    anatomy: '실제 내용과 같은 모양의 회색 막대 — 글 줄 · 표 · 지표 카드',
    states: {
      default: '막대 `bg-sunken` + 1.6초 반짝임', hover: NA, focus: NA, active: NA, disabled: NA,
      loading: '이 부품 자체가 로딩 상태 — 묶음에 `role="status"` · 이름 "불러오는 중"',
      error: NA,
    },
    tokens: ['--color-bg-sunken', '--color-bg-hover', '--color-border-subtle', '--row-height-compact', '--row-height-default', '--row-height-relaxed'],
    a11y: ['막대 하나하나는 `aria-hidden`, 묶음 하나만 `role="status"`', '움직임 줄이기에서는 반짝임이 멈춥니다 (③)'],
    do: ['200ms 안에 끝나는 로딩에는 표시하지 않기'],
    dont: ['돌아가는 원 하나로 화면 전체 대신'],
    react: `import { SkeletonTable, SkeletonText } from 'hct-web-design-template'

{loading ? <SkeletonTable rows={6} columns={4} density="default" /> : <DataGrid … />}`,
    html: `<div role="status" aria-label="불러오는 중">
  <div class="hct-skeleton hct-skeleton--line" aria-hidden="true"></div>
  <div class="hct-skeleton hct-skeleton--line hct-skeleton--last" aria-hidden="true"></div>
</div>`,
    css: `.hct-skeleton { position: relative; overflow: hidden; border-radius: 3px; background-color: var(--color-bg-sunken); }
.hct-skeleton::after {
  content: ''; position: absolute; inset: 0; transform: translateX(-100%); animation: hct-shimmer 1.6s infinite;
  background-image: linear-gradient(to right, transparent, var(--color-bg-hover), transparent);
}
.hct-skeleton--line { height: 12px; width: 100%; }
.hct-skeleton--line + .hct-skeleton--line { margin-top: 6px; }
.hct-skeleton--last { width: 66.666667%; }`,
    probes: [
      { label: '막대', react: ['Skeleton', { className: 'h-3 w-full' }], html: '<div class="hct-skeleton hct-skeleton--line" aria-hidden="true"></div>', select: 'div', props: 'box' },
    ],
  },

  /* ───────────────────────────── 떠 있는 것 · 포커스 ───────────────────────────── */
  {
    id: 'floating',
    heading: '떠 있는 것 · 포커스',
    source: null,
    exports: [],
    props: [],
    anatomy: '부품이 아니라 규칙 — 드롭다운 · 팝오버 · 툴팁 · 모달 · 서랍 · 토스트가 함께 따릅니다',
    states: {
      default: '드롭다운 · 툴팁 `bg-raised` + `--shadow-lg` · 모달 `bg-raised` + `--shadow-overlay`', hover: NA, focus: FOCUS_RING,
      active: NA, disabled: NA, loading: NA, error: NA,
    },
    tokens: ['--color-bg-raised', '--color-border-default', '--shadow-lg', '--shadow-overlay', '--color-bg-overlay', '--color-border-focus'],
    a11y: ['포커스 링은 절대 지우지 않음 — 지우려면 그 자리에 같은 대비의 다른 표시'],
    do: ['뒤를 덮는 것은 모달 · 명령 팔레트 · 서랍 · 좁은 화면 사이드바뿐'],
    dont: ['`outline: none` 만 쓰기'],
    react: '/* 별도 부품 없음 — 각 부품이 이 규칙을 따릅니다 */',
    html: '<div class="hct-popover" role="dialog">…</div>',
    css: `.hct-popover { border: 1px solid var(--color-border-default); border-radius: 6px; background-color: var(--color-bg-raised); box-shadow: var(--shadow-lg); }`,
    probes: [],
  },
]

/* ── 검사 ───────────────────────────────────────────────────────── */

/** src 안에서 `name = {` 로 시작하는 객체 리터럴의 맨 위 키 목록 */
export function objectKeys(src, name, within) {
  let from = 0
  if (within) {
    from = src.search(new RegExp(`export function ${within}\\b`))
    if (from === -1) throw new Error(`함수 ${within} 을 찾지 못했습니다`)
  }
  const re = new RegExp(`\\b${name}\\s*=\\s*\\{`, 'g')
  re.lastIndex = from
  const m = re.exec(src)
  if (!m) return null
  let i = m.index + m[0].length
  let depth = 1
  let body = ''
  for (; i < src.length && depth; i++) {
    const c = src[i]
    if (c === '{') depth++
    else if (c === '}') depth--
    if (depth) body += depth === 1 ? c : (c === '\n' ? '\n' : ' ')
  }
  /* 맨 위 깊이의 `키:` 만 — 문자열 · 주석 속 콜론은 위에서 이미 공백 처리되지 않으므로 키 패턴으로 거릅니다 */
  return [...body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    .matchAll(/(?:^|[,{\n])\s*(?:'([^']+)'|([A-Za-z_$][\w$-]*))\s*:/g)].map((k) => k[1] ?? k[2])
}

/** export function Name({ a = 'x', … }) 의 기본값 */
export function signatureDefault(src, fn, prop) {
  const at = src.search(new RegExp(`export function ${fn}\\s*\\(`))
  if (at === -1) return undefined
  /* 여는 괄호와 짝이 맞는 닫는 괄호까지 — 기본값 속 () => {} 에 속지 않게 */
  const open = src.indexOf('(', at)
  let depth = 0
  let end = open
  for (; end < src.length; end++) {
    if (src[end] === '(') depth++
    else if (src[end] === ')' && --depth === 0) break
  }
  const sig = src.slice(open, end + 1)
  const m = new RegExp(`\\b${prop}\\s*=\\s*'([^']*)'`).exec(sig)
  return m ? m[1] : null
}

/**
 * @param {{ read: (p: string) => string, exists: (p: string) => boolean, tokens: Set<string>, entry: string }} ctx
 * @param {typeof CARDS} [cards]
 * @returns {string[]} 문제 목록 (비어 있으면 통과)
 */
export function checkCards(ctx, cards = CARDS) {
  const problems = []
  const ids = new Set()
  for (const c of cards) {
    const where = `카드 ${c.id}`
    if (ids.has(c.id)) problems.push(`${where}: id 중복`)
    ids.add(c.id)

    for (const k of STATE_KEYS) {
      if (!c.states?.[k]?.trim()) problems.push(`${where}: 상태 "${k}" 가 비어 있습니다 ("해당 없음" 도 적으세요)`)
    }
    for (const k of Object.keys(c.states ?? {})) if (!STATE_KEYS.includes(k)) problems.push(`${where}: 모르는 상태 "${k}"`)
    for (const f of ['anatomy', 'react', 'html', 'css']) if (!c[f]?.trim()) problems.push(`${where}: ${f} 가 비어 있습니다`)
    for (const f of ['a11y', 'do', 'dont', 'tokens']) if (!c[f]?.length) problems.push(`${where}: ${f} 가 비어 있습니다`)

    /* 토큰 — 카드 목록과 CSS 안의 var() 모두 */
    const used = [...c.tokens, ...[...c.css.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1])]
    for (const t of new Set(used)) if (!ctx.tokens.has(t)) problems.push(`${where}: 없는 토큰 ${t}`)
    if (/#[0-9a-fA-F]{3,8}\b/.test(c.css)) problems.push(`${where}: CSS 에 색 값을 직접 썼습니다 — var(--…) 만`)
    if (/font-size:\s*\d+px/.test(c.css)) problems.push(`${where}: CSS 글자 크기는 rem 으로`)

    if (!c.source) continue
    if (!ctx.exists(c.source)) { problems.push(`${where}: 소스 없음 ${c.source}`); continue }
    const src = ctx.read(c.source)
    for (const e of c.exports) {
      if (!new RegExp(`export (?:function|const) ${e}\\b`).test(src)) problems.push(`${where}: ${c.source} 에 export ${e} 없음`)
      if (!new RegExp(`\\b${e}\\b`).test(ctx.entry)) problems.push(`${where}: 패키지 진입점에 ${e} 없음`)
    }
    for (const m of c.react.matchAll(/import \{([^}]+)\} from 'hct-web-design-template'/g)) {
      for (const name of m[1].split(',').map((s) => s.trim()).filter(Boolean)) {
        if (!new RegExp(`\\b${name}\\b`).test(ctx.entry)) problems.push(`${where}: React 예의 ${name} 이 패키지 진입점에 없습니다`)
      }
    }

    for (const p of c.props) {
      const fn = p.fn ?? c.exports[0]
      const keys = p.from ? objectKeys(src, p.from, p.within) : p.keys
      if (!keys) { problems.push(`${where}: ${c.source} 에서 ${p.from} 객체를 찾지 못했습니다`); continue }
      const listed = Object.keys(p.notes)
      const missing = keys.filter((k) => !listed.includes(k))
      const extra = listed.filter((k) => !keys.includes(k))
      if (missing.length) problems.push(`${where}: ${p.name} — 소스에 있는데 카드에 없음: ${missing.join(', ')}`)
      if (extra.length) problems.push(`${where}: ${p.name} — 카드에 있는데 소스에 없음: ${extra.join(', ')}`)
      if (p.default !== null) {
        const d = signatureDefault(src, fn, p.name)
        if (d !== p.default) problems.push(`${where}: ${p.name} 기본값 — 소스 ${JSON.stringify(d)} · 카드 ${JSON.stringify(p.default)}`)
      }
      if (p.keys && !p.from) {
        /* 객체가 없는 prop 은 값이 소스에 문자열로 나오는지라도 확인합니다 */
        for (const k of keys) if (!src.includes(`'${k}'`) && !new RegExp(`\\b${k}\\s*:`).test(src)) problems.push(`${where}: ${p.name}="${k}" 가 소스에 보이지 않습니다`)
      }
    }
  }
  return problems
}

/* ── 그리기 ───────────────────────────────────────────────────────── */

const code = (v) => '`' + v + '`'
const cell = (s) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ')

export function renderCard(c) {
  const out = []
  const src = c.source ? `${code(c.source)} · ${c.exports.map(code).join(' · ')}` : '부품 없음 — 규칙'
  out.push(`> **부품 카드** — ${src}${c.probes.length ? ` · 브라우저 대조 ${c.probes.length}건` : ''}`)
  out.push('')
  out.push('| 항목 | 내용 |', '|---|---|')
  out.push(`| 구조 | ${cell(c.anatomy)} |`)
  for (const p of c.props) {
    const vals = Object.entries(p.notes).map(([k, v]) => `${code(k)}${k === p.default ? ' **(기본)**' : ''} ${v}`).join(' · ')
    out.push(`| ${code(p.name)} | ${cell(vals)} |`)
  }
  for (const k of STATE_KEYS) out.push(`| ${STATE_LABELS[k]} | ${cell(c.states[k])} |`)
  out.push(`| 토큰 | ${c.tokens.map(code).join(' ')} |`)
  out.push(`| 접근성 | ${cell(c.a11y.join(' · '))} |`)
  out.push(`| 할 것 | ${cell(c.do.join(' · '))} |`)
  out.push(`| 하지 말 것 | ${cell(c.dont.join(' · '))} |`)
  out.push('')
  out.push('React (패키지):', '', '```jsx', c.react, '```', '')
  out.push('순수 HTML + CSS (패키지 없이 — §2-1 의 세 블록과 §7 첫머리의 공통 CSS 를 붙인 뒤):', '', '```html', c.html, '```', '', '```css', c.css, '```')
  return out.join('\n')
}
