import { cn } from '../../lib/cn'
import { Button } from '../input/Button'
import { Logo } from '../shell/Logo'

/**
 * ErrorPage — 403·404·500·점검 중을 한 컴포넌트로.
 *
 * 이 넷은 화면 구조가 같고 **말해야 할 내용만 다릅니다.**
 * 각자 따로 만들면 어떤 건 재시도 버튼이 있고 어떤 건 없는 식으로 어긋납니다.
 *
 * 오류 화면이 반드시 답해야 하는 세 가지:
 *   1. 무슨 일이 일어났는가 (사용자 말로, 오류 코드가 아니라)
 *   2. 내 잘못인가 시스템 잘못인가
 *   3. 지금 무엇을 하면 되는가
 *
 * 특히 403 은 관리도구에서 흔합니다. "권한이 없습니다"로 끝내지 말고
 * **누구에게 요청하면 되는지**까지 말해야 사용자가 막히지 않습니다.
 */

const PRESETS = {
  403: {
    tone: 'warning',
    title: '이 페이지를 볼 권한이 없습니다',
    body: '현재 역할로는 접근할 수 없는 화면입니다. 필요하다면 워크스페이스 관리자에게 권한을 요청하세요.',
  },
  404: {
    tone: 'neutral',
    title: '페이지를 찾을 수 없습니다',
    body: '주소가 잘못되었거나, 항목이 삭제되었거나, 다른 워크스페이스의 링크일 수 있습니다.',
  },
  500: {
    tone: 'danger',
    title: '문제가 발생했습니다',
    body: '서버에서 요청을 처리하지 못했습니다. 사용자 잘못이 아닙니다. 잠시 후 다시 시도해 주세요.',
  },
  maintenance: {
    tone: 'info',
    title: '점검 중입니다',
    body: '시스템을 업데이트하고 있습니다. 점검이 끝나면 자동으로 다시 접속할 수 있습니다.',
  },
}

const TONE_STYLE = {
  neutral: 'bg-muted-bg text-muted-text border-muted-border',
  info: 'bg-info-bg text-info-text border-info-border',
  warning: 'bg-warning-bg text-warning-text border-warning-border',
  danger: 'bg-danger-bg text-danger-text border-danger-border',
}

/**
 * @param {object} props
 * @param {403|404|500|'maintenance'} props.code
 * @param {string} [props.detail]     - 추적용 정보(요청 ID 등). 접었다 펴게 둡니다
 * @param {React.ReactNode} [props.actions]
 * @param {boolean} [props.inShell]   - 앱 셸 안에 넣을 때(사이드바 유지)
 */
export function ErrorPage({
  code = 404,
  title,
  body,
  detail,
  requestId,
  actions,
  inShell = false,
  eta,
  className,
}) {
  const preset = PRESETS[code] ?? PRESETS[404]

  return (
    <div className={cn(
      'flex flex-col items-center justify-center px-6 text-center',
      /* 셸 안에서도 본문 영역 한가운데에 옵니다 — 위에 붙어 있으면
         아래의 빈 공간이 "덜 그려진 화면"처럼 보입니다. */
      inShell ? 'min-h-[60vh] py-12' : 'min-h-screen bg-bg-canvas py-12',
      className,
    )}>
      {/* 셸 밖에서는 로고가 유일한 단서입니다. 이게 없으면 사용자는
          무엇이 고장났는지, 브라우저인지 제품인지조차 모릅니다. */}
      {!inShell && <Logo on="auto" height={24} className="mb-8" />}

      <span className={cn(
        'mb-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        TONE_STYLE[preset.tone],
      )}>
        {code === 'maintenance' ? '점검' : code}
      </span>

      <h1 className="max-w-[480px] text-xl font-semibold text-fg-primary">
        {title ?? preset.title}
      </h1>
      <p className="mt-2 max-w-[480px] text-base leading-6 text-fg-tertiary">
        {body ?? preset.body}
      </p>

      {eta && (
        <p className="mt-2 text-sm text-fg-secondary">예상 완료: <strong className="tabular">{eta}</strong></p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {actions ?? <Button variant="secondary">대시보드로 돌아가기</Button>}
      </div>

      {/* 추적 정보는 접어 둡니다 — 사용자에게는 소음이지만 문의할 때 필요합니다 */}
      {(requestId || detail) && (
        <details className="mt-6 w-full max-w-[480px] text-left">
          <summary className="cursor-pointer text-xs text-fg-tertiary hover:text-fg-secondary">
            문의에 필요한 정보
          </summary>
          <div className="mt-2 rounded-md border border-line-subtle bg-bg-sunken px-2.5 py-2">
            {requestId && (
              <p className="break-token font-mono text-xs text-fg-secondary">요청 ID: {requestId}</p>
            )}
            {detail && (
              <pre className="mt-1 overflow-x-auto scroll-thin font-mono text-xs text-fg-tertiary">{detail}</pre>
            )}
          </div>
        </details>
      )}
    </div>
  )
}
