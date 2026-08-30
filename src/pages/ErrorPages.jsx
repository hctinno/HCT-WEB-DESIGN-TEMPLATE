import { useEffect, useRef, useState } from 'react'
import { ErrorPage, Button, Banner, SegmentedControl } from '../components'
import { AppFrame } from './_shell'

/**
 * 오류 화면 4종.
 *
 * 오류 화면은 보통 마지막에 급하게 만들어지고, 그래서 제품에서 가장
 * 어긋난 화면이 됩니다. 네 화면 모두 ErrorPage 하나를 쓰므로 여기서
 * 달라지는 것은 **말과 다음 행동뿐**입니다.
 *
 * 셸 안에 넣을지 밖에 둘지가 실수하기 쉬운 지점입니다:
 *
 *   403·404 — 로그인은 되어 있고 앱 안에서 길을 잘못 든 것뿐입니다.
 *             사이드바를 그대로 두어야 사용자가 다른 곳으로 갈 수 있습니다.
 *             셸을 지우면 "쫓겨난" 느낌이 들고 실제로 갈 곳도 없어집니다.
 *   500·점검 — 앱 자체가 응답하지 못하는 상태입니다. 사이드바를 그리면
 *             누를 수 있을 것처럼 보이지만 전부 같은 오류로 떨어집니다.
 *             거짓 약속이므로 셸을 걷어냅니다.
 */

/* ── 403: 권한 없음 ────────────────────────────────────────────────
   관리도구에서 가장 자주 만나는 오류입니다. "권한이 없습니다"로 끝내면
   사용자는 막힙니다. **누구에게 요청하는지와 요청하는 방법**까지 줘야
   합니다. 요청 버튼이 없으면 사용자는 결국 사람을 찾아 헤맵니다. */
export function ForbiddenPage({ onNavigate }) {
  const [requested, setRequested] = useState(false)
  const [sending, setSending] = useState(false)

  const request = async () => {
    setSending(true)
    await new Promise((r) => setTimeout(r, 600))
    setSending(false)
    setRequested(true)
  }

  return (
    <AppFrame
      active="audit"
      onNavigate={onNavigate}
      counts={{ list: 18, inbox: true }}
      mentions={{ inbox: 3 }}
      breadcrumb={[{ label: 'HCT 운영', href: '#' }, { label: '관리' }, { label: '감사 로그' }]}
    >
      <ErrorPage
        code={403}
        inShell
        body="감사 로그는 관리자만 볼 수 있습니다. 현재 역할은 멤버입니다."
        requestId="req_8f2c41ab"
        detail={'필요 권한: audit.read\n현재 역할: member (운영팀)'}
        actions={
          requested ? (
            <Banner tone="success" title="권한 요청을 보냈습니다" className="text-left">
              한지우 님이 승인하면 알림으로 알려드립니다. 승인 전까지는 이 화면을 볼 수 없습니다.
            </Banner>
          ) : (
            <>
              <Button variant="primary" loading={sending} onClick={request}>
                한지우 님에게 권한 요청
              </Button>
              <Button variant="secondary" onClick={() => onNavigate?.('dashboard')}>
                대시보드로 돌아가기
              </Button>
            </>
          )
        }
      />
    </AppFrame>
  )
}

/* ── 404: 없는 항목 ────────────────────────────────────────────────
   URL 공유를 만들면 반드시 따라옵니다. 원인이 여러 가지(오타·삭제·다른
   워크스페이스)라 단정하지 말고 **확인할 수 있는 길**을 줍니다.
   특히 "다른 워크스페이스"는 레일에 두 개가 있는 이 제품에서 흔합니다. */
export function NotFoundPage({ onNavigate }) {
  return (
    <AppFrame
      active="list"
      onNavigate={onNavigate}
      counts={{ list: 18, inbox: true }}
      mentions={{ inbox: 3 }}
      breadcrumb={[{ label: 'HCT 운영', href: '#' }, { label: '운영' }, { label: '요청' }, { label: 'REQ-4821' }]}
    >
      <ErrorPage
        code={404}
        inShell
        title="REQ-4821을 찾을 수 없습니다"
        body="이 번호의 요청이 없습니다. 삭제되었거나, 다른 워크스페이스의 링크일 수 있습니다."
        actions={
          <>
            <Button variant="primary" onClick={() => onNavigate?.('list')}>
              요청 목록에서 찾기
            </Button>
            <Button variant="secondary">HCT 스테이징에서 열기</Button>
          </>
        }
      />
    </AppFrame>
  )
}

/* ── 500: 서버 오류 ────────────────────────────────────────────────
   여기서 가장 중요한 문장은 "사용자 잘못이 아니다"입니다. 사람은 오류를
   보면 자기가 뭘 잘못 눌렀는지부터 되짚습니다.

   재시도 버튼은 **실제로 재시도해야** 합니다. 눌러도 같은 화면이 나오면
   신뢰를 잃으므로, 시도 횟수를 보여주고 반복 실패하면 다른 길(상태
   페이지·문의)로 안내합니다. */
export function ServerErrorPage({ onNavigate }) {
  const [attempts, setAttempts] = useState(0)
  const [retrying, setRetrying] = useState(false)

  const retry = async () => {
    setRetrying(true)
    await new Promise((r) => setTimeout(r, 900))
    setRetrying(false)
    setAttempts((n) => n + 1)
  }

  return (
    <ErrorPage
      code={500}
      requestId="req_3b7e90d2"
      detail={'2026-08-30 14:22:07 KST\nGET /api/requests?view=overdue\nupstream timeout (30s)'}
      body={
        attempts >= 2
          ? '여러 번 시도했지만 계속 실패합니다. 사용자 잘못이 아니며, 지금은 기다리는 것 말고 할 수 있는 일이 없습니다.'
          : '서버에서 요청을 처리하지 못했습니다. 사용자 잘못이 아닙니다. 방금 입력한 내용은 저장되지 않았습니다.'
      }
      actions={
        <>
          <Button variant="primary" loading={retrying} onClick={retry}>
            {attempts === 0 ? '다시 시도' : `다시 시도 (${attempts}번 실패)`}
          </Button>
          <Button variant="secondary" onClick={() => onNavigate?.('dashboard')}>
            대시보드로 돌아가기
          </Button>
          {attempts >= 2 && <Button variant="ghost">장애 상태 페이지 열기</Button>}
        </>
      }
    />
  )
}

/* ── 점검 중 ───────────────────────────────────────────────────────
   유일하게 **끝나는 시각을 알 수 있는** 오류입니다. 그걸 안 알려주면
   사용자는 5분마다 새로고침합니다. 남은 시간과 자동 재시도를 보여주면
   화면을 닫고 다른 일을 할 수 있습니다. */
export function MaintenancePage() {
  const [left, setLeft] = useState(45)
  const timer = useRef(null)

  useEffect(() => {
    timer.current = setInterval(() => setLeft((s) => (s <= 1 ? 45 : s - 1)), 1000)
    return () => clearInterval(timer.current)
  }, [])

  return (
    <ErrorPage
      code="maintenance"
      eta="2026-08-30 15:00 KST (약 38분 남음)"
      body="데이터베이스를 업그레이드하고 있습니다. 점검 중에는 조회와 저장이 모두 멈춥니다. 진행 중이던 작업은 점검 후 그대로 남아 있습니다."
      actions={
        <>
          <Button variant="secondary">공지 확인</Button>
          <span className="text-sm text-fg-tertiary">
            <strong className="tabular font-medium text-fg-secondary">{left}초</strong> 후 자동으로 다시 확인합니다
          </span>
        </>
      }
    />
  )
}

/* ── 미리보기 전용 ─────────────────────────────────────────────────
   실제 제품에는 이런 전환기가 없습니다. 네 화면을 한 자리에서 비교하기
   위한 껍데기이므로, 복사할 때는 위의 네 컴포넌트만 가져가세요. */
const CASES = [
  { value: '403', label: '403 권한 없음' },
  { value: '404', label: '404 없음' },
  { value: '500', label: '500 장애' },
  { value: 'maintenance', label: '점검 중' },
]

export function ErrorPagesDemo({ onNavigate }) {
  const [which, setWhich] = useState('403')

  return (
    <div className="relative">
      {which === '403' && <ForbiddenPage onNavigate={onNavigate} />}
      {which === '404' && <NotFoundPage onNavigate={onNavigate} />}
      {which === '500' && <ServerErrorPage onNavigate={onNavigate} />}
      {which === 'maintenance' && <MaintenancePage />}

      <div className="fixed left-1/2 top-16 z-overlay flex -translate-x-1/2 items-center gap-2 rounded-lg border border-line-default bg-bg-raised py-1 pl-2.5 pr-1 shadow-overlay">
        {/* fg-tertiary 는 11px 에서 4.44:1 로 기준(4.5)에 살짝 못 미칩니다.
            작은 글자일수록 한 단계 진한 색이 필요합니다. */}
        <span className="text-micro font-semibold uppercase tracking-[0.06em] text-fg-secondary">
          미리보기
        </span>
        <SegmentedControl size="sm" value={which} onChange={setWhich} options={CASES} />
      </div>
    </div>
  )
}
