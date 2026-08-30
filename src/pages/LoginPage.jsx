import { useState } from 'react'
import {
  Logo, TextField, Button, Banner, Switch, cn,
} from '../components'

/**
 * 화면 원형 5: 로그인
 *
 * 사내 운영도구의 로그인은 서비스 가입 화면과 다릅니다:
 *   - 가입 유도가 없습니다. 계정은 관리자가 만듭니다
 *   - SSO 가 주 경로이고 비밀번호는 보조입니다
 *   - 실패 사유를 구체적으로 말하되, 계정 존재 여부는 흘리지 않습니다
 *   - 잠긴 계정·권한 없음처럼 "다시 시도해도 소용없는" 실패를 구분합니다
 *
 * 마지막 항목이 중요합니다. "로그인 실패"만 반복하면 사용자는 비밀번호를
 * 열 번 더 틀리고 결국 계정이 잠깁니다.
 */
export function LoginPage({ onSignedIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [state, setState] = useState('idle')
  const [error, setError] = useState(null)
  const [touched, setTouched] = useState({})

  const emailInvalid = touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const canSubmit = email.trim() && password && state !== 'loading'

  const submit = async () => {
    setTouched({ email: true, password: true })
    if (!canSubmit) return
    setState('loading')
    setError(null)
    await new Promise((r) => setTimeout(r, 700))

    /* 데모용 분기 — 실제로는 서버 응답의 오류 코드로 나눕니다 */
    if (password === 'locked') {
      setState('idle')
      setError({
        tone: 'danger',
        title: '계정이 잠겼습니다',
        body: '비밀번호를 5회 연속 틀려 잠금 상태입니다. 30분 뒤 자동으로 풀리거나, 관리자에게 해제를 요청하세요.',
        retryable: false,
      })
      return
    }
    if (password !== 'demo') {
      setState('idle')
      setError({
        tone: 'danger',
        title: '이메일 또는 비밀번호가 올바르지 않습니다',
        /* 어느 쪽이 틀렸는지 밝히지 않습니다 — 계정 존재 여부가 새어 나갑니다 */
        body: '남은 시도 4회. 5회 실패하면 계정이 30분간 잠깁니다.',
        retryable: true,
      })
      return
    }
    setState('done')
    onSignedIn?.()
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-canvas">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-6 flex flex-col items-center gap-3">
            <Logo on="light" height={40} />
            <p className="text-sm text-fg-tertiary">운영 콘솔</p>
          </div>

          <div className="rounded-lg border border-line-subtle bg-bg-surface p-5 shadow-sm">
            <h1 className="text-lg font-semibold text-fg-primary">로그인</h1>
            <p className="mt-1 text-sm text-fg-tertiary">
              사내 계정으로 접속합니다. 계정이 없으면 팀 관리자에게 요청하세요.
            </p>

            {/* SSO 가 주 경로입니다. 비밀번호보다 위에 둡니다. */}
            <Button
              variant="secondary"
              size="lg"
              className="mt-4 w-full"
              iconLeft={<ShieldIcon />}
              onClick={() => onSignedIn?.()}
            >
              회사 계정(SSO)으로 계속
            </Button>

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-line-subtle" />
              <span className="text-xs text-fg-tertiary">또는 비밀번호로</span>
              <span className="h-px flex-1 bg-line-subtle" />
            </div>

            {error && (
              <Banner tone={error.tone} title={error.title} className="mb-3">
                {error.body}
                {!error.retryable && (
                  <div className="mt-2">
                    <a href="#" className="text-sm font-semibold text-danger-text underline underline-offset-2">
                      관리자에게 해제 요청
                    </a>
                  </div>
                )}
              </Banner>
            )}

            <form
              onSubmit={(e) => { e.preventDefault(); submit() }}
              noValidate
              className="space-y-3"
            >
              <TextField
                label="이메일"
                type="email"
                size="lg"
                autoComplete="username"
                placeholder="name@hct.co.kr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                error={emailInvalid ? '올바른 이메일 형식이 아닙니다' : undefined}
              />

              <div>
                <TextField
                  label="비밀번호"
                  type="password"
                  size="lg"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  error={touched.password && !password ? '비밀번호를 입력하세요' : undefined}
                />
                <div className="mt-1.5 flex items-center justify-between">
                  <Switch checked={remember} onChange={setRemember} label="로그인 유지" />
                  <a href="#" className="text-xs font-medium text-fg-link hover:underline">
                    비밀번호 재설정
                  </a>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={state === 'loading'}
                disabled={!canSubmit}
              >
                로그인
              </Button>
            </form>
          </div>

          {/* 사내 도구임을 밝히는 한 줄 — 외부 서비스로 오해하고 개인 계정을
              입력하는 일을 줄입니다. */}
          <p className="mt-4 text-center text-xs leading-5 text-fg-tertiary">
            이 시스템의 접속 기록은 감사 로그에 남습니다.<br />
            문의: 운영팀
          </p>
        </div>
      </main>

      <footer className="border-t border-line-subtle px-4 py-3">
        <p className="text-center text-micro text-fg-tertiary">
          © 2026 주식회사 에이치시티
        </p>
      </footer>
    </div>
  )
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1.5l4.5 1.75v3.5c0 2.6-1.9 4.7-4.5 5.75C4.4 11.45 2.5 9.35 2.5 6.75v-3.5L7 1.5z"
            stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5.25 6.9L6.6 8.25l2.4-2.5" stroke="currentColor" strokeWidth="1.3"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
