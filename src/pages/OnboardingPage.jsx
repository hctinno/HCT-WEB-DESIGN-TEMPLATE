import { useState } from 'react'
import {
  PageContainer, Button, StatusBadge, Progress, Banner,
} from '../components'
import { AppFrame } from './_shell'
import { NavIcons } from './_icons'

/**
 * 화면 원형 15: 빈 워크스페이스 (온보딩)
 *
 * 아무 데이터도 없는 첫 화면입니다. 대부분의 제품이 여기서 실패합니다 —
 * 잘 만든 대시보드를 만들어놓고, 사람들이 실제로 처음 보는 화면은
 * **텅 빈 표** 로 두기 때문입니다.
 *
 * 여기서 지킨 것:
 *
 *   1. **왜 비어 있는지 말합니다.** 사용자는 자기가 뭘 잘못했는지부터
 *      의심합니다. "아직 아무것도 없습니다" 는 안심시키는 문장입니다.
 *   2. **다음에 할 일은 하나씩**입니다. 설정 화면 전체를 던지면 아무도
 *      끝내지 못합니다. 순서가 있고, 각 단계에 진짜 버튼이 있습니다.
 *   3. **건너뛸 수 있습니다.** 온보딩을 강제하면 사람들은 아무 값이나
 *      넣고 지나갑니다. 그 값은 영원히 남습니다.
 *   4. **예시 데이터로 먼저 둘러볼 수 있습니다.** 빈 제품은 평가할 수
 *      없습니다. 다만 나중에 지울 수 있어야 합니다.
 */

const STEPS = [
  {
    id: 'import',
    title: '요청 데이터 가져오기',
    body: '쓰던 스프레드시트나 다른 도구의 CSV 를 그대로 올리면 됩니다. 올리기 전에 모든 행을 검사하니 잘못 들어갈 걱정은 없습니다.',
    action: '가져오기 시작',
    to: 'import',
    icon: NavIcons.Upload,
  },
  {
    id: 'invite',
    title: '같이 쓸 사람 초대하기',
    body: '혼자 쓰는 관리도구는 메모장과 다르지 않습니다. 담당자를 지정하고 승인을 받으려면 최소 두 명이 필요합니다.',
    action: '사용자 초대',
    to: 'users',
    icon: NavIcons.Users,
  },
  {
    id: 'view',
    title: '내 뷰 만들기',
    body: '매번 필터를 다시 거는 대신, 자주 보는 조건을 저장해 두세요. 저장한 뷰는 왼쪽 사이드바에 남습니다.',
    action: '요청 목록 열기',
    to: 'list',
    icon: NavIcons.Filter,
  },
  {
    id: 'alert',
    title: '알림 받을 조건 정하기',
    body: '지표가 임계값을 넘거나 나를 담당자로 지정했을 때 어떻게 알릴지 정합니다. 기본값으로 두어도 됩니다.',
    action: '알림 설정',
    to: 'account',
    icon: NavIcons.Alert,
  },
]

export function OnboardingPage({ onNavigate }) {
  const [done, setDone] = useState(() => new Set())
  const [dismissed, setDismissed] = useState(false)

  const complete = (id) => setDone((prev) => new Set(prev).add(id))
  const next = STEPS.find((s) => !done.has(s.id))

  return (
    <AppFrame
      active="dashboard"
      onNavigate={onNavigate}
      breadcrumb={[{ label: 'HCT 운영', href: '#' }, { label: '시작하기' }]}
    >
      <PageContainer>
        <div className="mx-auto max-w-[720px] py-6">
          <h1 className="text-xl font-semibold text-fg-primary">HCT 운영 콘솔에 오신 것을 환영합니다</h1>
          {/* 비어 있는 이유부터 — 사용자는 자기 잘못부터 의심합니다 */}
          <p className="mt-1.5 text-base leading-6 text-fg-tertiary">
            이 워크스페이스에는 아직 아무 데이터도 없습니다. 정상입니다.
            아래 네 가지를 하면 대시보드와 목록이 채워집니다. 지금 다 하지 않아도 됩니다.
          </p>

          <div className="mt-4">
            <Progress
              value={done.size}
              max={STEPS.length}
              /* Progress 가 오른쪽에 값/최댓값을 이미 찍습니다 —
                 라벨에도 같은 숫자를 넣으면 "0 / 4  0 / 4" 가 됩니다 */
              label="설정 진행"
              tone={done.size === STEPS.length ? 'success' : 'accent'}
            />
          </div>

          {done.size === STEPS.length && (
            <Banner tone="success" title="준비가 끝났습니다" className="mt-4">
              이제 대시보드에서 전체 상황을 볼 수 있습니다. 이 안내는 사이드바 아래에서 다시 열 수 있습니다.
            </Banner>
          )}

          <ol className="mt-4 space-y-2">
            {STEPS.map((step, i) => (
              <StepCard
                key={step.id}
                step={step}
                index={i + 1}
                done={done.has(step.id)}
                /* 다음에 할 일 하나만 강조합니다 — 전부 강조하면 아무것도 강조되지 않습니다 */
                active={next?.id === step.id}
                onGo={() => { complete(step.id); onNavigate?.(step.to) }}
                onSkip={() => complete(step.id)}
              />
            ))}
          </ol>

          {!dismissed && (
            <div className="mt-5 rounded-lg border border-line-subtle bg-bg-sunken p-3">
              <p className="text-base font-medium text-fg-primary">먼저 둘러보고 싶다면</p>
              <p className="mt-0.5 text-sm text-fg-tertiary">
                예시 요청 20건을 넣어 모든 화면이 어떻게 보이는지 확인할 수 있습니다.
                예시 데이터는 나중에 한 번에 지울 수 있습니다.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => onNavigate?.('dashboard')}>
                  예시 데이터로 둘러보기
                </Button>
                <Button variant="ghost" onClick={() => setDismissed(true)}>필요 없습니다</Button>
              </div>
            </div>
          )}

          <p className="mt-5 text-sm text-fg-tertiary">
            막히면 <a href="#" className="font-medium text-accent-text underline underline-offset-2">운영팀에 문의</a>
            하거나, 워크스페이스 관리자인 한지우 님에게 물어보세요.
          </p>
        </div>
      </PageContainer>
    </AppFrame>
  )
}

function StepCard({ step, index, done, active, onGo, onSkip }) {
  return (
    <li className={
      'rounded-lg border p-3 ' +
      (done ? 'border-line-subtle bg-bg-sunken'
        : active ? 'border-accent-border bg-bg-surface'
          : 'border-line-subtle bg-bg-surface')
    }>
      <div className="flex items-start gap-3">
        <span className={
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ' +
          (done ? 'bg-success-solid text-fg-inverse'
            : active ? 'bg-accent-solid text-fg-inverse'
              : 'border border-line-default text-fg-tertiary')
        }>
          {done ? '✓' : index}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <step.icon />
            <span className={
              'text-base font-semibold ' + (done ? 'text-fg-tertiary' : 'text-fg-primary')
            }>
              {step.title}
            </span>
            {done && <StatusBadge tone="success" size="sm">완료</StatusBadge>}
          </div>

          {!done && (
            <>
              <p className="mt-1 text-sm leading-5 text-fg-tertiary">{step.body}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button size="sm" variant={active ? 'primary' : 'secondary'} onClick={onGo}>
                  {step.action}
                </Button>
                {/* 건너뛰기가 없으면 사람들은 아무 값이나 넣고 지나갑니다 */}
                <Button size="sm" variant="ghost" onClick={onSkip}>나중에</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </li>
  )
}
