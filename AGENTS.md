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
| `<table>` 직접 작성 | `<DataTable />` |
| `<button className="...">` | `<Button variant="..." />` |
| `p-[13px]`, `h-7` | 4px 배수 스케일 (`p-3`, `h-6`) |
| 로딩 스피너 하나 | `<SkeletonTable />` |
| 빈 배열이면 아무것도 안 그림 | `<EmptyState />` / `<NoResults />` |

---

## 1. 시작하기

```jsx
// 모든 import 는 배럴 파일에서
import {
  AppShell, PageContainer, PageHeader,
  Sidebar, SidebarGroup, SidebarItem,
  Topbar, Breadcrumb,
  DataTable, TableCard, StatCard, StatGrid,
  StatusBadge, Button, EmptyState,
} from '@/components'
```

스타일시트는 앱 진입점에서 한 번만 불러옵니다:

```js
import './styles/index.css'   // tokens.css 를 포함합니다
```

**새 화면을 만들 때는 `src/pages/DashboardPage.jsx` 또는 `src/pages/ListPage.jsx` 를
복사해서 시작하세요.** 백지에서 시작하지 마세요. 이 두 파일이 구조의 기준입니다.

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

## 4. 레이아웃 — 모든 화면은 앱 셸 안에

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

---

## 6. 데이터 표시

### 테이블

`<table>` 을 직접 만들지 마세요. `DataTable` 이 로딩·에러·빈 결과를 모두 처리합니다.

```jsx
<TableCard>
  <TableToolbar left={…} right={…} />
  <DataTable
    columns={[
      { key: 'id', header: 'ID', width: '104px' },
      { key: 'name', header: '이름', sortable: true },
      { key: 'status', header: '상태', render: (r) => <StatusBadge status={r.status} dot size="sm" /> },
      { key: 'count', header: '건수', align: 'right' },   // 숫자는 우측 정렬 + 자릿수 고정
    ]}
    rows={rows}
    loading={isLoading}
    error={error?.message}
    onRetry={refetch}
    searchQuery={query}
    onClearFilters={clearFilters}
    onRowClick={setSelected}
    selectedKey={selected?.id}
  />
  <TablePagination page={page} pageSize={20} total={total} onPageChange={setPage} />
</TableCard>
```

- 숫자 열은 `align: 'right'` — 자릿수가 자동 정렬됩니다.
- 열이 6개를 넘으면 우선순위 낮은 열은 숨기고 상세 패널로 보내세요.

### KPI 카드

한 줄에 **3~4개가 상한**입니다. 6개를 넘기면 아무것도 눈에 들어오지 않습니다.

증감의 좋고 나쁨은 지표마다 다릅니다. 오류율·응답시간처럼 **낮을수록 좋은 지표에는
`invertDelta` 를 넘기세요.** 안 그러면 오류율 상승이 초록색으로 표시됩니다.

```jsx
<StatCard label="오류율" value="0.42" unit="%" delta={1.8} invertDelta />
```

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
npm run lint:design    # 디자인 규칙 (반드시 통과)
```

그리고 눈으로 확인할 것:

- [ ] 다크 모드에서 열어봤는가 (`document.documentElement.dataset.theme = 'dark'`)
- [ ] 데이터 0건일 때 화면이 비어 보이지 않는가
- [ ] 로딩 중 레이아웃이 흔들리지 않는가
- [ ] 1024px 미만에서 사이드바가 오버레이로 바뀌는가
- [ ] 키보드 Tab 만으로 모든 조작이 가능한가

---

## 13. 브랜드 색상 교체

HCT 브랜드 색상이 확정되면 **두 곳만** 고치면 전체가 바뀝니다:

1. `tokens/tokens.json` 의 `brand.accent` (50~900)
2. `src/styles/tokens.css` 의 `--hct-accent-*` (50~900)

시맨틱 레이어(`--color-*`)는 건드리지 마세요. 그 위에서 자동으로 재계산됩니다.
