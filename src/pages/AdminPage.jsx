import { useMemo, useState } from 'react'
import {
  AppShell, PageContainer, PageHeader,
  Sidebar, SidebarGroup, SidebarItem, WorkspaceSwitcher, WorkspaceRail, SidebarUser,
  Topbar, Breadcrumb,
  DataGrid, GridCard, GridToolbar, GridPagination,
  QueryBar, StatusBadge, Button, IconButton, Modal, ConfirmDialog, Banner,
  TextField, Combobox, SegmentedControl, ActivityFeed, MatrixTable,
  normalizeFields, fieldMap, applyQuery, toggleSort, emptyQuery, useRecords, useToast,
} from '../components'
import { NavIcons } from './_icons'
import { SidebarBrand } from './_brand'

/**
 * 화면 원형 6: 관리자 — 사용자와 권한
 *
 * 관리도구의 관리도구입니다. 여기서 특히 조심할 것:
 *
 *   - **되돌릴 수 없는 일이 많습니다.** 권한 회수, 계정 비활성화는
 *     사람의 작업을 중단시킵니다. 확인 대화상자와 실행 취소를 모두 씁니다.
 *   - **누가 무엇을 바꿨는지 남아야 합니다.** 권한 변경은 감사 대상입니다.
 *   - **자기 권한은 자기가 못 내립니다.** 마지막 관리자가 스스로 강등하면
 *     아무도 시스템을 관리할 수 없게 됩니다.
 */

const ROLES = [
  { value: 'owner',  label: '소유자',   description: '결제·워크스페이스 삭제를 포함한 모든 권한' },
  { value: 'admin',  label: '관리자',   description: '사용자·권한·설정 관리' },
  { value: 'member', label: '멤버',     description: '요청 생성과 처리' },
  { value: 'viewer', label: '조회자',   description: '읽기 전용' },
]

const USER_FIELDS = normalizeFields([
  { key: 'name',  label: '이름',   type: 'text', editable: false, width: '140px' },
  { key: 'email', label: '이메일', type: 'text', editable: false },
  { key: 'role',  label: '역할',   type: 'select', width: '110px', options: ROLES },
  { key: 'status', label: '상태',  type: 'select', width: '100px', options: [
      { value: 'active',  label: '활성',   status: 'active' },
      { value: 'invited', label: '초대됨', status: 'pending' },
      { value: 'disabled', label: '비활성', status: 'inactive' },
    ] },
  { key: 'team',  label: '팀',     type: 'select', width: '110px', options: [
      { value: 'ops', label: '운영' }, { value: 'dev', label: '개발' },
      { value: 'data', label: '데이터' }, { value: 'biz', label: '사업' },
    ] },
  { key: 'lastSeen', label: '마지막 접속', type: 'date', width: '112px', editable: false },
])

const H = 3600 * 1000
const now = Date.now()
const USERS = [
  { id: 'u1', name: '김민수', email: 'minsu.kim@hct.co.kr',  role: 'admin',  status: 'active',   team: 'ops',  lastSeen: new Date(now - 0.3 * H).toISOString() },
  { id: 'u2', name: '이서연', email: 'seoyeon.lee@hct.co.kr', role: 'member', status: 'active',   team: 'dev',  lastSeen: new Date(now - 2 * H).toISOString() },
  { id: 'u3', name: '박지훈', email: 'jihoon.park@hct.co.kr', role: 'member', status: 'active',   team: 'dev',  lastSeen: new Date(now - 5 * H).toISOString() },
  { id: 'u4', name: '최유진', email: 'yujin.choi@hct.co.kr',  role: 'viewer', status: 'active',   team: 'biz',  lastSeen: new Date(now - 30 * H).toISOString() },
  { id: 'u5', name: '정하늘', email: 'haneul.jung@hct.co.kr', role: 'member', status: 'active',   team: 'data', lastSeen: new Date(now - 8 * H).toISOString() },
  { id: 'u6', name: '강도현', email: 'dohyun.kang@hct.co.kr', role: 'viewer', status: 'invited',  team: 'biz',  lastSeen: null },
  { id: 'u7', name: '오세림', email: 'serim.oh@hct.co.kr',    role: 'member', status: 'disabled', team: 'ops',  lastSeen: new Date(now - 900 * H).toISOString() },
  { id: 'u8', name: '한지우', email: 'jiwoo.han@hct.co.kr',   role: 'owner',  status: 'active',   team: 'ops',  lastSeen: new Date(now - 1.2 * H).toISOString() },
]

/** 지금 로그인한 사람 — 자기 권한을 스스로 못 내리게 하는 판단에 씁니다 */
const CURRENT_USER_ID = 'u1'

export function AdminPage() {
  const { toast } = useToast()
  const fields = USER_FIELDS
  const fm = useMemo(() => fieldMap(fields), [fields])

  const { records, editRecord, bulkEdit, activityOf } =
    useRecords(USERS, { actor: '김민수' })

  const [tab, setTab] = useState('users')
  const [query, setQuery] = useState(() => ({ ...emptyQuery(), sort: [{ field: 'lastSeen', direction: 'desc' }] }))
  const [selected, setSelected] = useState(() => new Set())
  const [inviteOpen, setInviteOpen] = useState(false)
  const [confirmDisable, setConfirmDisable] = useState(null)
  const [page, setPage] = useState(1)

  const visible = useMemo(() => applyQuery(records, query, fm), [records, query, fm])
  const admins = records.filter((u) => (u.role === 'owner' || u.role === 'admin') && u.status === 'active')

  /**
   * 역할 변경. 두 가지를 막습니다:
   *   1. 자기 자신을 강등하는 것
   *   2. 마지막 관리자를 없애는 것
   * 둘 다 시스템을 관리 불가 상태로 만듭니다.
   */
  const changeRole = (user, nextRole) => {
    const losingAdmin = (user.role === 'owner' || user.role === 'admin')
      && nextRole !== 'owner' && nextRole !== 'admin'

    if (user.id === CURRENT_USER_ID && losingAdmin) {
      toast({
        message: '자기 권한은 스스로 내릴 수 없습니다. 다른 관리자에게 요청하세요.',
        tone: 'warning',
      })
      return
    }
    if (losingAdmin && admins.length <= 1) {
      toast({
        message: '마지막 관리자입니다. 다른 사람을 먼저 관리자로 지정하세요.',
        tone: 'warning',
      })
      return
    }
    editRecord(user, 'role', nextRole)
    toast({
      message: `${user.name} 님의 역할을 ${ROLES.find((r) => r.value === nextRole)?.label}(으)로 변경했습니다`,
      action: { label: '실행 취소', onClick: () => editRecord({ ...user, role: nextRole }, 'role', user.role) },
    })
  }

  const disableUser = (user) => {
    editRecord(user, 'status', 'disabled')
    setConfirmDisable(null)
    toast({
      message: `${user.name} 님을 비활성화했습니다`,
      tone: 'danger',
      action: { label: '실행 취소', onClick: () => editRecord({ ...user, status: 'disabled' }, 'status', user.status) },
    })
  }

  /* 권한 매트릭스 — 역할이 실제로 무엇을 할 수 있는지 */
  const CAPABILITIES = [
    { key: 'view',    label: '요청 조회',        roles: ['owner', 'admin', 'member', 'viewer'] },
    { key: 'edit',    label: '요청 생성·수정',    roles: ['owner', 'admin', 'member'] },
    { key: 'bulk',    label: '벌크 작업·삭제',    roles: ['owner', 'admin'] },
    { key: 'settings', label: '워크스페이스 설정', roles: ['owner', 'admin'] },
    { key: 'users',   label: '사용자·권한 관리',  roles: ['owner', 'admin'] },
    { key: 'billing', label: '결제·워크스페이스 삭제', roles: ['owner'] },
  ]

  return (
    <>
      <AppShell
        sidebar={
          <Sidebar
            rail={
              <WorkspaceRail
                activeId="prod"
                items={[
                  { id: 'prod', label: 'HCT 프로덕션', initial: 'P' },
                  { id: 'stg', label: 'HCT 스테이징', initial: 'S', badge: 2 },
                ]}
              />
            }
            header={<SidebarBrand />}
            footer={<SidebarUser name="김민수" status="online" detail="관리자" />}
          >
            <SidebarGroup label="분석">
              <SidebarItem icon={<NavIcons.Dashboard />} label="대시보드" />
            </SidebarGroup>
            <SidebarGroup label="운영">
              <SidebarItem icon={<NavIcons.List />} label="요청" badge={18} />
              <SidebarItem icon={<NavIcons.Alert />} label="알림" unread mentions={3} />
            </SidebarGroup>
            <SidebarGroup label="관리">
              <SidebarItem icon={<NavIcons.Users />} label="사용자" active badge={records.length} />
              <SidebarItem icon={<NavIcons.Settings />} label="환경설정" />
            </SidebarGroup>
          </Sidebar>
        }
        topbar={<Topbar breadcrumb={
          <Breadcrumb items={[{ label: 'HCT 운영', href: '#' }, { label: '관리' }, { label: '사용자' }]} />
        } />}
      >
        <PageContainer>
          <PageHeader
            title="사용자와 권한"
            description="이 워크스페이스에 접근할 수 있는 사람과 각자의 권한입니다."
            actions={<Button variant="primary" onClick={() => setInviteOpen(true)}>사용자 초대</Button>}
          />

          {admins.length <= 1 && (
            <Banner tone="warning" title="관리자가 한 명뿐입니다" className="mb-3">
              이 사람이 접속할 수 없게 되면 아무도 권한을 관리할 수 없습니다.
              최소 두 명을 관리자로 두는 것을 권합니다.
            </Banner>
          )}

          <SegmentedControl
            className="mb-3"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'users', label: '사용자', count: records.length },
              { value: 'roles', label: '역할과 권한' },
              { value: 'audit', label: '감사 로그' },
            ]}
          />

          {tab === 'users' && (
            <GridCard>
              <div className="border-b border-line-subtle px-3 py-2">
                <QueryBar
                  fields={fields}
                  query={query}
                  onChange={(next) => { setQuery(next); setPage(1) }}
                  resultCount={visible.length}
                />
              </div>

              <GridToolbar
                left={<span className="tabular text-xs text-fg-tertiary">
                  활성 {records.filter((u) => u.status === 'active').length}명 ·
                  초대됨 {records.filter((u) => u.status === 'invited').length}명 ·
                  비활성 {records.filter((u) => u.status === 'disabled').length}명
                </span>}
              />

              <DataGrid
                fields={fields}
                visibleFields={['name', 'email', 'role', 'status', 'team', 'lastSeen']}
                primaryField="name"
                records={visible}
                density="default"
                sort={query.sort}
                onToggleSort={(k) => setQuery(toggleSort(query, k))}
                selectedKeys={selected}
                onSelectedKeysChange={setSelected}
                searchQuery={query.search}
                onClearFilters={() => setQuery(emptyQuery())}
                /* 역할만 인라인 편집하고, 상태 변경은 확인을 거칩니다 */
                onEditRecord={(user, key, value) => {
                  if (key === 'role') changeRole(user, value)
                  else editRecord(user, key, value)
                }}
                rowActions={(user) => (
                  <>
                    {user.status === 'invited' && (
                      <Button size="xs" variant="ghost"
                              onClick={() => toast({ message: `${user.name} 님에게 초대를 다시 보냈습니다` })}>
                        초대 재발송
                      </Button>
                    )}
                    {user.status !== 'disabled' && user.id !== CURRENT_USER_ID && (
                      <IconButton size="xs" label={`${user.name} 비활성화`} icon={<BanIcon />}
                                  onClick={() => setConfirmDisable(user)} />
                    )}
                  </>
                )}
                bulkActions={
                  <Button size="xs" variant="secondary"
                          onClick={() => {
                            const { count, undo } = bulkEdit(selected, 'team', 'ops')
                            setSelected(new Set())
                            toast({ message: `${count}명을 운영팀으로 옮겼습니다`,
                                    action: { label: '실행 취소', onClick: undo } })
                          }}>
                    팀 변경
                  </Button>
                }
              />
              <GridPagination page={page} pageSize={20} total={visible.length} onPageChange={setPage} />
            </GridCard>
          )}

          {tab === 'roles' && (
            <div className="overflow-hidden rounded-lg border border-line-subtle bg-bg-surface">
              <div className="border-b border-line-subtle px-3 py-2.5">
                <h2 className="text-base font-semibold text-fg-primary">역할별 권한</h2>
                <p className="mt-0.5 text-xs text-fg-tertiary">
                  역할이 실제로 무엇을 할 수 있는지 보여줍니다. 권한을 주기 전에
                  무엇을 주는 것인지 알 수 있어야 합니다.
                </p>
              </div>
              <MatrixTable
                rowHeader="할 수 있는 일"
                columns={ROLES.map((r) => ({
                  key: r.value,
                  label: r.label,
                  hint: records.filter((u) => u.role === r.value).length,
                }))}
                rows={CAPABILITIES.map((c) => ({
                  key: c.key,
                  label: c.label,
                  values: Object.fromEntries(ROLES.map((r) => [r.value, c.roles.includes(r.value)])),
                }))}
              />
              <div className="border-t border-line-subtle bg-bg-sunken px-3 py-2">
                <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                  {ROLES.map((r) => (
                    <div key={r.value} className="flex gap-2 text-xs">
                      <dt className="shrink-0 font-semibold text-fg-secondary">{r.label}</dt>
                      <dd className="text-fg-tertiary">{r.description}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}

          {tab === 'audit' && (
            <div className="rounded-lg border border-line-subtle bg-bg-surface p-4">
              <h2 className="mb-1 text-base font-semibold text-fg-primary">감사 로그</h2>
              <p className="mb-3 text-xs text-fg-tertiary">
                권한 변경은 되돌릴 수 있어도 흔적은 남아야 합니다.
                이 목록은 이번 화면에서 일어난 변경입니다.
              </p>
              <ActivityFeed
                fields={fields}
                items={records.flatMap((u) =>
                  activityOf(u.id).map((a) => ({ ...a, body: a.body, actor: a.actor })))
                  .sort((a, b) => new Date(b.at) - new Date(a.at))}
              />
            </div>
          )}
        </PageContainer>
      </AppShell>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={(payload) => {
          setInviteOpen(false)
          toast({ message: `${payload.email} 로 초대를 보냈습니다`, tone: 'success' })
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmDisable)}
        onClose={() => setConfirmDisable(null)}
        onConfirm={() => disableUser(confirmDisable)}
        tone="danger"
        title={`${confirmDisable?.name} 님을 비활성화할까요?`}
        description="즉시 접속할 수 없게 되며, 진행 중인 작업은 담당자가 없는 상태가 됩니다. 계정과 이력은 남습니다."
        confirmLabel="비활성화"
      />
    </>
  )
}

/** 초대 — 역할을 고르게 하고, 그 역할이 무엇인지 함께 보여줍니다 */
function InviteModal({ open, onClose, onInvite }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [team, setTeam] = useState('ops')
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const selectedRole = ROLES.find((r) => r.value === role)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="사용자 초대"
      description="초대 링크가 담긴 메일이 발송됩니다. 7일 뒤 만료됩니다."
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>취소</Button>
          <Button variant="primary" size="md" disabled={!valid}
                  onClick={() => onInvite({ email, role, team })}>
            초대 보내기
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <TextField
          label="이메일" type="email" placeholder="name@hct.co.kr" data-autofocus
          value={email} onChange={(e) => setEmail(e.target.value)}
          error={email && !valid ? '올바른 이메일 형식이 아닙니다' : undefined}
          hint={!email ? '사내 메일 주소만 초대할 수 있습니다' : undefined}
        />
        <div>
          <Combobox
            label="역할"
            value={role}
            onChange={setRole}
            options={ROLES.map((r) => ({ value: r.value, label: r.label }))}
          />
          {/* 역할을 고른 직후 그 역할이 무엇인지 보여줍니다 —
              나중에 권한 표를 찾아보게 만들지 않습니다 */}
          {selectedRole && (
            <p className="mt-1 text-xs text-fg-tertiary">{selectedRole.description}</p>
          )}
        </div>
        <Combobox
          label="팀"
          value={team}
          onChange={setTeam}
          options={[
            { value: 'ops', label: '운영' }, { value: 'dev', label: '개발' },
            { value: 'data', label: '데이터' }, { value: 'biz', label: '사업' },
          ]}
        />
      </div>
    </Modal>
  )
}

function BanIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4.75" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3.2 3.2l6.6 6.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
