import { useMemo, useState } from 'react'
import {
  AppShell, PageContainer, PageHeader,
  Sidebar, SidebarGroup, SidebarItem, WorkspaceSwitcher,
  Topbar, Breadcrumb,
  Form, FormSection, FormRow, FormErrorSummary, SaveBar, SettingsNav, Switch, RadioCards,
  TextField, SelectField, Combobox, Button, Banner, useToast, useForm,
} from '../components'
import { NavIcons } from './_icons'
import { SidebarBrand } from './_brand'

/**
 * 화면 원형 3: 설정
 *
 * 관리도구 설정 화면의 규약을 보여줍니다:
 *   - 좌측 목차 + 우측 섹션 (섹션 제목이 곧 목차)
 *   - 섹션마다 저장 버튼을 두지 않고, 변경이 생기면 하단 저장 바가 뜸
 *   - 무엇이 몇 건 바뀌었는지 표시 — 긴 화면에서 사용자는 기억하지 못함
 *   - 제출 실패 시 오류 요약에서 해당 필드로 이동
 *   - 저장하지 않고 떠나려 하면 브라우저가 확인 (useForm 이 처리)
 */
export function SettingsPage() {
  const { toast } = useToast()
  const [section, setSection] = useState('general')

  /* 목차는 실제로 그 섹션으로 데려가야 합니다.
     상태만 바꾸고 화면이 그대로면 눌리지 않은 것과 같습니다. */
  const goToSection = (id) => {
    setSection(id)
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const initialValues = useMemo(() => ({
    workspaceName: 'HCT 운영',
    environment: 'production',
    defaultOwner: '김민수',
    retentionDays: '90',
    alertThreshold: '800',
    notifyEmail: 'ops@example.com',
    notifyBlocked: true,
    notifyDigest: false,
    digestTime: '09:00',
    density: 'default',
  }), [])

  const validate = (v) => {
    const e = {}
    if (!v.workspaceName?.trim()) e.workspaceName = '이름은 비워 둘 수 없습니다'
    else if (v.workspaceName.length > 40) e.workspaceName = '40자 이하로 입력하세요'

    const days = Number(v.retentionDays)
    if (!Number.isFinite(days) || days < 1) e.retentionDays = '1 이상의 숫자를 입력하세요'
    else if (days > 3650) e.retentionDays = '최대 3650일(10년)까지 설정할 수 있습니다'

    const threshold = Number(v.alertThreshold)
    if (!Number.isFinite(threshold) || threshold < 0) e.alertThreshold = '0 이상의 숫자를 입력하세요'

    if (v.notifyBlocked || v.notifyDigest) {
      if (!v.notifyEmail?.trim()) e.notifyEmail = '알림을 켜려면 수신 주소가 필요합니다'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.notifyEmail)) e.notifyEmail = '올바른 이메일 형식이 아닙니다'
    }
    return e
  }

  const form = useForm({
    initialValues,
    validate,
    onSubmit: async (values, changed) => {
      await new Promise((r) => setTimeout(r, 600)) /* 저장 왕복을 흉내 냅니다 */
      toast({
        message: `설정 ${Object.keys(changed).length}건을 저장했습니다`,
        tone: 'success',
      })
    },
  })

  const LABELS = {
    workspaceName: '워크스페이스 이름',
    retentionDays: '데이터 보존 기간',
    alertThreshold: '오류 임계값',
    notifyEmail: '수신 주소',
  }

  const focusField = (key) => {
    document.getElementById(`f-${key}`)?.focus()
    document.getElementById(`f-${key}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  const SECTIONS = [
    { id: 'general', label: '일반' },
    { id: 'data', label: '데이터' },
    { id: 'alerts', label: '알림' },
    { id: 'display', label: '표시' },
  ]

  return (
    <AppShell
      sidebar={
        <Sidebar header={<SidebarBrand />}>
          <SidebarGroup label="분석">
            <SidebarItem icon={<NavIcons.Dashboard />} label="대시보드" />
          </SidebarGroup>
          <SidebarGroup label="운영">
            <SidebarItem icon={<NavIcons.List />} label="요청" />
          </SidebarGroup>
          <SidebarGroup label="설정">
            <SidebarItem icon={<NavIcons.Settings />} label="환경설정" active />
          </SidebarGroup>
        </Sidebar>
      }
      topbar={<Topbar breadcrumb={
        <Breadcrumb items={[{ label: 'HCT 운영', href: '#' }, { label: '환경설정' }]} />
      } />}
    >
      <PageContainer>
        <PageHeader title="환경설정" description="이 워크스페이스의 동작 방식을 정합니다." />

        <div className="flex gap-6">
          <SettingsNav sections={SECTIONS} activeId={section} onSelect={goToSection} />

          <div className="min-w-0 flex-1 pb-20">
            <Form onSubmit={form.submit}>
              <FormErrorSummary
                errors={form.errors}
                labels={LABELS}
                onFocusField={focusField}
                className="mb-4"
              />

              <FormSection id="sec-general" title="일반" description="워크스페이스의 기본 정보입니다.">
                <FormRow label="워크스페이스 이름" htmlFor="f-workspaceName" error={form.errors.workspaceName}>
                  <TextField
                    id="f-workspaceName" label="워크스페이스 이름" hideLabel
                    {...form.fieldProps('workspaceName')} error={undefined}
                  />
                </FormRow>

                <FormRow label="환경" hint="프로덕션에서는 파괴적 동작에 추가 확인을 요구합니다.">
                  <SelectField
                    label="환경" hideLabel
                    value={form.values.environment}
                    onChange={(e) => form.setValue('environment', e.target.value)}
                    options={[
                      { value: 'production', label: '프로덕션' },
                      { value: 'staging', label: '스테이징' },
                      { value: 'dev', label: '개발' },
                    ]}
                  />
                </FormRow>

                <FormRow label="기본 담당자" optional hint="새 요청이 들어올 때 자동으로 배정됩니다.">
                  <Combobox
                    label="기본 담당자" hideLabel
                    value={form.values.defaultOwner}
                    onChange={(v) => form.setValue('defaultOwner', v)}
                    options={['김민수', '이서연', '박지훈', '최유진', '정하늘'].map((n) => ({ value: n, label: n }))}
                    placeholder="이름으로 검색"
                  />
                </FormRow>
              </FormSection>

              <FormSection id="sec-data" title="데이터" description="보존 정책과 임계값입니다.">
                <FormRow label="데이터 보존 기간" htmlFor="f-retentionDays"
                         error={form.errors.retentionDays}
                         hint="이 기간이 지난 요청은 자동으로 보관 처리됩니다.">
                  <div className="flex items-center gap-2">
                    <TextField
                      id="f-retentionDays" label="보존 기간" hideLabel type="number"
                      className="w-[120px]"
                      {...form.fieldProps('retentionDays')} error={undefined}
                    />
                    <span className="text-base text-fg-tertiary">일</span>
                  </div>
                </FormRow>

                <FormRow label="오류 임계값" htmlFor="f-alertThreshold"
                         error={form.errors.alertThreshold}
                         hint="이 값을 넘으면 대시보드 지표가 주의 상태로 바뀝니다.">
                  <TextField
                    id="f-alertThreshold" label="오류 임계값" hideLabel type="number"
                    className="w-[120px]"
                    {...form.fieldProps('alertThreshold')} error={undefined}
                  />
                </FormRow>
              </FormSection>

              <FormSection id="sec-alerts" title="알림" description="언제 누구에게 알릴지 정합니다.">
                <FormRow label="알림 종류">
                  <div className="space-y-2.5">
                    <Switch
                      checked={form.values.notifyBlocked}
                      onChange={(v) => form.setValue('notifyBlocked', v)}
                      label="차단된 요청이 생기면 즉시"
                      description="담당자 확인이 필요한 상태로 바뀔 때 보냅니다."
                    />
                    <Switch
                      checked={form.values.notifyDigest}
                      onChange={(v) => form.setValue('notifyDigest', v)}
                      label="일일 요약"
                      description="하루치 처리 현황을 한 번에 보냅니다."
                    />
                  </div>
                </FormRow>

                {form.values.notifyDigest && (
                  <FormRow label="요약 발송 시각">
                    <TextField
                      label="발송 시각" hideLabel type="time" className="w-[120px]"
                      value={form.values.digestTime}
                      onChange={(e) => form.setValue('digestTime', e.target.value)}
                    />
                  </FormRow>
                )}

                <FormRow label="수신 주소" htmlFor="f-notifyEmail" error={form.errors.notifyEmail}>
                  <TextField
                    id="f-notifyEmail" label="수신 주소" hideLabel type="email"
                    {...form.fieldProps('notifyEmail')} error={undefined}
                  />
                </FormRow>
              </FormSection>

              <FormSection id="sec-display" title="표시" description="목록의 기본 밀도입니다. 개인 설정으로 덮어쓸 수 있습니다.">
                <FormRow label="기본 밀도">
                  <RadioCards
                    name="density"
                    value={form.values.density}
                    onChange={(v) => form.setValue('density', v)}
                    options={[
                      { value: 'compact', label: '조밀', description: '32px 행. 로그처럼 훑어보는 목록에 적합합니다.' },
                      { value: 'default', label: '기본', description: '40px 행. 대부분의 목록에 알맞습니다.' },
                      { value: 'relaxed', label: '여유', description: '48px 행. 아바타나 여러 줄 내용이 있을 때.' },
                    ]}
                  />
                </FormRow>
              </FormSection>

              <Banner tone="warning" title="위험 구역" className="mt-5">
                <p className="mb-2">워크스페이스를 삭제하면 모든 요청과 이력이 함께 사라집니다.</p>
                <Button variant="danger-subtle" size="sm">워크스페이스 삭제</Button>
              </Banner>
            </Form>
          </div>
        </div>
      </PageContainer>

      <SaveBar
        dirty={form.dirty}
        changedCount={Object.keys(form.changed).length}
        onSave={form.submit}
        onReset={form.reset}
        saving={form.submitting}
        error={form.dirty && !form.valid && Object.keys(form.errors).length > 0
          ? '확인이 필요한 항목이 있습니다' : undefined}
      />
    </AppShell>
  )
}
