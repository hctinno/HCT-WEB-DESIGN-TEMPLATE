import { useState } from 'react'
import {
  AuthLayout, PasswordStrength, TextField, Button, Banner, StatusBadge,
} from '../components'

/**
 * 인증 흐름 화면들.
 *
 * 로그인 화면 하나로는 흐름이 완결되지 않습니다. 관리자가 초대를 보내면
 * 받는 쪽 화면이 있어야 하고, 비밀번호를 잊으면 되찾는 길이 있어야 합니다.
 * 셋 다 AuthLayout 을 공유하므로 겉모습이 어긋나지 않습니다.
 */

/**
 * 초대 수락 — 관리자가 보낸 초대를 받아 계정을 만듭니다.
 *
 * 핵심: **누가 어디로 초대했는지 먼저 보여줍니다.** 메일함에서 링크를 눌러
 * 들어온 사람은 자기가 어느 조직에 들어가는지부터 확인하고 싶어 합니다.
 */
export function InviteAcceptPage({ onAccepted }) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [state, setState] = useState('idle')
  const [touched, setTouched] = useState({})

  const strongEnough = password.length >= 8 && /\d/.test(password)
  const mismatch = touched.confirm && confirm && confirm !== password
  const canSubmit = name.trim() && strongEnough && confirm === password && state !== 'loading'

  const submit = async () => {
    setTouched({ name: true, password: true, confirm: true })
    if (!canSubmit) return
    setState('loading')
    await new Promise((r) => setTimeout(r, 700))
    onAccepted?.()
  }

  return (
    <AuthLayout subtitle="초대 수락" notice="이 초대는 발송 후 7일간 유효합니다.">
      {/* 어디로 들어가는지부터 */}
      <div className="mb-4 rounded-md border border-line-subtle bg-bg-sunken px-3 py-2.5">
        <p className="text-sm text-fg-tertiary">초대한 사람</p>
        <p className="mt-0.5 text-base font-medium text-fg-primary">김민수 · 운영팀</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm text-fg-tertiary">워크스페이스</span>
          <span className="text-base font-medium text-fg-primary">HCT 운영 (프로덕션)</span>
          <StatusBadge tone="info" size="sm">멤버</StatusBadge>
        </div>
      </div>

      <h1 className="text-lg font-semibold text-fg-primary">계정 만들기</h1>
      <p className="mt-1 text-sm text-fg-tertiary">
        dohyun.kang@hct.co.kr 로 초대되었습니다. 이 주소는 바꿀 수 없습니다.
      </p>

      <form onSubmit={(e) => { e.preventDefault(); submit() }} noValidate className="mt-4 space-y-3">
        <TextField
          label="이름" size="lg" autoComplete="name" placeholder="강도현"
          value={name} onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          error={touched.name && !name.trim() ? '이름을 입력하세요' : undefined}
          hint="목록과 활동 기록에 표시됩니다"
        />

        <div>
          <TextField
            label="비밀번호" type="password" size="lg" autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          />
          <PasswordStrength value={password} />
        </div>

        <TextField
          label="비밀번호 확인" type="password" size="lg" autoComplete="new-password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
          error={mismatch ? '비밀번호가 일치하지 않습니다' : undefined}
        />

        <Button type="submit" variant="primary" size="lg" className="w-full"
                loading={state === 'loading'} disabled={!canSubmit}>
          계정 만들고 참여
        </Button>
      </form>
    </AuthLayout>
  )
}

/**
 * 비밀번호 재설정 요청.
 *
 * **계정 존재 여부를 흘리지 않습니다.** 보낸 뒤에는 주소가 등록되어 있든
 * 아니든 같은 화면을 보여줍니다. "등록되지 않은 주소입니다"는 공격자에게
 * 계정 목록을 알려주는 것과 같습니다.
 */
export function PasswordResetRequestPage({ onBack }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle')
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  if (state === 'sent') {
    return (
      <AuthLayout subtitle="비밀번호 재설정">
        <div className="text-center">
          <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-success-bg text-success-text">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M2.5 5.5h13v9h-13z" stroke="currentColor" strokeWidth="1.4" />
              <path d="M2.5 5.5L9 10.5l6.5-5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
          </span>
          <h1 className="text-lg font-semibold text-fg-primary">메일을 확인하세요</h1>
          {/* 존재 여부를 밝히지 않는 문구 */}
          <p className="mt-2 text-sm leading-5 text-fg-tertiary">
            <strong className="text-fg-secondary">{email}</strong> 이 등록된 계정이라면
            재설정 링크가 담긴 메일이 도착합니다. 링크는 <strong>1시간</strong> 뒤 만료됩니다.
          </p>
          <p className="mt-3 text-xs text-fg-tertiary">
            메일이 오지 않으면 스팸함을 확인하거나, 몇 분 뒤 다시 시도하세요.
          </p>
          <Button variant="secondary" size="md" className="mt-4 w-full" onClick={onBack}>
            로그인으로 돌아가기
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout subtitle="비밀번호 재설정">
      <h1 className="text-lg font-semibold text-fg-primary">비밀번호를 잊으셨나요</h1>
      <p className="mt-1 text-sm leading-5 text-fg-tertiary">
        가입한 사내 메일 주소를 입력하면 재설정 링크를 보내드립니다.
      </p>

      <form
        onSubmit={async (e) => {
          e.preventDefault()
          if (!valid) return
          setState('loading')
          await new Promise((r) => setTimeout(r, 600))
          setState('sent')
        }}
        noValidate
        className="mt-4 space-y-3"
      >
        <TextField
          label="이메일" type="email" size="lg" autoComplete="username"
          placeholder="name@hct.co.kr"
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" variant="primary" size="lg" className="w-full"
                loading={state === 'loading'} disabled={!valid}>
          재설정 링크 보내기
        </Button>
        <Button variant="ghost" size="md" className="w-full" onClick={onBack}>
          로그인으로 돌아가기
        </Button>
      </form>
    </AuthLayout>
  )
}

/**
 * 새 비밀번호 설정 — 메일 링크로 들어온 화면.
 *
 * **토큰 만료를 반드시 다뤄야 합니다.** 사용자는 메일을 나중에 열기도 하고,
 * 링크를 두 번 쓰기도 합니다. "오류가 발생했습니다"로 끝내면 아무것도 못 합니다.
 */
export function PasswordResetPage({ expired = false, onDone, onRequestAgain }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [state, setState] = useState('idle')

  if (expired) {
    return (
      <AuthLayout subtitle="비밀번호 재설정">
        <Banner tone="warning" title="링크가 만료되었습니다">
          재설정 링크는 발송 후 1시간 동안만 쓸 수 있고, 한 번 사용하면 무효가 됩니다.
          새 링크를 요청하세요.
        </Banner>
        <Button variant="primary" size="lg" className="mt-4 w-full" onClick={onRequestAgain}>
          새 링크 요청
        </Button>
      </AuthLayout>
    )
  }

  const strongEnough = password.length >= 8 && /\d/.test(password)
  const canSubmit = strongEnough && confirm === password && state !== 'loading'

  return (
    <AuthLayout subtitle="비밀번호 재설정">
      <h1 className="text-lg font-semibold text-fg-primary">새 비밀번호 설정</h1>
      <p className="mt-1 text-sm text-fg-tertiary">minsu.kim@hct.co.kr 의 비밀번호를 바꿉니다.</p>

      <form
        onSubmit={async (e) => {
          e.preventDefault()
          if (!canSubmit) return
          setState('loading')
          await new Promise((r) => setTimeout(r, 700))
          onDone?.()
        }}
        noValidate
        className="mt-4 space-y-3"
      >
        <div>
          <TextField label="새 비밀번호" type="password" size="lg" autoComplete="new-password"
                     value={password} onChange={(e) => setPassword(e.target.value)} />
          <PasswordStrength value={password} />
        </div>
        <TextField
          label="새 비밀번호 확인" type="password" size="lg" autoComplete="new-password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)}
          error={confirm && confirm !== password ? '비밀번호가 일치하지 않습니다' : undefined}
        />
        {/* 비밀번호를 바꾸면 다른 기기가 로그아웃된다는 사실을 미리 알립니다 */}
        <p className="text-xs leading-5 text-fg-tertiary">
          비밀번호를 바꾸면 <strong className="text-fg-secondary">모든 기기에서 로그아웃</strong>되고
          다시 로그인해야 합니다.
        </p>
        <Button type="submit" variant="primary" size="lg" className="w-full"
                loading={state === 'loading'} disabled={!canSubmit}>
          비밀번호 변경
        </Button>
      </form>
    </AuthLayout>
  )
}
