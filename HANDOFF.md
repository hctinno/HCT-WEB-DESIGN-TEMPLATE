# 인수인계

이 저장소를 처음 맡는 사람(또는 에이전트)이 **먼저 읽는 문서**입니다.
30초 안에 "지금 어떤 상태이고 무엇을 조심해야 하는지"를 전달하는 것이 목적입니다.

작업 규칙은 [AGENTS.md](./AGENTS.md), 사람용 개요는 [README.md](./README.md),
무엇이 깨지는지는 [CHANGELOG.md](./CHANGELOG.md) 에 있습니다.

---

## 30초 요약

| | |
|---|---|
| 저장소 | `hctinno/HCT-WEB-DESIGN-TEMPLATE` (public) |
| 기본 브랜치 | `main` |
| 현재 판 | **v1.4.0** — `release/v1.4.0` |
| 설치 | `npm i github:hctinno/HCT-WEB-DESIGN-TEMPLATE#release/v1.4.0` |
| CI | PR 과 `main` 푸시 양쪽에서 동작 (verify · a11y · consume) |

---

## 이 저장소의 내력

원래 다른 계정(`dytc880915-commits`)에 있었습니다. 그 계정이 삭제되면서
**git 번들로 복구해 `hctinno` 로 옮겼습니다.** 커밋 34개와 태그 `v1.0.0` 은
모두 살아남았지만, 아래가 유실된 채로 넘어왔습니다.

| 유실된 것 | 지금 |
|---|---|
| `main` 브랜치 (기본 브랜치가 작업 브랜치였음) | 복구됨 |
| `release/*` 브랜치 전부 | `release/v1.4.0` 부터 다시 시작 |
| GitHub Actions 활성화 상태 | 다시 켬 |
| PR·릴리스 이력 | 0에서 다시 시작 |

**`release/v1.0.1` ~ `release/v1.3.2` 는 복구하지 않았습니다.** 해당 커밋은
이력에 살아 있으므로 필요하면 그 SHA 로 설치할 수 있습니다
(`CHANGELOG.md` 의 각 판 항목 참고). 실무상 v1.4.0 이 이전 판을 모두
포함하므로 과거 판을 되살릴 이유는 거의 없습니다.

---

## 배포는 태그가 아니라 `release/` 브랜치입니다

이 저장소는 에이전트가 원격 실행 환경에서 관리합니다. 그 환경은 브랜치
푸시는 허용하지만 **태그 푸시를 막습니다**(HTTP 403). 태그로 배포를 묶으면
코드가 준비되고도 사람이 웹 UI 로 릴리스를 만들기 전까지 아무도 설치할 수
없습니다. 실제로 v1.0.1 · v1.0.2 가 그렇게 묻혔습니다.

`release/vX.Y.Z` 브랜치는 **한 번 만들고 다시 밀지 않습니다.** 고칠 것이
생기면 다음 판을 냅니다. 이미 배포한 판을 조용히 바꾸면 소비 프로젝트는
"설치를 안 바꿨는데 화면이 달라지는" 일을 겪습니다.

새 판을 내는 절차는 README 「새 버전을 내보낼 때」에 있습니다.

---

## 먼저 알아야 할 함정

전부 **빌드는 통과하고 화면만 조용히 틀리는** 종류입니다.

### 원형을 복사하면 import 경로를 고쳐야 합니다

`src/pages/*.jsx` 는 저장소 안의 상대 경로(`../components`)로 import 합니다.
설치한 쪽으로 복사하면 그대로는 모듈을 찾지 못하므로
`hct-web-design-template` 로 바꿔야 합니다.

### `AppFrame` 은 메뉴를 바꿀 수 없습니다

`hct-web-design-template/pages` 의 `AppFrame` 은 `NAV` · `WORKSPACES` ·
`CURRENT_USER` 를 **모듈 상수로 들고 있고 prop 을 받지 않습니다.** 이
저장소의 미리보기 전용입니다. 다른 제품에서 자기 메뉴를 쓰려면 `AppShell` ·
`Sidebar` · `SidebarGroup` · `SidebarItem` · `WorkspaceRail` · `SidebarUser` ·
`Topbar` · `Breadcrumb` 으로 직접 조립하세요. 전부 컴포넌트 배럴에 있습니다.

### prop 이름을 추측하지 마세요

`DataGrid` 의 행 prop 은 `records` 입니다. `rows` 로 넘기면 빌드도 통과하고
콘솔 오류도 없이 "결과가 없습니다"만 뜹니다. `lint:design` 도 이건 잡지
못합니다. 확신이 없으면 원형의 실제 사용례를 열어 확인하세요.

### `package-lock.json` 은 커밋하지 않습니다

`.gitignore` 에 있습니다. CI 도 `npm install` 을 씁니다. `npm ci` 는 lock
파일이 없어 실패합니다.

---

## 알려진 빚

고쳐야 할 것은 아니지만, 다음 사람이 모르면 시간을 쓰게 되는 것들입니다.

- **로고 원본이 264×86 래스터입니다.** 화면(24~40px)에는 충분하지만 인쇄나
  대형 확대에는 부족합니다. SVG 가 확보되면 `src/components/shell/Logo.jsx`
  와 `src/assets/brand/` 만 고치면 됩니다.
- **`LogoMark` 가 화면 어디에서도 쓰이지 않습니다.** 좁은 자리(워크스페이스
  레일, 접힌 사이드바)용으로 만들었고 v1.4.0 에서 라이트/다크 대비까지
  고쳤지만, 정작 원형들이 쓰지 않습니다. 쓰게 하거나 지우거나 둘 중
  하나가 필요합니다.
- **커밋 author 에 이전 관리자의 개인 이메일이 남아 있습니다**(초기 30커밋).
  저장소가 public 이므로 그대로 노출됩니다. 지우려면 이력 재작성이
  필요하고, 그러면 기존 SHA 가 전부 바뀝니다 — 배포가 SHA·브랜치에
  묶여 있으므로 권하지 않습니다.
- **`tokens/brand.json` 의 `_출처` 가 `hctinno/hct-report-template` 를
  가리킵니다.** 그 저장소도 함께 이관됐는지 확인하지 않았습니다.

---

## 확인 방법

무언가 바꿨다면 아래를 통과시키세요. CI 가 같은 것을 봅니다.

```bash
npm install            # npm ci 아님 (lock 파일 없음)
npm test               # 로직 단위 테스트
npm run lint:design    # 디자인 규칙 — 실패하면 머지 불가
npm run audit:charts   # 차트 색 대비
npm run audit:docs     # 문서가 가리키는 이름이 실재하는지
npm run audit:exports  # 아무도 안 쓰는 공개 컴포넌트
npm run tokens:build   # 토큰을 고쳤다면 생성물 재생성 후 커밋
npm run build:lib && npm run build
npm run audit:a11y     # 전 화면 × 2폭 × 2테마 (WCAG 2.1 A/AA)
npm run verify:consumer  # v3·v4 로 진짜 설치해서 빌드
```

눈으로 볼 항목은 AGENTS.md 「12. 제출 전 확인」 체크리스트를 따르세요.

---

## 다음에 할 만한 것

우선순위 순입니다. 전부 선택 사항입니다.

1. **`LogoMark` 정리** — 원형 중 하나가 실제로 쓰게 하거나 공개 목록에서 뺍니다.
2. **로고 SVG 확보** — 위 「알려진 빚」 참고.
3. **`release/v1.0.1`~`v1.3.2` 복구 여부 결정** — 과거 판에 고정된 소비
   프로젝트가 있는지 확인한 뒤 결정하면 됩니다. 없으면 복구할 이유가 없습니다.
