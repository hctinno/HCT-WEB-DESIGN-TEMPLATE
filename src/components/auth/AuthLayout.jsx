import { cn } from '../../lib/cn'
import { Logo } from '../shell/Logo'

/**
 * AuthLayout — 로그인·초대 수락·비밀번호 재설정이 공유하는 껍데기.
 *
 * 인증 화면은 앱 셸 밖에 있습니다. 사이드바도 상단바도 없습니다 —
 * 아직 어디에도 들어가지 않았기 때문입니다. 대신 **회사 식별과
 * 지금 무엇을 하는 중인지**만 보여줍니다.
 *
 * 개발 에이전트 사용 규칙:
 *   - 인증 계열 화면은 전부 이걸 씁니다. 각자 카드를 새로 짜지 마세요.
 *   - 로고는 카드가 아니라 **캔버스 위**에 있습니다. 다크 테마에서는 캔버스가
 *     어두워지므로 `on="auto"` 로 두어 면 밝기를 따라가게 합니다.
 *     (`on="light"` 로 고정하면 다크에서 원색 로고가 배경에 묻힙니다.)
 *   - 하단 고지는 사내 시스템임을 밝히는 자리입니다. 지우지 마세요 —
 *     외부 서비스로 오해하고 개인 계정을 넣는 일을 줄입니다.
 */
export function AuthLayout({ subtitle = '운영 콘솔', children, notice, footer, width = 400 }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-canvas">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full" style={{ maxWidth: width }}>
          <div className="mb-6 flex flex-col items-center gap-3">
            <Logo on="auto" height={40} />
            {subtitle && <p className="text-sm text-fg-tertiary">{subtitle}</p>}
          </div>

          <div className="rounded-lg border border-line-subtle bg-bg-surface p-5 shadow-sm">
            {children}
          </div>

          {notice && (
            <p className="mt-4 text-center text-xs leading-5 text-fg-tertiary">{notice}</p>
          )}
          {footer && <div className="mt-4">{footer}</div>}
        </div>
      </main>

      <footer className="border-t border-line-subtle px-4 py-3">
        <p className="text-center text-micro text-fg-tertiary">© 2026 주식회사 에이치시티</p>
      </footer>
    </div>
  )
}

/**
 * PasswordStrength — 새 비밀번호를 정할 때만 씁니다(로그인에는 필요 없습니다).
 *
 * 규칙을 나열만 하고 "8자 이상, 대문자 포함…"으로 혼내는 대신,
 * **무엇이 충족됐고 무엇이 남았는지**를 실시간으로 보여줍니다.
 */
export function PasswordStrength({ value = '', className }) {
  const rules = [
    { key: 'len', label: '8자 이상', ok: value.length >= 8 },
    { key: 'case', label: '대소문자 섞기', ok: /[a-z]/.test(value) && /[A-Z]/.test(value) },
    { key: 'num', label: '숫자 포함', ok: /\d/.test(value) },
    { key: 'sym', label: '기호 포함', ok: /[^A-Za-z0-9]/.test(value) },
  ]
  const met = rules.filter((r) => r.ok).length
  const tone = met <= 1 ? 'danger' : met <= 2 ? 'warning' : met === 3 ? 'info' : 'success'
  const label = met <= 1 ? '약함' : met <= 2 ? '보통' : met === 3 ? '양호' : '강함'

  return (
    <div className={cn('mt-2', className)}>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1" role="presentation">
          {rules.map((r, i) => (
            <span
              key={r.key}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors duration-fast',
                i < met
                  ? { danger: 'bg-danger-solid', warning: 'bg-warning-solid',
                      info: 'bg-info-solid', success: 'bg-success-solid' }[tone]
                  : 'bg-bg-sunken',
              )}
            />
          ))}
        </div>
        <span className={cn('text-xs font-medium', {
          danger: 'text-danger-text', warning: 'text-warning-text',
          info: 'text-info-text', success: 'text-success-text',
        }[tone])}>
          {value ? label : ''}
        </span>
      </div>
      <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
        {rules.map((r) => (
          <li key={r.key} className={cn('text-xs', r.ok ? 'text-success-text' : 'text-fg-tertiary')}>
            <span aria-hidden="true">{r.ok ? '✓' : '○'}</span> {r.label}
            <span className="sr-only">{r.ok ? ' 충족' : ' 미충족'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
