# CLAUDE.md

이 저장소의 작업 규칙은 [AGENTS.md](./AGENTS.md) 에 있습니다.

**화면·컴포넌트를 만들기 전에 반드시 AGENTS.md 를 먼저 읽으세요.**
거기에 적힌 규칙은 권고가 아니라 `npm run lint:design` 으로 강제됩니다.

요약:

- Tailwind 기본 색상 팔레트는 제거되어 있습니다. `bg-gray-100` 같은 클래스는 동작하지 않습니다.
- 시맨틱 토큰만 사용합니다: `bg-bg-surface`, `text-fg-primary`, `border-line-subtle` 등.
- `dark:` 변형을 직접 쓰지 마세요. 토큰이 라이트/다크를 모두 처리합니다.
- 새 화면은 `src/pages/DashboardPage.jsx` 또는 `ListPage.jsx` 를 복사해서 시작합니다.
- 로딩·빈 상태·에러 상태를 항상 함께 구현합니다.
