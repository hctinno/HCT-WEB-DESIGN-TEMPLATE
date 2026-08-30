import { useMemo, useState } from 'react'
import {
  PageContainer, PageHeader,
  Button, Banner, StatusBadge, Progress, SegmentedControl,
  ChartFrame, BarChart, DataGrid, GridCard, StatGrid, WidgetGrid,
  normalizeFields, useToast,
} from '../components'
import { AppFrame } from './_shell'

/**
 * 화면 원형 16: 사용량과 청구
 *
 * 이 화면의 목적은 청구서를 보여주는 게 아니라 **놀라지 않게 하는 것**입니다.
 * 사용량 화면이 실패하는 방식은 하나입니다: 한도를 넘은 **뒤에** 알려주는 것.
 * 그때는 이미 기능이 멈췄거나 예상보다 큰 금액이 찍혀 있습니다.
 *
 * 그래서 세 가지를 앞에 둡니다:
 *
 *   1. **이번 달이 어디까지 왔는지** — 남은 일수와 함께. 20일에 80% 를
 *      쓴 것과 28일에 80% 를 쓴 것은 전혀 다른 상황입니다.
 *   2. **이대로 가면 얼마가 되는지** — 예상치를 먼저 보여줍니다.
 *   3. **한도에 닿으면 무슨 일이 일어나는지** — 막히는지, 초과 요금이
 *      붙는지. 이걸 모르면 사용자는 대비할 수 없습니다.
 */

const PLAN = {
  name: '비즈니스',
  price: 1_200_000,
  seatsIncluded: 25,
  apiCallsIncluded: 500_000,
  storageIncludedGb: 100,
  renewsAt: '2026-09-01',
  overage: { apiPer1k: 900, storagePerGb: 1_200 },
}

/* 이번 청구 주기: 8/1 ~ 8/31, 오늘은 8/30 */
const CYCLE = { day: 30, days: 31 }

const USAGE = {
  seats: { used: 23, limit: PLAN.seatsIncluded, hard: true },
  api: { used: 472_300, limit: PLAN.apiCallsIncluded, hard: false },
  storage: { used: 108.4, limit: PLAN.storageIncludedGb, hard: false, unit: 'GB' },
}

const API_SERIES = [{ key: 'calls', label: 'API 호출' }]
const WEEKLY_API = [
  { label: '1주', values: { calls: 108_000 } },
  { label: '2주', values: { calls: 121_400 } },
  { label: '3주', values: { calls: 118_900 } },
  { label: '4주 (진행 중)', values: { calls: 124_000 } },
]

const INVOICE_FIELDS = normalizeFields([
  { key: 'period', label: '기간', type: 'text', editable: false, width: '132px' },
  { key: 'amount', label: '금액', type: 'number', editable: false, width: '128px' },
  { key: 'state', label: '상태', type: 'select', editable: false, width: '104px', options: [
      { value: 'paid', label: '결제됨', status: 'done' },
      { value: 'due', label: '결제 예정', status: 'inProgress' },
      { value: 'failed', label: '결제 실패', status: 'blocked' },
    ] },
  { key: 'note', label: '내용', type: 'text', editable: false },
])

/* 지난 청구서는 확정값, 이번 달은 계산값입니다.
   진행 중인 달의 금액을 손으로 적어두면 위의 배너·요약과 어긋납니다 —
   같은 화면에서 같은 숫자가 두 값으로 보이면 둘 다 못 믿게 됩니다. */
const PAST_INVOICES = [
  { id: 'i2', period: '2026년 7월', amount: 1_200_000, state: 'paid', note: '기본 요금' },
  { id: 'i3', period: '2026년 6월', amount: 1_236_000, state: 'paid', note: '기본 1,200,000 + 저장 공간 초과 36,000' },
  { id: 'i4', period: '2026년 5월', amount: 1_200_000, state: 'paid', note: '기본 요금' },
]

const won = (n) => `${Math.round(n).toLocaleString('ko-KR')}원`

export function BillingPage({ onNavigate }) {
  const { toast } = useToast()
  const [range, setRange] = useState('month')

  /* 이대로 가면 얼마가 되는지 — 이걸 안 보여주면 월말에 놀랍니다 */
  const projected = useMemo(() => {
    const rate = CYCLE.day / CYCLE.days
    return {
      api: Math.round(USAGE.api.used / rate),
      storage: USAGE.storage.used, /* 저장 공간은 비례해서 늘지 않습니다 */
    }
  }, [])

  const overageWon = useMemo(() => {
    const apiOver = Math.max(0, projected.api - PLAN.apiCallsIncluded)
    const storageOver = Math.max(0, USAGE.storage.used - PLAN.storageIncludedGb)
    return Math.ceil(apiOver / 1000) * PLAN.overage.apiPer1k
      + Math.ceil(storageOver) * PLAN.overage.storagePerGb
  }, [projected])

  const invoices = useMemo(() => [
    {
      id: 'current', period: '2026년 8월 (진행 중)', amount: PLAN.price + overageWon, state: 'due',
      note: overageWon > 0
        ? `기본 ${PLAN.price.toLocaleString('ko-KR')} + 초과 ${overageWon.toLocaleString('ko-KR')} (예상)`
        : '기본 요금 (예상)',
    },
    ...PAST_INVOICES,
  ], [overageWon])

  const warnings = [
    projected.api > PLAN.apiCallsIncluded && 'API 호출',
    USAGE.storage.used > PLAN.storageIncludedGb && '저장 공간',
  ].filter(Boolean)

  return (
    <AppFrame
      active="billing"
      onNavigate={onNavigate}
      counts={{ list: 18, inbox: true, archive: 12 }}
      mentions={{ inbox: 3 }}
    >
      <PageContainer>
        <PageHeader
          title="사용량과 청구"
          description={`${PLAN.name} 요금제 · ${CYCLE.days - CYCLE.day}일 뒤인 ${PLAN.renewsAt} 에 갱신됩니다.`}
          actions={
            <Button variant="secondary" onClick={() => toast({ tone: 'success', message: '청구서를 내려받았습니다' })}>
              청구서 내려받기
            </Button>
          }
        />

        {/* 넘긴 뒤가 아니라 넘기기 전에 말합니다 */}
        {warnings.length > 0 && (
          <Banner tone="warning" title={`이번 달 ${warnings.join(' · ')} 사용량이 포함량을 넘깁니다`} className="mb-3">
            지금 속도라면 초과 요금 약 <strong className="tabular">{won(overageWon)}</strong> 이 더해집니다.
            기능이 멈추지는 않습니다 — 초과분만큼 다음 청구서에 붙습니다.
          </Banner>
        )}

        <StatGrid columns={3} className="mb-4">
          <UsageCard
            label="사용자"
            used={USAGE.seats.used}
            limit={USAGE.seats.limit}
            /* 좌석은 넘길 수 없는 한도입니다 — 다른 둘과 성격이 다르므로 그렇게 말합니다 */
            note={`${USAGE.seats.limit - USAGE.seats.used}자리 남음. 넘으면 초대가 막힙니다.`}
            hard
          />
          <UsageCard
            label="API 호출"
            used={USAGE.api.used}
            limit={USAGE.api.limit}
            note={`이대로면 월말 ${projected.api.toLocaleString('ko-KR')}회 예상 · 1,000회당 ${won(PLAN.overage.apiPer1k)}`}
            projected={projected.api}
          />
          <UsageCard
            label="저장 공간"
            used={USAGE.storage.used}
            limit={USAGE.storage.limit}
            unit="GB"
            note={`포함량을 ${(USAGE.storage.used - USAGE.storage.limit).toFixed(1)}GB 넘겼습니다 · GB당 ${won(PLAN.overage.storagePerGb)}`}
          />
        </StatGrid>

        <WidgetGrid columns={2} className="mb-4">
          <ChartFrame
            title="API 호출 추이"
            description="주 단위. 갑자기 늘었다면 연동이나 스크립트를 확인해 보세요."
            height={200}
            actions={
              <SegmentedControl
                size="sm"
                value={range}
                onChange={setRange}
                options={[{ value: 'month', label: '이번 달' }, { value: 'quarter', label: '3개월' }]}
              />
            }
          >
            <BarChart
              series={API_SERIES}
              data={WEEKLY_API}
              height={200}
              showValues
              formatValue={(n) => `${Math.round(n / 1000).toLocaleString('ko-KR')}천`}
            />
          </ChartFrame>

          <div className="rounded-lg border border-line-subtle bg-bg-surface p-4">
            <h2 className="text-base font-semibold text-fg-primary">이번 달 예상 금액</h2>
            <p className="mt-0.5 text-sm text-fg-tertiary">
              {CYCLE.day}일 / {CYCLE.days}일 지났습니다. 확정 금액은 갱신일에 정해집니다.
            </p>

            {/* dl 의 직계 자식은 dt·dd·div 만 허용됩니다. 합계에 구분선을 주려고
                div 를 한 겹 더 감쌌더니 dt/dd 가 dl 의 자식이 아니게 되었습니다
                (axe: definition-list / dlitem, serious). 구분선은 Line 이 직접 그립니다. */}
            <dl className="mt-3 space-y-2">
              <Line label={`${PLAN.name} 기본 요금`} value={won(PLAN.price)} />
              <Line label="초과 사용 (예상)" value={won(overageWon)} tone={overageWon > 0 ? 'warning' : undefined} />
              <Line label="합계 (예상)" value={won(PLAN.price + overageWon)} strong divided />
            </dl>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary">요금제 바꾸기</Button>
              <Button variant="ghost">결제 수단 관리</Button>
            </div>
            <p className="mt-2 text-sm text-fg-tertiary">
              결제 수단: 신한카드 •••• 4412 · 만료 2028.03
            </p>
          </div>
        </WidgetGrid>

        <h2 className="mb-2 text-base font-semibold text-fg-primary">청구 내역</h2>
        <GridCard>
          <DataGrid
            fields={INVOICE_FIELDS}
            records={invoices}
            selectable={false}
            density="compact"
          />
        </GridCard>
      </PageContainer>
    </AppFrame>
  )
}

/**
 * 사용량 하나.
 *
 * 막대 하나로 "얼마나 썼는지"만 보여주면 부족합니다. 청구 주기에서
 * **오늘이 어디인지**를 같이 표시해야 20일에 80% 인지 29일에 80% 인지
 * 구분됩니다. 그 둘은 전혀 다른 상황입니다.
 */
function UsageCard({ label, used, limit, unit, note, hard = false, projected }) {
  const pct = (used / limit) * 100
  const over = used > limit
  const willOver = projected != null && projected > limit
  const tone = over ? 'danger' : willOver ? 'warning' : pct > 80 ? 'warning' : 'accent'

  const fmt = (n) => (unit ? `${n.toFixed(1)}${unit}` : n.toLocaleString('ko-KR'))

  return (
    <div className={
      'rounded-lg border bg-bg-surface p-3 ' +
      (over ? 'border-danger-border' : willOver ? 'border-warning-border' : 'border-line-subtle')
    }>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-fg-secondary">{label}</span>
        {over && <StatusBadge tone="danger" size="sm">초과</StatusBadge>}
        {!over && willOver && <StatusBadge tone="warning" size="sm">초과 예상</StatusBadge>}
        {hard && !over && <StatusBadge tone="neutral" size="sm">고정 한도</StatusBadge>}
      </div>

      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="tabular text-xl font-semibold text-fg-primary">{fmt(used)}</span>
        <span className="tabular text-sm text-fg-tertiary">/ {fmt(limit)}</span>
      </p>

      {/* 라벨은 위에 이미 크게 적혀 있으므로 이름만 따로 넘깁니다 */}
      <Progress
        className="mt-2"
        value={Math.min(used, limit)}
        max={limit}
        tone={tone}
        name={`${label} 사용량`}
      />

      {/* 청구 주기에서 오늘이 어디인지 — 이게 없으면 80% 를 해석할 수 없습니다 */}
      <div className="mt-1.5 flex items-center gap-1.5">
        <div className="relative h-1 flex-1 rounded-full bg-bg-sunken">
          <span
            className="absolute top-1/2 h-2.5 w-0.5 -translate-y-1/2 rounded-full bg-fg-tertiary"
            style={{ left: `${(CYCLE.day / CYCLE.days) * 100}%` }}
            aria-hidden="true"
          />
        </div>
        <span className="shrink-0 tabular text-micro text-fg-tertiary">
          주기 {CYCLE.day}/{CYCLE.days}일
        </span>
      </div>

      <p className="mt-1.5 text-sm text-fg-tertiary">{note}</p>
    </div>
  )
}

function Line({ label, value, strong, tone, divided }) {
  return (
    <div className={
      'flex items-baseline justify-between gap-3' +
      (divided ? ' border-t border-line-subtle pt-2' : '')
    }>
      <dt className={'text-sm ' + (strong ? 'font-semibold text-fg-primary' : 'text-fg-tertiary')}>
        {label}
      </dt>
      <dd className={
        'tabular ' +
        (strong ? 'text-base font-semibold text-fg-primary'
          : tone === 'warning' ? 'text-sm font-medium text-warning-text'
            : 'text-sm text-fg-secondary')
      }>
        {value}
      </dd>
    </div>
  )
}
