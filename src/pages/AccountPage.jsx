import { useMemo, useState } from 'react'
import {
  PageContainer, PageHeader,
  Form, FormSection, FormRow, FormActions, SaveBar, SettingsNav, Switch,
  TextField, Button, Banner, StatusBadge, Presence, ConfirmDialog,
  formatRelative, useToast, useForm,
} from '../components'
import { AppFrame } from './_shell'
import { NOTIFICATION_TYPES } from './_notifications'

/**
 * 화면 원형 8: 내 계정
 *
 * 환경설정(SettingsPage)과 헷갈리기 쉽습니다. 경계는 명확합니다:
 *
 *   환경설정 — **워크스페이스** 의 동작. 바꾸면 모두에게 영향.
 *   내 계정  — **나** 의 것. 바꿔도 나만 영향.
 *
 * 이 경계가 흐려지면 사용자는 자기 알림 설정을 바꾸려다 팀 전체 설정을
 * 건드립니다. 그래서 두 화면은 절대 합치지 않습니다.
 *
 * 여기서 특별히 신경 쓴 것:
 *   - **접속 중인 기기** 는 보안 화면입니다. 모르는 기기를 발견하는 것이
 *     목적이므로, 위치·마지막 접속·현재 기기 표시가 다 있어야 합니다.
 *   - **알림 설정은 인박스와 같은 타입 목록**을 씁니다(_notifications.js).
 *     설정에는 있는데 안 오는 알림이 생기지 않게 하는 장치입니다.
 */

const SECTIONS = [
  { id: 'profile', label: '프로필' },
  { id: 'password', label: '비밀번호' },
  { id: 'sessions', label: '접속 중인 기기' },
  { id: 'notifications', label: '알림' },
]

const M = 60 * 1000
const H = 60 * M
const now = Date.now()

const SESSIONS = [
  { id: 's1', current: true,  device: 'Chrome · macOS', where: '서울, 대한민국', ip: '203.0.113.42', at: new Date(now - 2 * M).toISOString() },
  { id: 's2', current: false, device: 'Safari · iPhone', where: '서울, 대한민국', ip: '203.0.113.77', at: new Date(now - 5 * H).toISOString() },
  { id: 's3', current: false, device: 'Chrome · Windows', where: '판교, 대한민국', ip: '198.51.100.9', at: new Date(now - 30 * H).toISOString() },
  { id: 's4', current: false, device: 'Firefox · Linux', where: '알 수 없음', ip: '198.51.100.211', at: new Date(now - 40 * 24 * H).toISOString() },
]

export function AccountPage({ onNavigate }) {
  const { toast } = useToast()
  const [section, setSection] = useState('profile')

  return (
    <AppFrame
      active="account"
      onNavigate={onNavigate}
      counts={{ list: 18, inbox: true, archive: 12 }}
      mentions={{ inbox: 3 }}
      breadcrumb={[{ label: 'HCT 운영', href: '#' }, { label: '내 계정' }]}
    >
      <PageContainer>
        <PageHeader
          title="내 계정"
          description="여기서 바꾸는 것은 나에게만 적용됩니다. 워크스페이스 전체 설정은 환경설정에 있습니다."
        />

        <div className="flex gap-6">
          <SettingsNav sections={SECTIONS} activeId={section} onSelect={setSection} />
          <div className="min-w-0 flex-1">
            {section === 'profile' && <ProfileSection toast={toast} />}
            {section === 'password' && <PasswordSection toast={toast} />}
            {section === 'sessions' && <SessionsSection toast={toast} />}
            {section === 'notifications' && <NotificationSection toast={toast} />}
          </div>
        </div>
      </PageContainer>
    </AppFrame>
  )
}

/* ── 프로필 ────────────────────────────────────────────────────────
   이메일은 **읽기 전용**입니다. 사내 계정은 신원 확인의 기준이라
   본인이 바꿀 수 없어야 합니다. 막아두기만 하면 사용자가 헤매므로
   왜 못 바꾸는지와 어디로 가야 하는지를 함께 적습니다. */
function ProfileSection({ toast }) {
  /* useForm 은 initialValues 가 바뀌면 폼을 갈아끼웁니다.
     인라인 객체를 넘기면 매 렌더마다 새 객체라 무한 루프가 됩니다. */
  const initialValues = useMemo(
    () => ({ name: '김민수', title: '운영팀 · 시스템 관리', phone: '010-1234-5678' }),
    [],
  )

  const form = useForm({
    initialValues,
    validate: (v) => {
      const e = {}
      if (!v.name.trim()) e.name = '이름은 비울 수 없습니다'
      return e
    },
    onSubmit: async () => {
      await new Promise((r) => setTimeout(r, 500))
      toast({ tone: 'success', message: '프로필을 저장했습니다' })
    },
  })

  return (
    <>
      <Form onSubmit={form.submit}>
        <FormSection title="프로필" description="목록과 활동 기록에 이 정보가 표시됩니다.">
          <FormRow label="이름" error={form.errors.name}>
            {({ id, invalid }) => (
              <TextField
                id={id} invalid={invalid}
                value={form.values.name}
                onChange={(e) => form.setValue('name', e.target.value)}
              />
            )}
          </FormRow>
          <FormRow label="직함" optional>
            {({ id }) => (
              <TextField
                id={id}
                value={form.values.title}
                onChange={(e) => form.setValue('title', e.target.value)}
              />
            )}
          </FormRow>
          <FormRow label="연락처" optional hint="장애 대응 시에만 사용합니다">
            {({ id }) => (
              <TextField
                id={id}
                value={form.values.phone}
                onChange={(e) => form.setValue('phone', e.target.value)}
              />
            )}
          </FormRow>
          <FormRow label="이메일" hint="사내 계정과 연결되어 있어 직접 바꿀 수 없습니다. 변경이 필요하면 IT 지원팀에 요청하세요.">
            {({ id }) => (
              <TextField id={id} value="minsu.kim@hct.co.kr" readOnly disabled />
            )}
          </FormRow>
        </FormSection>
      </Form>

      <SaveBar
        visible={form.dirty}
        onSave={form.submit}
        onReset={form.reset}
        saving={form.submitting}
      />
    </>
  )
}

/* ── 비밀번호 ──────────────────────────────────────────────────────
   현재 비밀번호를 반드시 다시 받습니다. 자리를 비운 사이 남이 계정을
   가로채는 것을 막는 마지막 방어선입니다. */
function PasswordSection({ toast }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)

  const strong = next.length >= 8 && /\d/.test(next)
  const match = next && next === confirm
  const canSubmit = current && strong && match && !saving

  const submit = async () => {
    if (!canSubmit) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 700))
    setSaving(false)
    setCurrent(''); setNext(''); setConfirm('')
    toast({ tone: 'success', message: '비밀번호를 변경했습니다' })
  }

  return (
    <Form onSubmit={submit}>
      <FormSection
        title="비밀번호 변경"
        description="바꾸고 나면 이 기기를 제외한 모든 기기에서 로그아웃됩니다."
      >
        <FormRow label="현재 비밀번호">
          {({ id }) => (
            <TextField
              id={id} type="password" autoComplete="current-password"
              value={current} onChange={(e) => setCurrent(e.target.value)}
            />
          )}
        </FormRow>
        <FormRow
          label="새 비밀번호"
          hint="8자 이상, 숫자 포함"
          error={next && !strong ? '8자 이상이면서 숫자를 포함해야 합니다' : undefined}
        >
          {({ id, invalid }) => (
            <TextField
              id={id} type="password" autoComplete="new-password" invalid={invalid}
              value={next} onChange={(e) => setNext(e.target.value)}
            />
          )}
        </FormRow>
        <FormRow
          label="새 비밀번호 확인"
          error={confirm && !match ? '위에 입력한 값과 다릅니다' : undefined}
        >
          {({ id, invalid }) => (
            <TextField
              id={id} type="password" autoComplete="new-password" invalid={invalid}
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
            />
          )}
        </FormRow>
        <FormActions>
          <Button variant="primary" loading={saving} disabled={!canSubmit} onClick={submit}>
            비밀번호 변경
          </Button>
        </FormActions>
      </FormSection>
    </Form>
  )
}

/* ── 접속 중인 기기 ────────────────────────────────────────────────
   이 화면의 목적은 설정이 아니라 **발견**입니다. 사용자가 "내가 안 쓴
   기기"를 찾아낼 수 있어야 하므로, 오래된 접속과 낯선 위치를 눈에 띄게
   합니다. 조용히 목록만 늘어놓으면 아무도 이상을 알아채지 못합니다. */
function SessionsSection({ toast }) {
  const [sessions, setSessions] = useState(SESSIONS)
  const [confirmAll, setConfirmAll] = useState(false)

  const stale = useMemo(
    () => sessions.filter((s) => !s.current && Date.now() - new Date(s.at).getTime() > 30 * 24 * H),
    [sessions],
  )

  const revoke = (id) => {
    const before = sessions
    setSessions((prev) => prev.filter((s) => s.id !== id))
    toast({
      tone: 'success',
      message: '해당 기기를 로그아웃했습니다',
      action: { label: '실행 취소', onClick: () => setSessions(before) },
    })
  }

  const revokeAll = () => {
    setSessions((prev) => prev.filter((s) => s.current))
    setConfirmAll(false)
    /* 여기엔 실행 취소를 두지 않습니다 — 되돌린다고 세션이 살아나지 않습니다.
       되돌릴 수 없는 일에 실행 취소를 보여주는 것이 더 나쁩니다. */
    toast({ tone: 'success', message: '다른 모든 기기에서 로그아웃했습니다' })
  }

  return (
    <>
      <FormSection
        title="접속 중인 기기"
        description="모르는 기기가 있다면 로그아웃한 뒤 비밀번호를 바꾸세요."
        actions={
          <Button
            variant="danger"
            disabled={sessions.length <= 1}
            onClick={() => setConfirmAll(true)}
          >
            다른 기기 모두 로그아웃
          </Button>
        }
      >
        {stale.length > 0 && (
          <Banner tone="warning" title={`${stale.length}개 기기가 30일 넘게 접속하지 않았습니다`}>
            쓰지 않는 기기의 세션은 남겨둘 이유가 없습니다. 정리하는 것을 권합니다.
          </Banner>
        )}

        <ul className="overflow-hidden rounded-md border border-line-subtle">
          {sessions.map((s) => {
            const old = !s.current && Date.now() - new Date(s.at).getTime() > 30 * 24 * H
            return (
              <li
                key={s.id}
                className="flex items-center gap-3 border-b border-line-subtle px-3 py-2.5 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-base font-medium text-fg-primary">{s.device}</span>
                    {s.current && <StatusBadge tone="success" size="sm">이 기기</StatusBadge>}
                    {old && <StatusBadge tone="warning" size="sm">오래됨</StatusBadge>}
                  </div>
                  <p className="mt-0.5 text-sm text-fg-tertiary">
                    {s.where}
                    <span className="mx-1 text-fg-disabled">·</span>
                    <span className="tabular break-token">{s.ip}</span>
                    <span className="mx-1 text-fg-disabled">·</span>
                    <span className="tabular">
                      {s.current ? '지금 사용 중' : `마지막 접속 ${formatRelative(s.at)}`}
                    </span>
                  </p>
                </div>
                {!s.current && (
                  <Button size="sm" variant="secondary" onClick={() => revoke(s.id)}>
                    로그아웃
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      </FormSection>

      <ConfirmDialog
        open={confirmAll}
        onClose={() => setConfirmAll(false)}
        onConfirm={revokeAll}
        tone="danger"
        title="다른 기기를 모두 로그아웃할까요?"
        confirmLabel={`${sessions.length - 1}개 기기 로그아웃`}
      >
        지금 쓰는 기기는 유지됩니다. 나머지 {sessions.length - 1}개 기기는 다시 로그인해야 합니다.
        이 작업은 되돌릴 수 없습니다.
      </ConfirmDialog>
    </>
  )
}

/* ── 알림 설정 ─────────────────────────────────────────────────────
   타입 × 채널 격자입니다. 스위치를 줄줄이 세우는 대신 표로 두면
   "앱은 켜져 있고 메일만 꺼진" 상태가 한눈에 보입니다.

   direct 알림의 앱 채널은 끄지 못하게 합니다. 나를 직접 부른 것까지
   꺼버리면 승인이 무기한 멈추고, 그 책임은 개인이 아니라 제품에
   돌아옵니다. 대신 **왜 못 끄는지**를 적어둡니다. */
function NotificationSection({ toast }) {
  const [prefs, setPrefs] = useState(() =>
    Object.fromEntries(NOTIFICATION_TYPES.map((t) => [t.id, { ...t.defaults }])),
  )

  const set = (typeId, channel, value) => {
    setPrefs((prev) => ({ ...prev, [typeId]: { ...prev[typeId], [channel]: value } }))
    toast({ tone: 'success', message: '알림 설정을 저장했습니다', duration: 1500 })
  }

  const GROUPS = [
    { weight: 'direct', label: '나를 부르는 알림', note: '앱 알림은 끌 수 없습니다 — 승인·담당 지정이 멈추면 다른 사람의 일까지 막힙니다.' },
    { weight: 'subscribed', label: '구독한 항목의 변화', note: '많아지면 먼저 메일부터 끄세요. 앱 인박스는 묶여서 오므로 덜 시끄럽습니다.' },
    { weight: 'digest', label: '요약', note: '실시간이 아니라 모아서 옵니다.' },
  ]

  return (
    <FormSection
      title="알림"
      description="어떤 일이 생겼을 때 어디로 알릴지 정합니다. 앱 알림은 알림 인박스에 쌓입니다."
    >
      {GROUPS.map((g) => (
        <div key={g.weight}>
          <div className="flex items-baseline justify-between gap-3 border-b border-line-subtle pb-1.5">
            <h3 className="text-base font-semibold text-fg-primary">{g.label}</h3>
            <div className="flex shrink-0 gap-6 pr-1">
              <span className="w-8 text-center text-micro font-semibold uppercase tracking-[0.06em] text-fg-tertiary">앱</span>
              <span className="w-8 text-center text-micro font-semibold uppercase tracking-[0.06em] text-fg-tertiary">메일</span>
            </div>
          </div>
          <p className="mt-1.5 text-sm text-fg-tertiary">{g.note}</p>

          <ul className="mt-1.5 mb-4">
            {NOTIFICATION_TYPES.filter((t) => t.weight === g.weight).map((t) => {
              const locked = t.weight === 'direct'
              return (
                <li key={t.id} className="flex items-start gap-3 border-b border-line-subtle py-2 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-fg-secondary">{t.label}</p>
                    <p className="mt-0.5 text-sm text-fg-tertiary">{t.description}</p>
                  </div>
                  <div className="flex shrink-0 gap-6 pt-0.5">
                    <div className="flex w-8 justify-center">
                      {/* 끌 수 없는 항목에 회색 스위치를 두면 "꺼져 있다"로 읽힙니다.
                          껐다 켤 수 없다는 사실을 글자로 말하는 편이 정확합니다. */}
                      {locked ? (
                        <span className="text-micro font-medium text-fg-tertiary">항상</span>
                      ) : (
                        <Switch
                          checked={prefs[t.id].app}
                          onChange={(v) => set(t.id, 'app', v)}
                          hideLabel
                          label={`${t.label} 앱 알림`}
                        />
                      )}
                    </div>
                    <div className="flex w-8 justify-center">
                      <Switch
                        checked={prefs[t.id].email}
                        onChange={(v) => set(t.id, 'email', v)}
                        hideLabel
                        label={`${t.label} 메일 알림`}
                      />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </FormSection>
  )
}
