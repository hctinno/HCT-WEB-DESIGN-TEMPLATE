import { useMemo, useState } from 'react'
import {
  PageContainer, PageHeader,
  Button, Banner, StatusBadge, SegmentedControl, SecretField, TextField,
  Modal, ConfirmDialog, EmptyState, Switch,
  formatRelative, useToast,
} from '../components'
import { AppFrame } from './_shell'
import { NavIcons } from './_icons'

/**
 * 화면 원형 14: 연동 · API 키 · 웹훅
 *
 * 셋 다 "바깥과 연결되는 지점" 이라 한 화면에 둡니다. 흩어놓으면
 * "이 시스템에 접근할 수 있는 것이 무엇인가" 라는 질문에 답할 곳이
 * 없어집니다. 그 질문은 보안 사고가 났을 때 가장 먼저 나옵니다.
 *
 * 세 탭에 공통으로 적용한 규칙:
 *
 *   - **마지막 사용 시각을 보여줍니다.** 안 쓰는 키와 죽은 웹훅은
 *     공격 표면이자 오해의 원인입니다. 목록만 보여주면 아무도 지우지
 *     않습니다.
 *   - **끊을 때 무엇이 멈추는지 말합니다.** "연결 해제하시겠습니까?"
 *     만으로는 판단할 수 없습니다.
 *   - **비밀 값은 한 번만 보여줍니다.** 다시 볼 수 있는 키는 유출되면
 *     추적이 불가능합니다.
 */

const H = 3600 * 1000
const now = Date.now()
const ago = (ms) => new Date(now - ms).toISOString()

const INTEGRATIONS = [
  {
    id: 'slack', name: 'Slack', connectedAs: 'HCT 운영 워크스페이스',
    connected: true, at: ago(700 * H), lastSync: ago(0.2 * H),
    does: '차단된 요청과 승인 대기를 #운영-알림 채널에 보냅니다.',
    breaks: '슬랙 알림이 멈춥니다. 앱 인박스에는 계속 쌓입니다.',
  },
  {
    id: 'jira', name: 'Jira', connectedAs: 'HCT-OPS 프로젝트',
    connected: true, at: ago(1400 * H), lastSync: ago(3 * H), warn: true,
    does: '요청을 지라 이슈와 양방향으로 동기화합니다.',
    breaks: '지라 이슈와의 연결이 끊기고, 이미 연결된 32건은 각자 따로 움직입니다.',
    note: '3시간째 동기화되지 않았습니다. 지라 API 토큰이 만료되었을 수 있습니다.',
  },
  {
    id: 'drive', name: 'Google Drive', connected: false,
    does: '첨부 파일을 드라이브 폴더에 보관합니다.',
  },
  {
    id: 'pagerduty', name: 'PagerDuty', connected: false,
    does: '긴급 요청이 생기면 온콜 담당자를 호출합니다.',
  },
]

const KEYS = [
  { id: 'k1', name: '정산 연동', prefix: 'hct_live_9f2c', scopes: ['요청 읽기', '요청 쓰기'],
    createdBy: '한지우', at: ago(2000 * H), lastUsed: ago(1.2 * H) },
  { id: 'k2', name: '대시보드 위젯', prefix: 'hct_live_3ab7', scopes: ['요청 읽기'],
    createdBy: '이서연', at: ago(900 * H), lastUsed: ago(26 * H) },
  { id: 'k3', name: '구 리포트 스크립트', prefix: 'hct_live_c410', scopes: ['요청 읽기', '사용자 읽기'],
    createdBy: '김민수', at: ago(6000 * H), lastUsed: ago(3400 * H) },
]

const HOOKS = [
  { id: 'w1', url: 'https://ops.hct.co.kr/hooks/request-changed', events: ['요청 생성', '상태 변경'],
    enabled: true, lastAt: ago(0.1 * H), lastCode: 200, fails: 0 },
  { id: 'w2', url: 'https://legacy.hct.co.kr/notify', events: ['요청 생성'],
    enabled: true, lastAt: ago(4 * H), lastCode: 500, fails: 47 },
  { id: 'w3', url: 'https://hooks.example.com/hct-staging', events: ['상태 변경', '댓글'],
    enabled: false, lastAt: ago(800 * H), lastCode: 200, fails: 0 },
]

/** 90일 넘게 안 쓴 키는 지울 후보입니다 */
const STALE_DAYS = 90

export function IntegrationsPage({ onNavigate }) {
  const [tab, setTab] = useState('apps')

  return (
    <AppFrame
      active="integrations"
      onNavigate={onNavigate}
      counts={{ list: 18, inbox: true, archive: 12 }}
      mentions={{ inbox: 3 }}
    >
      <PageContainer>
        <PageHeader
          title="연동과 API"
          description="이 워크스페이스에 접근할 수 있는 바깥의 것들입니다."
        />

        <SegmentedControl
          className="mb-3"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'apps', label: '연동', count: INTEGRATIONS.filter((i) => i.connected).length },
            { value: 'keys', label: 'API 키', count: KEYS.length },
            { value: 'hooks', label: '웹훅', count: HOOKS.length },
          ]}
        />

        {tab === 'apps' && <AppsTab />}
        {tab === 'keys' && <KeysTab />}
        {tab === 'hooks' && <HooksTab />}
      </PageContainer>
    </AppFrame>
  )
}

/* ── 연동 ──────────────────────────────────────────────────────── */
function AppsTab() {
  const { toast } = useToast()
  const [apps, setApps] = useState(INTEGRATIONS)
  const [disconnecting, setDisconnecting] = useState(null)

  const broken = apps.filter((a) => a.connected && a.warn)

  const disconnect = (app) => {
    setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, connected: false, warn: false } : a)))
    setDisconnecting(null)
    toast({ tone: 'neutral', message: `${app.name} 연결을 끊었습니다` })
  }

  return (
    <>
      {broken.length > 0 && (
        <Banner tone="warning" title={`${broken.length}개 연동에 문제가 있습니다`} className="mb-3">
          연동이 조용히 멈추면 사람들은 데이터가 최신이라고 믿은 채로 판단합니다.
        </Banner>
      )}

      <ul className="grid gap-2 md:grid-cols-2">
        {apps.map((app) => (
          <li key={app.id} className={
            'rounded-lg border bg-bg-surface p-3 ' +
            (app.warn ? 'border-warning-border' : 'border-line-subtle')
          }>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-base font-semibold text-fg-primary">{app.name}</span>
                  {app.connected
                    ? <StatusBadge tone={app.warn ? 'warning' : 'success'} size="sm" dot>
                        {app.warn ? '동기화 지연' : '연결됨'}
                      </StatusBadge>
                    : <StatusBadge tone="neutral" size="sm">연결 안 됨</StatusBadge>}
                </div>
                <p className="mt-1 text-sm text-fg-tertiary">{app.does}</p>

                {app.connected && (
                  <p className="mt-1.5 text-sm text-fg-tertiary">
                    {app.connectedAs}
                    <span className="mx-1 text-fg-disabled">·</span>
                    <span className="tabular">마지막 동기화 {formatRelative(app.lastSync)}</span>
                  </p>
                )}
                {app.note && <p className="mt-1.5 text-sm text-warning-text">{app.note}</p>}
              </div>

              <div className="shrink-0">
                {app.connected
                  ? <Button size="sm" variant="secondary" onClick={() => setDisconnecting(app)}>연결 끊기</Button>
                  : <Button size="sm" variant="primary">연결하기</Button>}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* 끊었을 때 무엇이 멈추는지 말해야 판단할 수 있습니다 */}
      <ConfirmDialog
        open={Boolean(disconnecting)}
        onClose={() => setDisconnecting(null)}
        onConfirm={() => disconnect(disconnecting)}
        tone="danger"
        title={`${disconnecting?.name} 연결을 끊을까요?`}
        confirmLabel="연결 끊기"
      >
        {disconnecting?.breaks}
      </ConfirmDialog>
    </>
  )
}

/* ── API 키 ────────────────────────────────────────────────────── */
function KeysTab() {
  const { toast } = useToast()
  const [keys, setKeys] = useState(KEYS)
  const [creating, setCreating] = useState(false)
  const [issued, setIssued] = useState(null)
  const [revoking, setRevoking] = useState(null)

  const stale = useMemo(
    () => keys.filter((k) => now - new Date(k.lastUsed).getTime() > STALE_DAYS * 24 * H),
    [keys],
  )

  const create = (name) => {
    const key = {
      id: `k${Date.now()}`, name, prefix: 'hct_live_' + Math.random().toString(16).slice(2, 6),
      scopes: ['요청 읽기'], createdBy: '김민수',
      at: new Date().toISOString(), lastUsed: null,
    }
    setKeys((prev) => [key, ...prev])
    setCreating(false)
    /* 전체 값은 지금 딱 한 번만 보여줍니다 */
    setIssued({ ...key, secret: `${key.prefix}_${Math.random().toString(36).slice(2, 18)}` })
  }

  const revoke = (key) => {
    setKeys((prev) => prev.filter((k) => k.id !== key.id))
    setRevoking(null)
    /* 폐기에는 실행 취소를 두지 않습니다 — 되돌려도 그 키는 이미 노출된 것으로 봐야 합니다 */
    toast({ tone: 'success', message: `${key.name} 키를 폐기했습니다` })
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-fg-tertiary">
          키는 만들 때 한 번만 전체 값을 보여줍니다. 잃어버리면 새로 만들어야 합니다.
        </p>
        <Button variant="primary" iconLeft={<NavIcons.Plus />} onClick={() => setCreating(true)}>
          키 만들기
        </Button>
      </div>

      {stale.length > 0 && (
        <Banner tone="warning" title={`${STALE_DAYS}일 넘게 쓰이지 않은 키 ${stale.length}개`} className="mb-3">
          쓰지 않는 키는 지우세요. 남아 있는 이유를 아무도 기억하지 못하는 키가 사고의 시작입니다.
        </Banner>
      )}

      <ul className="overflow-hidden rounded-lg border border-line-subtle bg-bg-surface">
        {keys.map((key) => {
          const old = key.lastUsed && now - new Date(key.lastUsed).getTime() > STALE_DAYS * 24 * H
          return (
            <li key={key.id} className="flex flex-wrap items-start gap-3 border-b border-line-subtle px-3 py-2.5 last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-base font-medium text-fg-primary">{key.name}</span>
                  {old && <StatusBadge tone="warning" size="sm">오래 안 씀</StatusBadge>}
                </div>
                <p className="mt-0.5 font-mono text-xs text-fg-tertiary">
                  <span className="break-token">{key.prefix}</span>••••••••••••
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-fg-tertiary">
                  <span>{key.scopes.join(' · ')}</span>
                  <span className="text-fg-disabled">|</span>
                  <span>{key.createdBy} 님이 <span className="tabular">{formatRelative(key.at)}</span> 생성</span>
                  <span className="text-fg-disabled">|</span>
                  {/* 마지막 사용이 없는 키는 잘못 만든 키일 가능성이 높습니다 */}
                  <span className={'tabular ' + (key.lastUsed ? '' : 'text-warning-text')}>
                    {key.lastUsed ? `마지막 사용 ${formatRelative(key.lastUsed)}` : '아직 쓰인 적 없음'}
                  </span>
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setRevoking(key)}>폐기</Button>
            </li>
          )
        })}
      </ul>

      <CreateKeyDialog open={creating} onClose={() => setCreating(false)} onCreate={create} />
      <IssuedKeyDialog issued={issued} onClose={() => setIssued(null)} />

      <ConfirmDialog
        open={Boolean(revoking)}
        onClose={() => setRevoking(null)}
        onConfirm={() => revoke(revoking)}
        tone="danger"
        title={`${revoking?.name} 키를 폐기할까요?`}
        confirmLabel="폐기"
      >
        이 키를 쓰는 프로그램은 즉시 401 을 받습니다. 되돌릴 수 없습니다.
      </ConfirmDialog>
    </>
  )
}

function CreateKeyDialog({ open, onClose, onCreate }) {
  const [name, setName] = useState('')
  return (
    <Modal
      open={open}
      onClose={() => { setName(''); onClose() }}
      title="API 키 만들기"
      footer={
        <>
          <Button variant="secondary" onClick={() => { setName(''); onClose() }}>취소</Button>
          <Button variant="primary" disabled={!name.trim()} onClick={() => { onCreate(name.trim()); setName('') }}>
            만들기
          </Button>
        </>
      }
    >
      <TextField
        label="이름"
        placeholder="예: 정산 연동"
        value={name}
        onChange={(e) => setName(e.target.value)}
        /* 이름이 없으면 6개월 뒤에 이 키가 무엇인지 아무도 모릅니다 */
        hint="어디에 쓰는 키인지 적어두세요. 나중에 폐기해도 되는지 판단하는 유일한 단서입니다."
      />
    </Modal>
  )
}

/**
 * 발급 직후 화면.
 *
 * 한 번만 보여준다는 사실을 **값보다 먼저** 말합니다. 값을 먼저 보여주면
 * 사람들은 창을 닫고 나서 읽습니다.
 */
function IssuedKeyDialog({ issued, onClose }) {
  return (
    <Modal
      open={Boolean(issued)}
      onClose={onClose}
      title="키가 만들어졌습니다"
      footer={<Button variant="primary" onClick={onClose}>복사했습니다</Button>}
    >
      <Banner tone="warning" title="이 값은 지금만 볼 수 있습니다" className="mb-3">
        창을 닫으면 다시 볼 수 없습니다. 지금 안전한 곳에 옮겨두세요.
      </Banner>
      {issued && (
        <SecretField
          label={issued.name}
          value={issued.secret}
          revealedOnce
          hint="비밀번호 관리자나 배포 환경 변수에 넣으세요. 코드에 직접 쓰지 마세요."
        />
      )}
    </Modal>
  )
}

/* ── 웹훅 ──────────────────────────────────────────────────────── */
function HooksTab() {
  const { toast } = useToast()
  const [hooks, setHooks] = useState(HOOKS)
  const failing = hooks.filter((h) => h.enabled && h.lastCode >= 400)

  const toggle = (hook, enabled) => {
    setHooks((prev) => prev.map((h) => (h.id === hook.id ? { ...h, enabled } : h)))
    toast({ tone: 'success', message: enabled ? '웹훅을 켰습니다' : '웹훅을 껐습니다' })
  }

  if (hooks.length === 0) {
    return (
      <EmptyState
        title="등록된 웹훅이 없습니다"
        description="요청이 바뀔 때마다 지정한 주소로 알려줍니다."
        action={<Button variant="primary">웹훅 추가</Button>}
      />
    )
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-fg-tertiary">
          이벤트가 생기면 지정한 주소로 POST 를 보냅니다. 실패하면 5분 간격으로 3회 재시도합니다.
        </p>
        <Button variant="primary" iconLeft={<NavIcons.Plus />}>웹훅 추가</Button>
      </div>

      {failing.length > 0 && (
        <Banner tone="danger" title={`${failing.length}개 웹훅이 계속 실패하고 있습니다`} className="mb-3">
          받는 쪽이 응답하지 않으면 이벤트는 재시도 후 버려집니다. 이미 놓친 것은 다시 오지 않습니다.
        </Banner>
      )}

      <ul className="overflow-hidden rounded-lg border border-line-subtle bg-bg-surface">
        {hooks.map((hook) => {
          const bad = hook.enabled && hook.lastCode >= 400
          return (
            <li key={hook.id} className="flex flex-wrap items-start gap-3 border-b border-line-subtle px-3 py-2.5 last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <code className="break-token font-mono text-sm text-fg-primary">{hook.url}</code>
                  <StatusBadge tone={bad ? 'danger' : hook.enabled ? 'success' : 'neutral'} size="sm" dot>
                    {bad ? `HTTP ${hook.lastCode}` : hook.enabled ? '정상' : '꺼짐'}
                  </StatusBadge>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-fg-tertiary">
                  <span>{hook.events.join(' · ')}</span>
                  <span className="text-fg-disabled">|</span>
                  <span className="tabular">마지막 전송 {formatRelative(hook.lastAt)}</span>
                  {hook.fails > 0 && (
                    <>
                      <span className="text-fg-disabled">|</span>
                      <span className="tabular text-danger-text">연속 실패 {hook.fails}회</span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Switch checked={hook.enabled} onChange={(v) => toggle(hook, v)} hideLabel label={`${hook.url} 사용`} />
                <Button size="sm" variant="secondary">전송 기록</Button>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
