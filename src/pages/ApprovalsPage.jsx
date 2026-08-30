import { useMemo, useState } from 'react'
import {
  PageContainer, PageHeader,
  Button, Banner, StatusBadge, SegmentedControl, EmptyState, Avatar,
  TextField, ConfirmDialog, Modal,
  formatRelative, useToast,
} from '../components'
import { AppFrame } from './_shell'

/**
 * 화면 원형 11: 승인 대기함
 *
 * 승인 화면에서 가장 흔한 실패는 **승인 버튼을 누르기 쉽게 만드는 것**입니다.
 * 목록에 체크박스와 "선택 항목 승인" 을 두면 사람들은 읽지 않고 누릅니다.
 * 그러면 승인 절차는 형식만 남고 아무도 막지 못합니다.
 *
 * 그래서 여기서는:
 *   - **무엇이 바뀌는지 목록에서 바로 보입니다.** 열어봐야 알 수 있으면
 *     아무도 열지 않습니다.
 *   - 위험한 항목(권한 상승·삭제·결제)은 **한 건씩만** 처리합니다.
 *   - 반려에는 사유가 필수입니다. 이유 없는 반려는 요청자를 막다른 길에
 *     세웁니다.
 *   - "내가 승인할 것" 과 "내가 요청한 것" 은 다른 탭입니다. 섞으면
 *     자기가 올린 것을 자기가 승인하는 사고가 납니다.
 */

const H = 3600 * 1000
const now = Date.now()
const at = (ms) => new Date(now - ms).toISOString()

/** risk: high 인 항목은 일괄 처리에서 제외됩니다 */
const INCOMING = [
  {
    id: 'ap1', risk: 'high', kind: '권한 변경', requester: '한지우', at: at(0.4 * H),
    title: '강도현을 관리자로 승격',
    reason: '운영 인수인계. 다음 주부터 온콜을 맡습니다.',
    changes: [{ field: '역할', from: '멤버', to: '관리자' }],
    note: '관리자는 사용자·권한·설정을 모두 바꿀 수 있습니다.',
  },
  {
    id: 'ap2', risk: 'high', kind: '설정 변경', requester: '이서연', at: at(2 * H),
    title: '결제 실패 알림 임계값을 1,200 → 3,000 으로',
    reason: '현재 임계값에서 하루 40건씩 오탐이 납니다.',
    changes: [{ field: '오류 총계 임계값', from: '1,200건', to: '3,000건' }],
    note: '임계값을 올리면 그만큼 늦게 알게 됩니다.',
  },
  {
    id: 'ap3', risk: 'normal', kind: '뷰 공유', requester: '정하늘', at: at(5 * H),
    title: '"수집 지연 추적" 뷰를 전체 공개로',
    reason: '데이터팀 외에도 보고 싶다는 요청이 있었습니다.',
    changes: [{ field: '공개 범위', from: '나만', to: '워크스페이스 전체' }],
  },
  {
    id: 'ap4', risk: 'normal', kind: '뷰 공유', requester: '최유진', at: at(28 * H),
    title: '"월간 리포트" 뷰를 사업팀에 공유',
    reason: '월말 보고에 사용합니다.',
    changes: [{ field: '공개 범위', from: '나만', to: '사업팀' }],
  },
]

const OUTGOING = [
  {
    id: 'op1', kind: '데이터 삭제', at: at(3 * H), approver: '한지우', state: 'pending',
    title: 'REQ-0994 외 12건 영구 삭제',
    reason: '중복 등록분 정리',
  },
  {
    id: 'op2', kind: '권한 변경', at: at(26 * H), approver: '한지우', state: 'rejected',
    title: '외부 협력사 계정에 조회 권한 부여',
    reason: '연동 테스트에 필요합니다',
    decision: '계약서에 데이터 접근 조항이 없습니다. 법무 검토 후 다시 올려주세요.',
  },
  {
    id: 'op3', kind: '설정 변경', at: at(50 * H), approver: '한지우', state: 'approved',
    title: '주간 요약 메일 발송 시각을 월요일 09시로',
    reason: '금요일 발송은 아무도 읽지 않습니다',
  },
]

export function ApprovalsPage({ onNavigate }) {
  const { toast } = useToast()
  const [tab, setTab] = useState('incoming')
  const [items, setItems] = useState(INCOMING)
  const [rejecting, setRejecting] = useState(null)
  const [approving, setApproving] = useState(null)

  const highRisk = useMemo(() => items.filter((i) => i.risk === 'high'), [items])

  const decide = (item, decision, note) => {
    const before = items
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    toast({
      tone: decision === 'approved' ? 'success' : 'neutral',
      message: `${item.title} — ${decision === 'approved' ? '승인' : '반려'}했습니다`,
      /* 승인은 즉시 효력이 생기므로 되돌리기를 짧게라도 줍니다 */
      action: { label: '실행 취소', onClick: () => setItems(before) },
    })
    setRejecting(null)
    setApproving(null)
    void note
  }

  return (
    <AppFrame
      active="approvals"
      onNavigate={onNavigate}
      counts={{ list: 18, inbox: true, archive: 12, approvals: items.length || undefined }}
      mentions={{ inbox: 3 }}
    >
      <PageContainer>
        <PageHeader
          title="승인 대기"
          description="다른 사람의 요청을 검토합니다. 승인하면 즉시 적용됩니다."
        />

        <SegmentedControl
          className="mb-3"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'incoming', label: '내가 승인할 것', count: items.length },
            { value: 'outgoing', label: '내가 요청한 것', count: OUTGOING.filter((o) => o.state === 'pending').length },
          ]}
        />

        {tab === 'incoming' ? (
          items.length === 0 ? (
            <EmptyState
              title="승인할 항목이 없습니다"
              description="새 요청이 오면 알림으로 알려드립니다."
            />
          ) : (
            <>
              {highRisk.length > 0 && (
                <Banner tone="warning" title={`되돌리기 어려운 요청 ${highRisk.length}건`} className="mb-3">
                  권한 상승과 임계값 완화는 승인 즉시 효력이 생깁니다. 사유를 읽고 판단하세요.
                </Banner>
              )}
              <ul className="space-y-2">
                {items.map((item) => (
                  <IncomingCard
                    key={item.id}
                    item={item}
                    onApprove={() => setApproving(item)}
                    onReject={() => setRejecting(item)}
                  />
                ))}
              </ul>
            </>
          )
        ) : (
          <OutgoingList items={OUTGOING} />
        )}
      </PageContainer>

      <ConfirmDialog
        open={Boolean(approving)}
        onClose={() => setApproving(null)}
        onConfirm={() => decide(approving, 'approved')}
        tone={approving?.risk === 'high' ? 'danger' : 'default'}
        title="이 요청을 승인할까요?"
        confirmLabel="승인"
      >
        {approving?.title}
        {approving?.note && (
          <span className="mt-2 block text-fg-tertiary">{approving.note}</span>
        )}
      </ConfirmDialog>

      <RejectDialog
        item={rejecting}
        onClose={() => setRejecting(null)}
        onReject={(note) => decide(rejecting, 'rejected', note)}
      />
    </AppFrame>
  )
}

/**
 * 승인 대기 한 건.
 *
 * 카드 안에 **바뀌는 값**을 그대로 넣습니다. 목록에서 제목만 보이고
 * 눌러야 내용을 알 수 있으면, 바쁜 사람은 제목만 보고 승인합니다.
 */
function IncomingCard({ item, onApprove, onReject }) {
  const high = item.risk === 'high'

  return (
    <li className={
      'rounded-lg border bg-bg-surface p-3 ' +
      (high ? 'border-warning-border' : 'border-line-subtle')
    }>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge tone={high ? 'warning' : 'neutral'} size="sm">{item.kind}</StatusBadge>
            {high && <StatusBadge tone="danger" size="sm">되돌리기 어려움</StatusBadge>}
          </div>
          <p className="mt-1 text-base font-semibold text-fg-primary">{item.title}</p>

          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-fg-tertiary">
            <Avatar name={item.requester} />
            <span className="font-medium text-fg-secondary">{item.requester}</span>
            <span className="text-fg-disabled">·</span>
            <span className="tabular">{formatRelative(item.at)}</span>
          </div>

          <p className="mt-1.5 text-sm text-fg-secondary">“{item.reason}”</p>

          {/* 바뀌는 값 — 이게 판단의 근거입니다 */}
          <ul className="mt-2 flex flex-wrap gap-2">
            {item.changes.map((c) => (
              <li key={c.field} className="rounded-md border border-line-subtle bg-bg-sunken px-2 py-1 text-sm">
                <span className="text-fg-tertiary">{c.field} </span>
                <span className="text-fg-secondary line-through">{c.from}</span>
                <span aria-hidden="true" className="mx-1 text-fg-disabled">→</span>
                <span className="font-medium text-fg-primary">{c.to}</span>
              </li>
            ))}
          </ul>

          {item.note && (
            <p className="mt-2 text-sm text-warning-text">{item.note}</p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" onClick={onReject}>반려</Button>
          <Button variant="primary" onClick={onApprove}>승인</Button>
        </div>
      </div>
    </li>
  )
}

/**
 * 반려는 사유가 필수입니다.
 *
 * 이유 없이 반려당한 사람은 무엇을 고쳐야 할지 모르고, 대개 똑같은
 * 요청을 다시 올립니다. 승인자가 두 번 일하게 되는 구조입니다.
 */
function RejectDialog({ item, onClose, onReject }) {
  const [note, setNote] = useState('')

  return (
    <Modal
      open={Boolean(item)}
      onClose={() => { setNote(''); onClose() }}
      title="반려 사유"
      footer={
        <>
          <Button variant="secondary" onClick={() => { setNote(''); onClose() }}>취소</Button>
          <Button
            variant="danger"
            disabled={note.trim().length < 5}
            onClick={() => { onReject(note); setNote('') }}
          >
            반려하기
          </Button>
        </>
      }
    >
      <p className="mb-3 text-sm text-fg-tertiary">{item?.title}</p>
      <TextField
        label="무엇을 고쳐야 다시 올릴 수 있는지 적어주세요"
        placeholder="예: 계약서에 데이터 접근 조항이 없습니다. 법무 검토 후 다시 올려주세요."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        hint={note.trim().length < 5 ? '요청자에게 그대로 전달됩니다. 다섯 글자 이상 적어주세요.' : '요청자에게 그대로 전달됩니다.'}
      />
    </Modal>
  )
}

/**
 * 내가 올린 요청.
 *
 * 여기서 중요한 것은 **지금 누구를 기다리는지**입니다. "대기중" 이라고만
 * 하면 사용자는 며칠씩 아무나 붙잡고 물어봅니다.
 */
function OutgoingList({ items }) {
  const TONE = { pending: 'warning', approved: 'success', rejected: 'danger' }
  const LABEL = { pending: '대기중', approved: '승인됨', rejected: '반려됨' }

  return (
    <ul className="overflow-hidden rounded-lg border border-line-subtle bg-bg-surface">
      {items.map((item) => (
        <li key={item.id} className="border-b border-line-subtle px-3 py-2.5 last:border-b-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge tone={TONE[item.state]} size="sm">{LABEL[item.state]}</StatusBadge>
                <span className="text-xs text-fg-tertiary">{item.kind}</span>
              </div>
              <p className="mt-1 text-base font-medium text-fg-primary">{item.title}</p>
              <p className="mt-0.5 text-sm text-fg-tertiary">
                {item.state === 'pending'
                  ? <>{item.approver} 님의 승인을 기다리는 중 · <span className="tabular">{formatRelative(item.at)} 요청</span></>
                  : <>{item.approver} 님이 <span className="tabular">{formatRelative(item.at)}</span> 처리</>}
              </p>
              {item.decision && (
                <p className="mt-1.5 rounded-md border border-danger-border bg-danger-bg px-2 py-1.5 text-sm text-danger-text">
                  {item.decision}
                </p>
              )}
            </div>
            {item.state === 'pending' && (
              <Button size="sm" variant="ghost">요청 취소</Button>
            )}
            {item.state === 'rejected' && (
              <Button size="sm" variant="secondary">고쳐서 다시 올리기</Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
