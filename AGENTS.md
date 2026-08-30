# HCT 디자인 시스템 — 에이전트 작업 규칙

이 저장소는 **대시보드·분석도구·관리도구**의 화면을 만들 때 따르는 디자인 규격입니다.
여러 에이전트가 각자 만든 화면이 하나의 제품처럼 보이도록 하는 것이 목적입니다.

**화면을 만들기 전에 이 문서를 끝까지 읽으세요.** 아래 규칙은 권고가 아니라 검사로 강제됩니다
(`npm run lint:design`).

---

## 0. 30초 요약

| 하지 말 것 | 대신 할 것 |
|---|---|
| `bg-gray-100`, `text-blue-600` | `bg-bg-sunken`, `text-fg-link` |
| `style={{ color: '#333' }}` | `className="text-fg-primary"` |
| `dark:bg-slate-900` | 아무것도 안 함 (토큰이 자동 처리) |
| `<table>` 직접 작성 | `<DataGrid />` |
| `<button className="...">` | `<Button variant="..." />` |
| `p-[13px]`, `h-7` | 4px 배수 스케일 (`p-3`, `h-6`) |
| 로딩 스피너 하나 | `<SkeletonTable />` |
| 빈 배열이면 아무것도 안 그림 | `<EmptyState />` / `<NoResults />` |

---

## 0-1. 가장 중요한 규칙: 스키마가 먼저입니다

이 시스템은 **하나의 원자(레코드) + 여러 투영(뷰)** 구조입니다.
노션의 데이터베이스, 지라의 이슈와 같은 모델입니다.

화면을 만들기 전에 **필드 스키마부터 정의하세요.**

```jsx
import { normalizeFields } from '@/components'

const FIELDS = normalizeFields([
  { key: 'id',     label: 'ID',   type: 'text', editable: false },
  { key: 'title',  label: '제목', type: 'text' },
  { key: 'status', label: '상태', type: 'select', options: [
      // status 키가 StatusBadge 의 고정 색에 연결됩니다
      { value: 'todo',  label: '대기',   status: 'todo' },
      { value: 'doing', label: '진행중', status: 'inProgress' },
      { value: 'done',  label: '완료',   status: 'done' },
  ]},
  { key: 'owner',  label: '담당자', type: 'user' },
  { key: 'count',  label: '건수',   type: 'number' },
])
```

이 스키마 하나에서 아래가 **전부 자동으로** 나옵니다:

| 파생되는 것 | 어떻게 |
|---|---|
| 표 열 | `DataGrid` 에 `fields` 를 넘기면 끝 |
| 보드 컬럼 | `BoardView` 의 `groupField` 로 select 필드 지정 |
| 인라인 편집기 | 타입별로 알맞은 에디터가 자동 선택 |
| 필터 연산자 | 타입별 사용 가능 연산자 자동 결정 |
| 정렬 | select 는 선택지 순서로 (알파벳순 아님) |
| 상세 화면 필드 | `ObjectDetail` 에 같은 스키마 전달 |

**컬럼 정의를 화면에 하드코딩하지 마세요.** 그러면 표와 보드가 서로 다른
데이터를 보게 되고, 뷰 전환이 성립하지 않습니다.

### 필드 타입

`text` `longtext` `number` `select` `tags` `user` `date` `checkbox` `link`

새 타입이 필요하면 `src/lib/fields.js` 에 추가하세요.
화면에서 `if (key === 'status')` 같은 특수 처리를 하면 안 됩니다.

---

## 0-2. 질의(Query)로 필터를 다루세요

필터를 개별 `useState` 로 흩어놓지 마세요. 질의 객체 하나로 관리합니다.

```jsx
const [query, setQuery] = useState(emptyQuery())
const visible = applyQuery(records, query, fieldMap(FIELDS))
```

질의 구조: `{ search, match: 'all'|'any', conditions, sort, groupBy }`

이렇게 해야 아래가 전부 공짜로 따라옵니다:

- **저장된 뷰** — 질의를 저장하면 그게 곧 사용자의 화면이 됩니다
- **드릴다운** — 대시보드 지표가 질의를 목록에 그대로 넘길 수 있습니다
- **URL 동기화** — 질의를 직렬화해 링크로 공유할 수 있습니다
- **뷰 전환** — 표든 보드든 같은 질의 결과를 봅니다

**새 화면을 만들기 전에 "이건 기존 목록의 저장된 뷰로 되는 것 아닌가?"를
먼저 물으세요.** 대부분 그렇습니다. 화면이 늘어나면 유지보수가 무너집니다.

---

## 0-3. 대시보드 지표 = 질의 + 집계

지표를 서버가 준 숫자 하나로 다루지 마세요. 클릭해도 갈 곳이 없는 지표는
사용자를 막다른 길에 세웁니다.

```jsx
const metric = {
  id: 'blocked', label: '차단됨', unit: '건',
  query: { ...emptyQuery(), conditions: [{ field: 'status', operator: 'in', value: ['blocked'] }] },
  aggregate: 'count',
  lowerIsBetter: true,
  threshold: { warn: 3, danger: 5 },
}
const computed = computeMetric(metric, records, fields)
// computed.matched 에 실제 레코드가 있으므로 드릴다운이 가능합니다
```

규칙:

- `MetricTile` 의 `onDrillDown` 을 **반드시** 연결하세요.
- 낮을수록 좋은 지표(오류율·응답시간·비용)에는 `lowerIsBetter` 를 지정하세요.
  빠뜨리면 오류율 상승이 초록색으로 표시됩니다.
- 임계값은 **실제로 조치가 필요한 선**에 두세요. 지표 4개가 전부 빨간
  대시보드는 아무것도 알리지 못합니다.
- 분해(`breakdownMetric`)는 지표와 같은 집계를 씁니다. 합계와 조각이
  맞지 않으면 사용자가 숫자를 신뢰하지 않습니다.

---

## 1. 시작하기

```jsx
// 모든 import 는 배럴 파일에서
import {
  AppShell, PageContainer, PageHeader,
  Sidebar, SidebarGroup, SidebarItem,
  Topbar, Breadcrumb,
  DataTable, TableCard, StatCard, StatGrid, WidgetGrid,
  StatusBadge, Button, EmptyState,
} from '@/components'
```

스타일시트는 앱 진입점에서 한 번만 불러옵니다:

```js
import './styles/index.css'   // tokens.css 를 포함합니다
```

**새 화면을 만들 때는 백지에서 시작하지 마세요.** 만들려는 화면과 가장 가까운
원형을 복사해서 고치는 것이 언제나 빠르고 정확합니다. 아래 [1-1. 화면 원형
목록](#1-1-화면-원형-16종) 에서 고르세요.

---

## 1-0. 이 패키지를 설치해서 쓰는 프로젝트라면

`node_modules/hct-web-design-template` 안에서 이 문서를 읽고 있다면, 앱 쪽 설정이
아래와 같은지 먼저 확인하세요. 셋 중 하나라도 빠지면 화면이 **오류 없이** 스타일만
빠진 채로 나옵니다.

**Tailwind v4** 라면 앱의 CSS 두 줄이 전부입니다. 설정 파일이 필요 없습니다.

```css
@import 'tailwindcss';
@import 'hct-web-design-template/styles/hct.v4.css';
```

**Tailwind v3** 라면 설정과 CSS 양쪽이 필요합니다.

```js
// tailwind.config.js
import hct, { hctContent } from 'hct-web-design-template/tailwind-preset'
export default {
  presets: [hct],
  content: [...hctContent, './index.html', './src/**/*.{js,jsx,ts,tsx}'],
}
```

```css
/* 앱의 CSS 맨 위 */
@import 'hct-web-design-template/styles/hct.css';
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- v3 에서 `hctContent` 는 필수입니다. Tailwind v3 가 프리셋의 `content` 를
  병합하지 않아, 빼먹으면 `node_modules` 안의 컴포넌트 클래스가 전부 purge 됩니다.
  (v4 는 `@source` 가 패키지 CSS 안에 있어 이 문제가 없습니다.)
- 두 버전을 섞지 마세요. hct.css 와 hct.v4.css 중 하나만 씁니다.
- 팔레트·테마 설정은 필요 없습니다. 속성을 안 붙이면 기본 팔레트가 적용됩니다.

무언가 잘못되면 `AppShell` 이 마운트될 때 콘솔에 무엇을 고쳐야 하는지 적힌
오류를 남깁니다. 화면이 밋밋하게 나오면 콘솔부터 보세요.

---

## 1-1. 화면 원형 16종

`src/pages/` 에 있는 화면들입니다. 각 파일 맨 위 주석에 **그 화면에서 흔히
저지르는 실수와 그것을 어떻게 막았는지**가 적혀 있습니다. 복사하기 전에 그
주석부터 읽으세요 — 규칙보다 그쪽이 더 많은 것을 알려줍니다.

| 원형 | 파일 | 언제 씁니까 |
|---|---|---|
| 1. 대시보드 | `DashboardPage.jsx` | 지표 → 드릴다운. 숫자를 누르면 목록으로 |
| 2. 목록 | `ListPage.jsx` | 표·보드·저장된 뷰·상세 패널. **가장 자주 쓰는 원형** |
| 3. 설정 | `SettingsPage.jsx` | 워크스페이스 전체에 영향을 주는 값 |
| 4. 대용량 목록 | `ScalePage.jsx` | 수천 행. 가상화·조건 전체 선택 |
| 5. 로그인 | `LoginPage.jsx` | 셸 밖. `AuthLayout` 사용 |
| 6. 관리자 | `AdminPage.jsx` | 사용자·역할·권한 |
| 7. 알림 인박스 | `InboxPage.jsx` | 이벤트가 아니라 **객체 단위로 묶은** 큐 |
| 8. 내 계정 | `AccountPage.jsx` | 나에게만 적용되는 값. 설정과 절대 합치지 마세요 |
| 9. 가져오기 마법사 | `ImportPage.jsx` | 올리기 → 열 연결 → **확인** → 실행 |
| 10. 감사 로그 | `AuditPage.jsx` | 고칠 수 없는 기록. 이전 값 → 이후 값 |
| 11. 승인 대기 | `ApprovalsPage.jsx` | 남의 요청 검토. 반려에는 사유 필수 |
| 12. 검색 결과 | `SearchPage.jsx` | 종류별 묶음 + 일치 부분 강조 |
| 13. 예약 작업 | `JobsPage.jsx` | 배치 목록. **실패의 가시성**이 전부 |
| 14. 연동·API 키·웹훅 | `IntegrationsPage.jsx` | 바깥과 연결되는 지점 전부 |
| 15. 빈 워크스페이스 | `OnboardingPage.jsx` | 첫 실행. 사람들이 처음 보는 화면 |
| 16. 사용량과 청구 | `BillingPage.jsx` | 한도를 넘기 **전에** 알려주는 화면 |
| — 오류 4종 | `ErrorPages.jsx` | 403·404·500·점검 중 |
| — 인증 흐름 | `AuthPages.jsx` | 초대 수락·비밀번호 재설정 |

---

## 1-2. 내비게이션은 한 곳에서만 정의합니다

사이드바를 화면마다 직접 조립하지 마세요. 화면을 옮길 때마다 메뉴가 달라지면
사용자는 자기가 다른 제품에 온 줄 압니다.

```jsx
import { AppFrame } from './_shell'

<AppFrame
  active="list"                                  // NAV 항목 id
  onNavigate={goto}                              // 항목 클릭 시
  counts={{ list: 18, inbox: true, users: 8 }}   // 배지. true = 숫자 없는 안읽음
  mentions={{ inbox: 3 }}                        // 나를 부른 것 (빨간 배지)
  extraNav={<SidebarGroup label="내 뷰">…</SidebarGroup>}  // 화면 고유 탐색
  rightPanel={selected && <RightPanel …/>}
>
  <PageContainer>…</PageContainer>
</AppFrame>
```

- 메뉴 항목을 늘리려면 `src/pages/_shell.jsx` 의 `NAV` 에 추가합니다.
- 배지 숫자는 `counts` 로 **주입**합니다. `NAV` 에 하드코딩하면 목록에서 본
  개수와 대시보드에서 본 개수가 어긋납니다.
- 저장된 뷰처럼 그 화면에만 있는 탐색은 `extraNav` 로 붙입니다.
- 검색창은 `AppFrame` 이 기본으로 넣습니다. 화면마다 다른 자리에 두지 마세요.
- 셸 밖 화면(로그인·초대·500·점검)만 `AppFrame` 을 쓰지 않습니다.

---

## 2. 색상 — 절대 규칙

### 생색을 쓰지 않습니다

Tailwind 기본 팔레트는 이 프로젝트에서 **삭제되었습니다**. `bg-blue-500` 은 존재하지 않는
클래스이고, 아무 효과 없이 조용히 무시됩니다. 반드시 시맨틱 토큰을 쓰세요.

### 배경 — 4단 표면 체계

| 토큰 | 용도 |
|---|---|
| `bg-bg-canvas` | 페이지 최하단 배경 |
| `bg-bg-surface` | 카드·패널·테이블 본문 |
| `bg-bg-raised` | 드롭다운·모달 (떠 있는 것) |
| `bg-bg-sunken` | 테이블 헤더·입력 내부·인셋 |
| `bg-bg-hover` / `bg-bg-active` | 상호작용 상태 |

### 텍스트 — 4단 위계

`text-fg-primary` (본문) → `text-fg-secondary` (보조) → `text-fg-tertiary` (메타) →
`text-fg-disabled` (비활성)

**한 화면에서 3단계를 넘게 섞지 마세요.** 위계가 많아지면 위계가 사라집니다.

### 테두리

`border-line-subtle` (테이블 행 구분) · `border-line-default` (카드·입력) ·
`border-line-strong` (강한 구획)

### 다크 모드는 신경 쓰지 않습니다

시맨틱 토큰이 두 모드를 모두 정의합니다. **`dark:` 변형을 직접 쓰면 검사에서 실패합니다.**
토큰만 쓰면 다크 모드는 저절로 동작합니다.

차트처럼 JS 에서 색이 필요할 때만 CSS 변수를 읽으세요:

```js
const accent = getComputedStyle(document.documentElement)
  .getPropertyValue('--color-accent-solid').trim()
```

---

## 3. 상태 색상 — 통일성의 핵심

관리도구에서 "진행중"이 화면마다 다른 색이면 제품이 무너집니다.
**색을 직접 고르지 말고 워크플로 상태 이름을 넘기세요.**

```jsx
<StatusBadge status="inProgress" dot />   {/* 좋음 */}
<span className="bg-info-bg ...">진행중</span>  {/* 나쁨 — 직접 조립 금지 */}
```

| status | 색조 | 기본 라벨 |
|---|---|---|
| `todo` | 회색 | 대기 |
| `inProgress` | 파랑 | 진행중 |
| `inReview` | 보라 | 검토중 |
| `blocked` | 빨강 | 차단됨 |
| `done` | 초록 | 완료 |
| `pending` | 주황 | 보류 |
| `failed` | 빨강 | 실패 |
| `active` / `inactive` | 초록 / 회색 | 활성 / 비활성 |

새 상태가 필요하면 임의 색을 만들지 말고
`src/components/feedback/StatusBadge.jsx` 의 `WORKFLOW_STATUS` 에 추가하세요.

**색상만으로 의미를 전달하지 않습니다.** 뱃지에는 항상 텍스트가 함께 있습니다(색각 이상 대응).

---

## 3-0. 로고

회사 로고와 브랜드 설정은 `tokens/brand.json` 과 `src/assets/brand/` 에 있습니다.
원본은 **보고서 템플릿 저장소**(`hct-report-template` · `brand/hct/`)이며,
보고서와 화면이 같은 자산을 쓰도록 옮겨 온 것입니다.

```jsx
<Logo on="dark" height={22} />    {/* 어두운 사이드바 */}
<Logo on="light" height={40} />   {/* 흰 로그인 카드 */}
<LogoMark size={32} />            {/* 폭이 없는 자리 */}
```

규칙:

- **`on` 은 테마가 아니라 '로고가 놓이는 면'의 밝기입니다.** HCT·네이비·플럼
  팔레트는 라이트 테마에서도 사이드바가 어둡습니다. `on="auto"` 로 두면 밝은
  면용 원색 로고가 어두운 사이드바에 얹혀 사라집니다(원색 #2F4A9C 는 딥네이비
  대비 2:1). 사이드바 안에서는 항상 `on="dark"` 를 명시하세요.
- **로고 비율을 바꾸지 마세요.** `height` 만 지정합니다.
- 폭이 좁은 자리(레일, 접힌 사이드바)에서 가로로 긴 로고를 줄이면 글자가
  뭉갭니다. `LogoMark` 를 쓰세요.
- 로고 파일은 번들에 data URI 로 인라인됩니다. 경로 참조로 바꾸면 정적 배포나
  단일 파일 임베드에서 로고만 깨집니다.

**강조색이 로고색(#2F4A9C)인 이유**: 보고서 템플릿 README 가 "회사 지정색을
쓰려면 로고색을 쓰라"고 명시했습니다. 같은 색을 쓰면 보고서와 화면이 한
가족으로 읽힙니다. 팔레트를 바꾸더라도 이 근거를 확인하고 바꾸세요.

> 원본이 264×86 래스터입니다. SVG 가 확보되면 `Logo.jsx` 만 고치면 됩니다.

---

## 3-1. 사이드바 안에서는 sidebar-* 토큰만 쓰세요

사이드바는 본문과 **밝기가 다를 수 있습니다.** 팔레트에 따라 라이트 테마에서도
사이드바만 어두울 수 있습니다(플럼 팔레트가 그렇습니다).

```jsx
<span className="text-fg-primary">…</span>     {/* 나쁨 — 어두운 사이드바에서 사라집니다 */}
<span className="text-sidebar-fg">…</span>     {/* 좋음 */}
```

| 토큰 | 용도 |
|---|---|
| `bg-sidebar-bg` / `bg-sidebar-rail` | 사이드바 · 워크스페이스 레일 배경 |
| `text-sidebar-fg` / `-muted` / `-subtle` | 본문 · 보조 · 흐림 |
| `bg-sidebar-hover` | 호버 |
| `bg-sidebar-active-bg` / `text-sidebar-active-fg` | 선택된 항목 |
| `border-sidebar-border` | 구분선 |
| `bg-sidebar-badge-bg` / `text-sidebar-badge-fg` | 멘션 배지 |

### 안읽음은 세 가지를 구분합니다

```jsx
<SidebarItem label="알림" unread mentions={3} />   {/* 굵게 + 빨간 배지 */}
<SidebarItem label="보관함" badge={12} />          {/* 중립 카운트 */}
```

| | 의미 | 표현 |
|---|---|---|
| `unread` | 새 내용이 있음 | 글자가 굵고 진해짐 (배지 없이도 눈에 띔) |
| `mentions` | **나를** 직접 부름 | 빨간 배지에 숫자 |
| `badge` | 참고 수치 | 흐린 숫자 |

셋을 구분하지 않고 전부 배지로 만들면 모든 숫자가 똑같이 급해 보여서
결국 아무것도 급하지 않게 됩니다.

### 항목이 늘어나는 그룹은 접히게

```jsx
<SidebarGroup label="내 뷰" collapsible count={views.length}>
```

저장된 뷰나 채널처럼 사용자가 계속 추가하는 목록은 반드시 `collapsible` 을
켜세요. 사이드바가 수십 개를 견디는 유일한 방법입니다.

---

## 4. 레이아웃 — 모든 화면은 앱 셸 안에

> 실제 화면에서는 `AppShell` 을 직접 쓰지 말고 [`AppFrame`](#1-2-내비게이션은-한-곳에서만-정의합니다)
> 을 쓰세요. 아래는 `AppFrame` 이 내부에서 무엇을 하는지 보여주는 구조입니다.

```jsx
<AppShell
  sidebar={<Sidebar>…</Sidebar>}
  topbar={<Topbar breadcrumb={…} />}
  rightPanel={selected && <RightPanel …/>}   // 선택
>
  <PageContainer>
    <PageHeader title="…" description="…" actions={…} />
    {/* 페이지 내용 */}
  </PageContainer>
</AppShell>
```

규칙:

- **페이지 제목은 `PageHeader` 에만 씁니다.** 상단바에 또 쓰지 마세요(중복).
- 사이드바 너비·상단바 높이를 직접 지정하지 마세요. 토큰이 정합니다.
- `PageContainer` 밖에서 좌우 여백을 따로 주지 마세요. 화면마다 정렬이 어긋납니다.

### 모달 · 드로어 · 우측 패널 구분

표를 직접 만들어도 되는 컴포넌트는 셋뿐입니다: `DataGrid`(레코드 목록),
`ChartTable`(차트의 접근성 대체본), `MatrixTable`(역할×권한 같은 대조표).
그 외에는 이 셋 중 하나를 쓰세요.

| 상황 | 사용 |
|---|---|
| 확인, 짧은 생성 폼, 삭제 경고 | `Modal` / `ConfirmDialog` |
| 목록 맥락 유지한 채 상세 보기·편집 | `Drawer` |
| 계속 열어두는 상시 상세 (지라 이슈 패널) | `RightPanel` (셸의 일부) |

---

## 5. 밀도 — 지라형 고밀도

이 시스템의 본문은 **14px** 입니다. 16px 이 아닙니다. 관리도구는 한 화면에 정보가 많이
들어가야 합니다.

- 타입 스케일: `text-micro`(11) `text-xs`(12) `text-sm`(13) `text-base`(14) `text-md`(16)
  `text-lg`(20) `text-xl`(24) `text-metric`(28)
- 간격은 **4px 배수만** 씁니다: `0 0.5 1 1.5 2 2.5 3 4 5 6 8 10 12 16 20 24`
  스케일 밖 값(`h-7`, `pl-7`, `p-[13px]`)은 CSS 가 생성되지 않아 조용히 무시됩니다.
- 컨트롤 높이: `h-control-sm`(28) `h-control-md`(32) `h-control-lg`(36)
- 모서리는 작게: 최대 `rounded-xl`(12px). `rounded-2xl` 이상은 이 시스템에 없습니다.

### 카드 격자를 직접 만들지 마세요

```jsx
<StatGrid columns={4}>...</StatGrid>       {/* 지표 타일·요약 카드 — sm 부터 2열 */}
<WidgetGrid columns={2}>...</WidgetGrid>   {/* 차트·위젯 — lg 전까지 1열 */}
```

둘로 나뉘어 있는 이유는 **접히는 지점이 다르기 때문**입니다. 지표 타일은
640px 에서 두 열로 놔도 읽히지만, 축과 범례가 있는 차트를 640px 에서 반으로
자르면 눈금이 겹쳐 못 읽습니다.

`grid gap-3 lg:grid-cols-2` 를 화면에서 직접 쓰면 검사에서 실패합니다
(`no-adhoc-card-grid`). 왜 막느냐면, 실제로 이 저장소의 화면 7곳이 격자를
직접 만들면서 간격이 `gap-2` · `gap-2.5` · `gap-3` 으로 갈라져 있었기
때문입니다. 그 2px 차이는 한 화면 안에서는 안 보이지만 화면을 넘나들면
"같은 제품이 아닌 것 같은" 느낌으로 남습니다. 눈으로는 못 찾고 세어봐야
찾힙니다.

넓은 위젯과 좁은 위젯을 나란히 두려면 `columns={3}` 에 넓은 쪽만
`className="lg:col-span-2"` 를 주세요.

### 한국어 텍스트

- **줄바꿈은 전역에서 `word-break: keep-all`** 입니다. 브라우저 기본값은 어절
  한가운데를 끊어 "저장이" 를 "저 / 장이" 로 만듭니다. 따로 설정하지 마세요.
- 대신 공백 없는 긴 문자열(URL·요청 ID·API 키·IP)은 넘칠 수 있습니다.
  그런 값을 담는 곳에만 **`.break-token`** 을 붙이세요.
- 조사를 코드로 붙이지 마세요. `{name} 가` 는 이름에 따라 "김민수 가" 가 됩니다.
  `{name} 님이` 처럼 받침과 무관한 표현을 쓰거나, 문장을 다시 쓰세요.
- 숫자는 `.tabular` 를 붙입니다. 시각·건수·금액이 줄마다 흔들리면 비교가 안 됩니다.

---

## 6. 목록 — DataGrid

`<table>` 을 직접 만들지 마세요. `DataGrid` 가 로딩·에러·빈 결과·선택·편집을
모두 처리합니다.

```jsx
<GridCard>
  <ViewTabs views={views} activeViewId={id} onSelectView={…} dirty={dirty} />
  <QueryBar fields={FIELDS} query={query} onChange={setQuery} resultCount={visible.length} />
  <GridToolbar
    left={<><ViewSwitcher value={viewType} onChange={setViewType} />
            <GroupByPicker fields={FIELDS} value={query.groupBy} onChange={…} /></>}
    right={<>
      <ColumnSettings fields={FIELDS} visibleFields={columns}
                      onChange={setColumns} primaryField="title" />
      <DensityToggle value={density} onChange={setDensity} />
    </>}
  />
  <DataGrid
    fields={FIELDS}
    visibleFields={['id', 'title', 'status', 'owner', 'count']}
    primaryField="title"
    records={visible}
    onEditRecord={editRecord}
    onRowClick={openDetail}
    groupField={query.groupBy ? fm[query.groupBy] : null}
    sort={query.sort}
    onToggleSort={(k) => setQuery(toggleSort(query, k))}
    rowActions={(r) => <IconButton size="xs" label="삭제" icon={<NavIcons.Trash />} … />}
    bulkActions={<Button size="xs">완료 처리</Button>}
  />
  <GridPagination page={page} pageSize={20} total={visible.length} onPageChange={setPage} />
</GridCard>
```

### primaryField 를 반드시 지정하세요

인라인 편집과 "상세 열기"는 둘 다 클릭이라 충돌합니다. 노션의 해법을 씁니다:

- **주 필드(제목) 클릭 → 레코드를 엽니다**
- **나머지 필드 클릭 → 그 자리에서 편집합니다**

화면마다 다르게 정하면 사용자가 매번 어디를 눌러야 할지 헷갈립니다.

### 인라인 편집은 useRecords 로

직접 `setState` 로 구현하면 롤백과 활동 기록이 빠집니다.

```jsx
const { records, editRecord, bulkEdit, addComment, activityOf } =
  useRecords(initial, { actor: currentUser, persist: saveToServer })
```

`persist` 가 실패하면 **자동으로 되돌리고 알립니다.** 조용히 되돌리면
사용자는 자기가 고친 줄 압니다.

### 호버로 드러나는 행 액션

`rowActions` 는 평소 숨어 있다가 행 위에서만 나타납니다.
항상 보이게 만들면 목록이 버튼밭이 되어 데이터가 안 읽힙니다.
노션의 밀도는 여백이 아니라 **평소에 아무것도 안 보이는 것**에서 나옵니다.

### 벌크 액션

선택 기능은 기본으로 켜져 있습니다. Shift 로 범위 선택이 됩니다.
`bulkActions` 를 넘기면 하단에 액션 바가 뜹니다.
선택 개수와 해제 수단이 항상 함께 보입니다.

---

## 6-1. 객체 상세 — ObjectDetail

읽기 전용 속성 나열 + 저장 버튼은 이 시스템에서 쓰지 않습니다.

```jsx
<ObjectDetail
  record={record}
  fields={FIELDS}
  onEdit={(key, value) => editRecord(record, key, value)}
  activity={activityOf(record.id)}
  onAddComment={(body) => addComment(record.id, body)}
/>
```

- 제목·필드가 그 자리에서 편집됩니다 (저장 버튼 없음)
- 상태는 `StatusTransition` 으로 바뀝니다 — 필드 편집이 아니라 워크플로 진행입니다
- **변경 이력과 댓글이 한 줄기로 흐릅니다.** 탭으로 나누지 마세요.
  "누가 상태를 바꿨고 → 그래서 누가 뭐라고 했는지"가 이어져 읽혀야 합니다

---

## 6-2. 어디에 상세를 띄울까

| 상황 | 사용 |
|---|---|
| 목록 맥락을 유지한 상시 상세 | `RightPanel` + `ObjectDetail` |
| 넓은 폭이 필요한 임시 상세 | `Drawer` + `ObjectDetail` |
| 확인·짧은 폼 | `Modal` / `ConfirmDialog` |

---

## 6-3. 목록을 바꾸는 행동에는 토스트와 실행 취소

18건 중 4건을 골라 "완료 처리"를 눌렀는데 화면이 조용하면, 사용자는 눌린
건지 몇 건이 바뀐 건지 모릅니다. 실수였다면 되돌릴 방법도 없습니다.

```jsx
const { toast } = useToast()
const { count, undo } = bulkEdit(selected, 'status', 'done')
toast({ message: `${count}건을 완료 처리했습니다`, action: { label: '실행 취소', onClick: undo } })
```

규칙:

- 목록을 바꾸는 행동은 **반드시** 토스트로 결과를 알립니다
- 되돌릴 수 있는 행동은 **반드시** 실행 취소를 함께 제공합니다
- `useRecords` 의 `bulkEdit` / `removeRecords` 는 `{ count, undo }` 를 반환합니다.
  직접 `setState` 로 구현하면 이 스냅샷이 없습니다
- **확인 대화상자보다 실행 취소가 낫습니다.** 확인창은 매번 귀찮고 결국
  읽지 않고 누르게 되지만, 실행 취소는 실제로 되돌려 줍니다

앱 최상단을 `<ToastProvider>` 로 감싸세요.

---

## 6-3-1. 되돌릴 수 없는 작업

실행 취소를 줄 수 없는 일이 있습니다(세션 폐기, API 키 폐기, 영구 삭제).
그럴 때 지킬 것:

- **확인 대화상자에 무슨 일이 일어나는지 적으세요.** `ConfirmDialog` 의
  `description` 이나 children 에 씁니다. 제목만으로 판단을 요구하지 마세요.
- **되돌릴 수 없다고 명시**하세요. 다른 곳에는 실행 취소가 있으므로
  사용자는 여기에도 있으리라 기대합니다.
- **되돌릴 수 없는 일에 실행 취소 토스트를 붙이지 마세요.** 눌러도 아무 일이
  일어나지 않는 버튼이 가장 나쁩니다.
- 중단(cancel)과 취소(undo)를 구분해서 말하세요. "중단했습니다 — 이미 들어간
  1,204건은 그대로 남아 있습니다" 처럼, 어디까지 갔는지 알려줘야 합니다.

---

## 6-4. 키보드로 목록을 다룰 수 있어야 합니다

관리도구를 하루 종일 쓰는 사람에게 키보드는 편의가 아니라 속도의 전부입니다.
`DataGrid` 는 기본으로 아래를 지원합니다 — 별도 설정이 필요 없습니다.

| 키 | 동작 |
|---|---|
| `↑` `↓` 또는 `k` `j` | 행 이동 |
| `Enter` | 상세 열기 |
| `X` 또는 `Space` | 선택 토글 |
| `Shift` + `↑↓` | 선택 확장 |
| `⌘/Ctrl` + `A` | 전체 선택 |
| `Esc` | 선택 해제 |
| `?` | 단축키 도움말 |

`<ShortcutHelp open={helpOpen} onClose={setHelpOpen} />` 를 화면에 두세요.

**전역 단축키의 주인은 한 곳이어야 합니다.** 두 컴포넌트가 같은 키를
처리하면 서로를 토글해 아무 일도 일어나지 않습니다. `?` 의 주인은
`ShortcutHelp` 입니다 — 다른 곳에서 처리하지 마세요.

---

## 6-5. 질의를 주소창과 묶으세요

```jsx
useQuerySync(query, setQuery, { fields: fm })
```

이 한 줄로 필터된 목록이 링크가 됩니다:

```
?q=결제&f=status:in:blocked,doing;errors:gte:100&s=errors:desc&g=system
```

팀 도구에서 "이 화면 좀 봐줘"를 말로 설명하지 않아도 됩니다.
형식은 일부러 사람이 읽고 손으로 고칠 수 있게 유지했습니다.

---

## 6-6. 폼 — 설정·편집 화면

관리도구의 폼은 회원가입 폼과 다릅니다. 대부분 **기존 값을 고치는** 일이라
"무엇이 바뀌었는가"가 핵심입니다.

```jsx
const form = useForm({ initialValues, validate, onSubmit })

<Form onSubmit={form.submit}>
  <FormErrorSummary errors={form.errors} labels={LABELS} onFocusField={focus} />
  <FormSection id="sec-general" title="일반" description="…">
    <FormRow label="이름" htmlFor="f-name" error={form.errors.name}>
      <TextField id="f-name" label="이름" hideLabel {...form.fieldProps('name')} error={undefined} />
    </FormRow>
  </FormSection>
</Form>
<SaveBar dirty={form.dirty} changedCount={Object.keys(form.changed).length}
         onSave={form.submit} onReset={form.reset} saving={form.submitting} />
```

규칙:

- **섹션마다 저장 버튼을 두지 마세요.** 변경이 생기면 `SaveBar` 하나가 뜹니다.
  몇 건이 바뀌었는지 함께 보여줘야 합니다 — 긴 화면에서 사용자는 기억하지 못합니다.
- **입력하는 도중에 오류를 띄우지 마세요.** `useForm` 은 blur 이후 또는 제출
  시도 이후에만 보여줍니다. 다 치지도 않았는데 빨간 글씨가 뜨면 혼나는 느낌입니다.
- 긴 폼은 제출 실패 시 `FormErrorSummary` 로 상단에 모으고, 클릭하면 해당
  필드로 이동해야 합니다. 화면 밖 오류는 없는 것과 같습니다.
- 좌측 목차(`SettingsNav`)는 **실제로 그 섹션으로 데려가야** 합니다.
  상태만 바꾸고 화면이 그대로면 눌리지 않은 것과 같습니다.
- 선택지가 10개를 넘으면 `SelectField` 대신 `Combobox` 를 쓰세요.
- 폼 안의 버튼 줄은 `FormActions` 로 감쌉니다. `FormRow` 와 같은 격자를 써서
  필드 열에 정렬됩니다. 직접 여백을 계산하지 마세요.
- `FormRow` 의 렌더 프롭이 주는 `invalid` 를 필드에 그대로 넘기세요.
  메시지는 `FormRow` 가 그리고, 필드는 테두리와 `aria-invalid` 만 담당합니다.

  ```jsx
  <FormRow label="이름" error={form.errors.name}>
    {({ id, invalid }) => (
      <TextField id={id} invalid={invalid} value={…} onChange={…} />
    )}
  </FormRow>
  ```

- 필드가 없으면 레코드가 성립하지 않는다면 **스키마에 `required: true`** 를
  적으세요. 만들기 폼과 가져오기 검증이 같은 값을 봅니다. 화면마다 따로
  정하면 가져오기로는 들어오는데 폼으로는 못 만드는 레코드가 생깁니다.

---

## 6-7. 차트

`ChartFrame` 은 껍데기이고 실제 차트는 `LineChart` / `BarChart` 입니다.

**색은 두 체계로 나뉩니다:**

| 무엇을 그리는가 | 쓰는 색 |
|---|---|
| 상태 (완료/진행중/차단됨) | `STATUS_CHART_COLOR` — 뱃지와 같은 색 |
| 임의 차원 (시스템별·담당자별) | `assignSeriesColors()` — 계열 색 6종 |
| 크기 (많다/적다, 히트맵) | `CHART_SEQ` / `seqStep()` — 순차형 5단계 |

절대 규칙:

- **축은 하나뿐입니다.** 단위가 다른 두 지표를 겹치지 마세요. 차트를 나누거나
  공통 기준으로 지수화하세요. 이중 축은 아무 관계나 있어 보이게 만듭니다.
- **계열 색을 순환시키지 마세요.** 7번째 계열은 새 색이 아니라 `foldSeries()`
  로 '기타'에 묶습니다. 색이 8개를 넘으면 범례를 외울 수 없습니다.
  안 접고 넘기면 콘솔이 무엇을 해야 하는지 알려줍니다.
- **접는 것과 자르는 것은 다릅니다.** 조각을 다 더했는데 총계와 다르면
  사용자는 그때부터 이 화면의 숫자를 믿지 않습니다. `foldSeries()` 는 합칩니다.
- **색은 항목에 붙습니다. 순위가 아니라.** 필터로 계열이 사라져도 남은 항목의
  색이 바뀌면 안 됩니다.
- **상태 색을 '계열 4번'으로 쓰지 마세요.** 차트에서 초록이 '성공'이 아니라
  임의 계열을 뜻하면 의미 체계가 무너집니다.
- 계열이 2개 이상이면 범례가 항상 있습니다. 색만으로 정체를 전달하지 않습니다.
- 값 글자는 계열 색이 아니라 **텍스트 토큰**을 씁니다.
- 막대는 0에서 시작합니다. 누적 조각 사이에는 2px 간격을 둡니다.
- 점마다 숫자를 찍지 마세요. 호버 툴팁이 그 일을 합니다.
- 접근성 대체본으로 `ChartTable`(표 보기)을 함께 두세요.

### 선을 직접 그린다면 파선을 함께 쓰세요

계열 색 6종은 **명도를 맞추고 색상만 바꾼** 팔레트입니다. 순위처럼 보이지
않게 하려는 의도적인 선택인데, 그 대가로 **계열끼리는 명도로 구별되지
않습니다.** 재봤습니다 — 15쌍 전부 3:1 미만이고, 가장 가까운 쌍은 1.01:1 로
사실상 같은 밝기입니다.

그래서 흑백 인쇄·색각 이상·저품질 프로젝터에서는 색상만으로 구별할 수
없습니다. 두 번째 단서가 필요합니다:

```jsx
const colors = assignSeriesColors(keys)
const dashes = assignSeriesDash(keys)   // 색과 짝을 이룹니다
<path stroke={colors[k]} strokeDasharray={dashes[k] || undefined} />
<ChartLegend series={series} colors={colors} dashes={dashes} />
```

`LineChart` 는 이미 이렇게 합니다. **범례에도 같은 패턴을 넘기세요** — 선은
파선인데 범례가 사각형이면 둘을 맞출 방법이 없습니다.

막대 차트는 파선이 필요 없습니다. 조각이 위치로 구분되고, 누적 막대는 조각
사이 2px 간격에 표면색이 비쳐서 서로 붙지 않습니다.

`npm run audit:charts` 가 파선이 실제로 적용되어 있는지 확인합니다. 파선을
지우면 팔레트가 규격 위반이 되므로, 둘은 함께 있거나 함께 바뀌어야 합니다.

### 숫자 교차표에는 `heat` 를 켜세요

```jsx
<MatrixTable heat rowHeader="시험실" columns={states} rows={labs} />
```

숫자만 나열하면 어느 칸이 뜨거운지 보려고 **모든 칸을 읽어야** 합니다.
진하기가 있으면 눈에 먼저 들어옵니다. 숫자는 그대로 찍히므로 색을 못 봐도
잃는 것이 없습니다 — 그래서 이 색의 검사 기준은 '칸 대 배경'이 아니라
**칸 위의 글자가 4.5:1 을 넘는가** 입니다.

0은 칠하지 않습니다. 빈 칸과 '적은 값'은 다른 뜻인데 옅게 칠하면 같아 보입니다.

차트 색을 새로 넣거나 고치려면 **`npm run audit:charts` 를 통과해야 합니다.**
눈으로 판단하지 마세요 — 이 저장소의 차트 색도 "검증을 통과한 값" 이라는
주석만 달린 채 한 번도 측정된 적이 없었고, 재보니 기준 미달이 있었습니다.

---

## 6-8. 대용량 목록

수백 건을 넘으면 `virtualize` 를 켜세요. 보이는 행만 그립니다.

```jsx
<DataGrid virtualize maxHeight={520} … />
```

주의:

- **그룹핑과 함께 쓸 수 없습니다.** 행 높이가 균일하지 않아 계산이 틀립니다
  (그룹핑이 켜지면 자동으로 꺼집니다).
- **브라우저 검색(⌘F)이 화면 밖 행을 찾지 못합니다.** 그래서 목록 자체의
  검색(`QueryBar`)이 반드시 있어야 합니다.
- 서버 페이지네이션과 함께 쓸 때는 `matchingCount` 를 넘기세요.
  화면에 불러온 것만 선택된 상태를 사용자에게 드러내고,
  "조건에 맞는 N건 전체 선택"을 제안합니다. 이게 없으면 사용자는 5,000건을
  선택했다고 믿은 채 500건에만 작업하게 됩니다.

---

## 6-9. 오래 걸리는 작업

```jsx
<JobStatus title="재처리" state="partial" total={500} completed={500}
           failures={failures} onRetryFailed={retry} />
```

- 남은 시간을 모르면 **몇 건 중 몇 건인지**라도 보여주세요.
  "처리 중…"만 있으면 멈춘 건지 도는 건지 알 수 없습니다.
- **부분 실패를 숨기지 마세요.** 500건 중 75건이 실패했는데 "완료"라고만
  하면 거짓말입니다. 무엇이 왜 실패했는지 보이고, 실패한 것만 다시 시도할
  수 있어야 합니다.

---

## 6-10. 화면 하단 중앙은 셋이 다툽니다

`BulkActionBar`, `SaveBar`, 그리고 토스트가 모두 하단 중앙에 뜹니다.
각자 `fixed bottom-4` 로 자리를 잡으면 둘이 동시에 뜨는 순간 겹칩니다.

상주형 바는 `useBottomBar(active, height)` 로 자기 높이를 알리고,
토스트는 그만큼 위로 올라갑니다. 하단에 새 상주 요소를 만들면 이 훅을 쓰세요.

---

## 7. 빠뜨리면 안 되는 상태 3종

목록·테이블·차트를 만들 때 아래 세 가지를 **반드시** 처리하세요.
빈 테이블 헤더만 남기는 화면은 이 시스템에서 결함으로 취급합니다.

| 상황 | 컴포넌트 | 반드시 제공할 것 |
|---|---|---|
| 데이터가 아직 없음 | `EmptyState` | 생성 버튼 |
| 필터·검색 결과 없음 | `NoResults` | 필터 초기화 수단 |
| 불러오기 실패 | `ErrorState` | 재시도 버튼 |
| 로딩 중 | `SkeletonTable` / `SkeletonStatCard` | 실제 콘텐츠와 같은 모양 |

로딩에 스피너 하나를 화면 가운데 띄우지 마세요. 레이아웃이 흔들립니다.
200ms 안에 끝나는 로딩은 아무것도 표시하지 않는 편이 낫습니다.

---

## 8. 필터는 눈에 보여야 합니다

사용자가 "왜 결과가 이것뿐이지?"라고 묻게 되는 화면은 결함입니다.
`FilterBar` 에 `activeFilters` 를 넘기면 적용된 필터가 태그로 보이고 초기화 수단이 붙습니다.

---

## 9. 접근성 — 협상 불가

- **포커스 표시를 지우지 마세요.** `outline-none` 은 검사에서 실패합니다.
  (정당한 예외는 아래 "예외 처리" 참고)
- 아이콘 전용 버튼에는 `aria-label` 이 필수입니다. `IconButton` 은 `label` 을 강제합니다.
- 모든 입력에는 라벨이 있어야 합니다. 시각적으로 숨기려면 `hideLabel` 을 쓰되
  `label` 자체를 생략하지 마세요.
- 오류를 빨간 테두리만으로 표시하지 마세요. 메시지를 함께 보여줍니다.
- 모달·드로어는 Esc 로 닫히고 포커스를 되돌립니다 (이미 구현되어 있음).

---

## 9-1. className 으로 기본값 덮어쓰기

모든 컴포넌트는 `className` 을 받아 기본 스타일을 덮어쓸 수 있습니다.
내부적으로 `cn()`(clsx + tailwind-merge)이 **충돌을 해소**하므로 뒤에 온 값이 이깁니다.

```jsx
<SearchInput className="w-[240px]" />   // 기본 w-full 을 실제로 덮어씁니다
```

`src/lib/cn.js` 에는 이 시스템의 커스텀 스케일(`h-control-*`, `text-metric`,
`w-sidebar` 등)이 등록되어 있습니다. **`tailwind.config.js` 에 새 스케일을 추가하면
`cn.js` 의 `classGroups` 에도 함께 등록하세요.** 빠뜨리면 그 클래스는 충돌 해소가
되지 않아 덮어쓰기가 조용히 실패합니다.

---

## 10. 새 컴포넌트가 필요할 때

1. **먼저 `src/components/index.js` 를 확인하세요.** 이미 있는 것을 다시 만들지 마세요.
2. 기존 컴포넌트의 조합으로 되는지 보세요. 대부분 됩니다.
3. 그래도 필요하다면:
   - `src/components/<범주>/` 에 만들고 배럴 파일에 export 를 추가합니다.
   - 시맨틱 토큰만 사용합니다. 생색·`dark:` 금지.
   - 로딩·빈 상태·에러 상태를 함께 설계합니다.
   - 상단에 JSDoc 으로 **"개발 에이전트 사용 규칙"** 을 적습니다. 다음 에이전트가 읽습니다.
   - `npm run lint:design` 통과를 확인합니다.

---

## 11. 예외 처리

규칙을 어겨야 하는 정당한 경우가 드물게 있습니다. 그럴 때만:

```jsx
/* 이유를 반드시 적습니다 */
// design-lint-disable-next-line no-focus-outline-removal
<input className="outline-none" />
```

**이유 없는 예외는 리뷰에서 되돌립니다.**

---

## 12. 제출 전 확인

```bash
npm test               # 로직 단위 테스트 (반드시 통과)
npm run lint:design    # 디자인 규칙 (반드시 통과)
```

`npm test` 는 **순수 로직만** 봅니다 — 질의·필드·CSV·가져오기 검증·지표·
차트 토큰. 화면은 브라우저와 `audit:a11y` 로 확인합니다.

로직 층을 따로 지키는 이유는 여기가 **스키마 하나에서 모든 화면이
파생되는 자리**이기 때문입니다. `applyQuery` 가 조용히 틀리면 표도 보드도
대시보드도 함께 틀립니다. 그리고 이 저장소에서 지금까지 나온 버그는
**전부 이 층에 있었고 전부 우연히 발견됐습니다.**

로직을 고쳤으면 **그 버그를 재현하는 테스트를 먼저 남기세요.** 고치기만
하면 다음 사람이 같은 자리에서 같은 실수를 합니다. 자세한 것은
[test/README.md](./test/README.md) 에 있습니다.

눈으로 훑어서는 안 잡히는 것들이 있습니다. 대비 미달, 이름 없는 컨트롤,
중복 id, 중첩된 조작 요소 — 전부 화면을 봐도 멀쩡해 보입니다. 그래서
재는 도구를 씁니다:

```bash
npm run audit:a11y     # 전 화면 × 2폭 × 2테마 를 axe-core 로 검사 (WCAG 2.1 A/AA)
npm run audit:charts   # 차트 색 대비 (axe 도 팔레트 검사도 못 보는 사각지대)
npm run audit:docs     # 이 문서가 가리키는 이름이 실제로 있는지
npm run audit:exports  # 아무도 안 쓰는 공개 컴포넌트 찾기
```

`audit:charts` 가 따로 있는 이유: 차트의 선과 막대는 **글자가 아니라 그래픽
객체**입니다. 팔레트 검사는 글자 대비만 보고, axe-core 는 SVG 도형의 색을
아예 검사 대상으로 삼지 않습니다. 즉 이 검사가 없으면 차트 색은 **아무도 재지
않는 상태**로 남습니다. 실제로 그랬고, 재보니 문제가 있었습니다.

`audit:exports` 가 무언가를 찾아냈다면 둘 중 하나입니다: **필요 없는데
만든 것**이거나, **쓰라고 만들었는데 아무도 모르는 것**. 앞이면 지우고,
뒤면 화면 원형 중 하나가 실제로 쓰게 하세요. 공개 목록에 아무도 안 쓰는
것이 남아 있으면 다음 에이전트의 선택지만 늘어납니다.

이 저장소 자체를 고쳤다면 배포 형태도 함께 확인합니다 — 저장소 안에서는 잘
돌아가는데 설치한 쪽에서만 깨지는 사고가 실제로 있었습니다:

```bash
npm run verify:consumer   # v3·v4 양쪽으로 진짜 설치해서 빌드하고 검사
```

토큰을 고쳤다면 v4 테마도 함께 생성해야 합니다. 이 저장소의 미리보기는 v3 를
쓰기 때문에, 재생성을 잊으면 **설치한 쪽에서만** 어긋납니다:

```bash
npm run tokens:build      # 팔레트 CSS + v4 @theme 재생성
```

그리고 눈으로 확인할 것:

- [ ] 다크 모드에서 열어봤는가 (`document.documentElement.dataset.theme = 'dark'`)
- [ ] 데이터 0건일 때 화면이 비어 보이지 않는가
- [ ] 로딩 중 레이아웃이 흔들리지 않는가 (카드·위젯은 감추지 말고
      `loading` 을 켜세요 — 사라졌다 나타나면 아래 것들이 통째로 밀립니다)
- [ ] **390px 에서 열어봤는가** — 데스크톱만 보면 반드시 놓칩니다.
      제목과 액션이 겹쳐 제목이 잘리거나, 단계 이름이 "1 파... 2 열..." 로
      뭉개지는 식으로 깨집니다(둘 다 실제로 겪었습니다)
- [ ] 1024px 미만에서 사이드바가 오버레이로 바뀌는가
- [ ] 키보드 Tab 만으로 모든 조작이 가능한가
- [ ] 가로 스크롤이 생기지 않는가 (`scrollWidth > innerWidth`)
- [ ] **글자가 잘린 곳이 없는가** — 축 라벨, 배지, 사이드바 항목.
      특히 SVG 는 넘친 글자를 조용히 지웁니다
- [ ] 같은 숫자가 화면 안에서 두 값으로 보이지 않는가
      (요약과 목록, 배너와 표 — 손으로 적은 값이 계산값과 어긋나기 쉽습니다)
- [ ] 되돌릴 수 없는 작업에 **무슨 일이 일어나는지** 적혀 있는가

> 이 목록의 항목은 대부분 **실제로 이 저장소에서 일어났던 일**입니다.
> 코드를 읽어서 찾은 것이 아니라 화면을 띄워서 찾았습니다. 만든 화면은
> 반드시 브라우저에서 열어보세요.

---

## 13. 브랜드 색상 교체

색 팔레트는 **`tokens/palettes.json` 한 파일**로 관리됩니다.

```bash
# 1) tokens/palettes.json 에서 팔레트를 고치거나 새로 추가
# 2) CSS 재생성 + 대비 검사
npm run tokens:build
```

생성기가 라이트 1블록과 다크 2블록(미디어쿼리용·명시선택용)을 같은 데이터에서
뽑아내므로 한쪽만 고치는 실수가 생기지 않습니다. 또한 **WCAG 대비 검사**를
수행해 본문·보조 텍스트·버튼 글자가 기준에 못 미치면 생성이 실패합니다.

현재 팔레트:

| id | 이름 | 성격 |
|---|---|---|
| `hct` | HCT | 로고색 강조 · 짙은 남색 사이드바 (**기본값**) |
| `navy` | 네이비 | 짙은 남색 사이드바 · 흰 콘텐츠 |
| `arctic` | 아크틱 | 전체 화이트 · 파랑 강조 |
| `graphite` | 그래파이트 | 무채색 강조 · 따뜻한 중성색 |
| `plum` | 플럼 | 어두운 자두색 사이드바 |
| `indigo` | 인디고 | 채도 낮춘 남보라 · 중립 회색 |

기본값을 바꾸려면 `src/lib/theme.js` 의 `DEFAULT_PALETTE` 를 수정하세요.
**팔레트 목록을 바꿨다면 같은 파일의 `PALETTE_VERSION` 도 올리세요.** 안 그러면
사용자 브라우저에 저장된 예전 선택이 남아 바뀐 기본값이 보이지 않습니다.

### 팔레트를 새로 만들 때

- **상태 색은 건드리지 마세요.** 성공·주의·위험·정보·검토는 팔레트와 무관하게
  고정입니다. 의미를 나르는 색이 제품마다 달라지면 학습이 무너집니다.
- **강조색이 상태 색과 같은 색상환에 있지 않은지 확인하세요.** 강조 파랑과
  '진행중' 파랑이 겹치면 사용자가 색으로 상태를 읽지 못합니다.
- **중성색에 미세한 색 기울기를 주세요.** 순수 회색은 고른 티가 나지 않습니다.
- 다크 모드에서 주 버튼은 **밝아야** 합니다. 어두운 배경 위 어두운 버튼에
  어두운 글자를 얹으면 대비 검사에서 걸립니다.
